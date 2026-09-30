#!/usr/bin/env node
// Housing Sentinel (房哨兵) MCP stdio bridge.
// Local MCP clients speak JSON-RPC over stdio to this process; every message is
// forwarded unchanged to the remote Streamable HTTP endpoint, and every response
// is written back to stdout. No data is stored locally.
//
// Env:
//   HOUSING_SENTINEL_API_KEY  required, hs_live_... (housingsentinel.cn -> My -> AI Agent)
//   HOUSING_SENTINEL_URL      optional, default https://api.housingsentinel.cn/mcp
//                             (mainland China: https://housingpi-proxy-anirmyfaea.cn-shanghai.fcapp.run/mcp)
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const DEFAULT_URL = 'https://api.housingsentinel.cn/mcp';
const KEY_PAGE = 'https://housingsentinel.cn/agent';
const log = (...a) => console.error('[housing-sentinel-mcp]', ...a); // stdout is reserved for JSON-RPC

const apiKey = (process.env.HOUSING_SENTINEL_API_KEY || '').trim();
if (!apiKey) {
  log(`HOUSING_SENTINEL_API_KEY is not set. Generate a key at ${KEY_PAGE} (free 3-day all-city trial).`);
  process.exit(1);
}

let endpoint;
try {
  endpoint = new URL(process.env.HOUSING_SENTINEL_URL || DEFAULT_URL);
} catch {
  log(`Invalid HOUSING_SENTINEL_URL: ${process.env.HOUSING_SENTINEL_URL}`);
  process.exit(1);
}

const local = new StdioServerTransport();
const remote = new StreamableHTTPClientTransport(endpoint, {
  requestInit: { headers: { Authorization: `Bearer ${apiKey}` } },
});

// HTTP-level failures from the SDK: StreamableHTTPError (code = HTTP status) or UnauthorizedError.
const isHttpFailure = err => !!err && (typeof err.code === 'number' || err.name === 'UnauthorizedError');

// Turn a failed forward into a JSON-RPC error so the client never hangs waiting.
function replyError(msg, err) {
  if (!msg || msg.id === undefined || msg.id === null || !msg.method) return; // notifications/responses get no reply
  const text = String((err && err.message) || err);
  const status = err && typeof err.code === 'number' ? err.code : null;
  // Surface the server's own error body ({ error: { code, message, subscribeUrl } }) when present.
  let upstream = null;
  const brace = text.indexOf('{');
  if (brace >= 0) {
    try {
      upstream = JSON.parse(text.slice(brace)).error || null;
    } catch {
      /* not JSON */
    }
  }
  const unauthorized = status === 401 || (err && err.name === 'UnauthorizedError');
  const detail = (upstream && upstream.message) || text;
  const message = unauthorized
    ? `Unauthorized (HTTP 401): ${detail} Check HOUSING_SENTINEL_API_KEY - ${KEY_PAGE}`
    : `Upstream request failed${status ? ` (HTTP ${status})` : ''}: ${detail}`;
  local
    .send({
      jsonrpc: '2.0',
      id: msg.id,
      error: { code: unauthorized ? -32001 : -32000, message, data: { httpStatus: status, upstream: upstream || text.slice(0, 500) } },
    })
    .catch(() => {});
}

let inflight = 0; // forwards not yet settled; stdin EOF waits for them so piped requests still get answers
let stdinEnded = false;

local.onmessage = async msg => {
  inflight++;
  try {
    await remote.send(msg);
  } catch (err) {
    log(`forward failed (${msg && msg.method ? msg.method : 'message'}):`, (err && err.message) || err);
    replyError(msg, err);
  } finally {
    inflight--;
    if (stdinEnded && inflight === 0) shutdown(0);
  }
};

remote.onmessage = msg => {
  // Remember the negotiated protocol version so later requests send MCP-Protocol-Version.
  if (msg && msg.result && typeof msg.result.protocolVersion === 'string' && remote.setProtocolVersion) {
    remote.setProtocolVersion(msg.result.protocolVersion);
  }
  local.send(msg).catch(err => log('stdout write failed:', err.message));
};

// Send failures are reported per request above; only log other transport errors here.
remote.onerror = err => {
  if (!isHttpFailure(err)) log('remote error:', (err && err.message) || err);
};
local.onerror = err => log('stdio error:', (err && err.message) || err);

let closing = false;
async function shutdown(code = 0) {
  if (closing) return;
  closing = true;
  process.exitCode = code;
  await Promise.allSettled([remote.close(), local.close()]);
  // Give libuv a tick to finish closing the stdin pipe (an immediate exit trips a libuv assertion on Windows).
  setTimeout(() => process.exit(code), 50);
}
process.stdin.on('end', () => {
  stdinEnded = true;
  if (inflight === 0) shutdown(0);
});
process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

await remote.start();
await local.start();
log(`bridging stdio <-> ${endpoint.origin}${endpoint.pathname}`);
