// Housing Sentinel webhook receiver (Node.js >= 18, no dependencies)
// 房哨兵 Webhook 接收与验签示例
//
//   HS_WEBHOOK_SECRET=whsec_xxx node webhook-receiver-node.js
//
// Register it (your URL must be public https; use a tunnel such as cloudflared/ngrok for local testing):
//   curl -X POST https://api.housingsentinel.cn/api/v1/webhooks \
//     -H "Authorization: Bearer hs_live_xxx" -H "Content-Type: application/json" \
//     -d '{"url":"https://your.domain/hs-webhook","cities":["shenzhen","shanghai"]}'
//   -> save the "secret" (whsec_...) from the response; it is shown only once.
//   curl -X POST https://api.housingsentinel.cn/api/v1/webhooks/<id>/test -H "Authorization: Bearer hs_live_xxx"
//
// Signature: X-HS-Signature: t=<unix seconds>,v1=<hex>
//   v1 = HMAC-SHA256(secret, `${t}.${raw request body}`)
const http = require('node:http');
const crypto = require('node:crypto');

const SECRET = process.env.HS_WEBHOOK_SECRET;
const PORT = Number(process.env.PORT || 8787);
const TOLERANCE_SEC = 300; // reject signatures older/newer than 5 minutes (replay protection)

function verifySignature(rawBody, header, secret, now = Math.floor(Date.now() / 1000)) {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(',').map(kv => {
      const i = kv.indexOf('=');
      return [kv.slice(0, i).trim(), kv.slice(i + 1).trim()];
    }),
  );
  const t = Number(parts.t);
  if (!Number.isInteger(t) || !parts.v1) return false;
  if (Math.abs(now - t) > TOLERANCE_SEC) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${t}.`).update(rawBody).digest();
  let given;
  try {
    given = Buffer.from(parts.v1, 'hex');
  } catch {
    return false;
  }
  // Constant-time compare; lengths must match first (timingSafeEqual throws otherwise).
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
}

module.exports = { verifySignature };

// Run the server only when executed directly (require() just exposes verifySignature).
if (require.main === module) {
  if (!SECRET) {
    console.error('Set HS_WEBHOOK_SECRET=whsec_...');
    process.exit(1);
  }

  const seen = new Set(); // X-HS-Delivery de-duplication (use Redis/DB in production)

  http
    .createServer((req, res) => {
      if (req.method !== 'POST' || req.url !== '/hs-webhook') return res.writeHead(404).end();
      const chunks = [];
      req.on('data', c => chunks.push(c));
      req.on('end', () => {
        const raw = Buffer.concat(chunks); // verify the raw bytes, never re-serialized JSON
        if (!verifySignature(raw, req.headers['x-hs-signature'], SECRET)) {
          return res.writeHead(401).end('bad signature');
        }
        const delivery = req.headers['x-hs-delivery'];
        // Respond within 5 seconds; do slow work asynchronously after replying.
        res.writeHead(200).end('ok');
        if (seen.has(delivery)) return;
        seen.add(delivery);

        const evt = JSON.parse(raw.toString('utf8'));
        if (evt.event === 'ping') return console.log('ping ok', evt.id);
        const s = evt.signal || {};
        if (evt.event === 'phase.changed') {
          console.log(`⚡ ${s.city || evt.cityCode}: ${evt.previousPhase} → ${evt.phase} (data ${s.dataDate})`);
        } else if (evt.event === 'data.updated') {
          console.log(`📊 ${s.city || evt.cityCode} ${s.dataDate}: ${s.phase}, 2nd-hand cycle ${s.secondHand?.inventoryCycle ?? '—'} mo`);
        }
      });
    })
    .listen(PORT, () => console.log(`listening on http://localhost:${PORT}/hs-webhook`));
}
