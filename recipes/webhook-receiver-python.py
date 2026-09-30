"""Housing Sentinel webhook receiver (Python 3.9+, standard library only)
房哨兵 Webhook 接收与验签示例

    HS_WEBHOOK_SECRET=whsec_xxx python webhook-receiver-python.py

Register the URL with POST https://api.housingsentinel.cn/api/v1/webhooks (see webhook-receiver-node.js
for the curl command). The secret (whsec_...) is returned only once.

Signature header:  X-HS-Signature: t=<unix seconds>,v1=<hex>
                   v1 = HMAC-SHA256(secret, f"{t}.{raw request body}")
"""
import hashlib
import hmac
import json
import os
import time
from http.server import BaseHTTPRequestHandler, HTTPServer

SECRET = os.environ.get("HS_WEBHOOK_SECRET", "")
PORT = int(os.environ.get("PORT", "8787"))
TOLERANCE_SEC = 300  # replay protection: reject timestamps more than 5 minutes off


def verify_signature(raw_body: bytes, header: str, secret: str, now: int = None) -> bool:
    if not header:
        return False
    parts = {}
    for kv in header.split(","):
        k, _, v = kv.partition("=")
        parts[k.strip()] = v.strip()
    try:
        t = int(parts["t"])
        given = parts["v1"]
    except (KeyError, ValueError):
        return False
    now = int(time.time()) if now is None else now
    if abs(now - t) > TOLERANCE_SEC:
        return False
    expected = hmac.new(secret.encode(), f"{t}.".encode() + raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, given)  # constant-time


seen = set()  # X-HS-Delivery de-duplication (use a DB in production)


class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path != "/hs-webhook":
            self.send_response(404)
            self.end_headers()
            return
        raw = self.rfile.read(int(self.headers.get("Content-Length", 0)))  # raw bytes, not re-serialized JSON
        if not verify_signature(raw, self.headers.get("X-HS-Signature", ""), SECRET):
            self.send_response(401)
            self.end_headers()
            self.wfile.write(b"bad signature")
            return
        # Reply within 5 seconds; move slow work to a queue/thread.
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"ok")

        delivery = self.headers.get("X-HS-Delivery")
        if delivery in seen:
            return
        seen.add(delivery)
        evt = json.loads(raw)
        s = evt.get("signal") or {}
        if evt["event"] == "ping":
            print("ping ok", evt["id"])
        elif evt["event"] == "phase.changed":
            print(f"⚡ {s.get('city', evt.get('cityCode'))}: {evt.get('previousPhase')} → {evt.get('phase')} (data {s.get('dataDate')})")
        elif evt["event"] == "data.updated":
            cycle = (s.get("secondHand") or {}).get("inventoryCycle")
            print(f"📊 {s.get('city', evt.get('cityCode'))} {s.get('dataDate')}: {s.get('phase')}, 2nd-hand cycle {cycle} mo")

    def log_message(self, *args):
        pass


if __name__ == "__main__":
    if not SECRET:
        raise SystemExit("Set HS_WEBHOOK_SECRET=whsec_...")
    print(f"listening on http://localhost:{PORT}/hs-webhook")
    HTTPServer(("", PORT), Handler).serve_forever()
