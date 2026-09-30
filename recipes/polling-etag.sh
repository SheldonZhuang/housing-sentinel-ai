#!/usr/bin/env bash
# Change-driven polling for Housing Sentinel signals (curl + jq)
# 变化驱动轮询：保存 ETag 与 nextSince，只在数据变化时处理
#
#   HS_KEY=hs_live_xxx ./polling-etag.sh          # run hourly from cron: 0 * * * * /path/polling-etag.sh
#
# First run: no state → full snapshot. Later runs:
#   - If-None-Match: <saved ETag>  → HTTP 304 when nothing changed (no body to parse)
#   - ?since=<saved nextSince>     → only cities whose data changed (changedSince / cities)
set -euo pipefail

: "${HS_KEY:?set HS_KEY=hs_live_...}"
BASE="${HS_BASE:-https://api.housingsentinel.cn/api/v1}"   # mainland China: https://housingpi-proxy-anirmyfaea.cn-shanghai.fcapp.run/api/v1
STATE_DIR="${HS_STATE_DIR:-$HOME/.housing-sentinel}"
mkdir -p "$STATE_DIR"
ETAG_FILE="$STATE_DIR/etag"
SINCE_FILE="$STATE_DIR/next_since"
BODY="$STATE_DIR/last_response.json"
HDRS="$(mktemp)"
trap 'rm -f "$HDRS"' EXIT

URL="$BASE/signals"
if [[ -s "$SINCE_FILE" ]]; then
  URL="$URL?since=$(jq -rn --arg s "$(cat "$SINCE_FILE")" '$s|@uri')"
fi

ARGS=(-sS --max-time 30 -H "Authorization: Bearer $HS_KEY" -D "$HDRS" -o "$BODY.tmp" -w '%{http_code}')
[[ -s "$ETAG_FILE" ]] && ARGS+=(-H "If-None-Match: $(cat "$ETAG_FILE")")

STATUS="$(curl "${ARGS[@]}" "$URL")"

case "$STATUS" in
  304)
    echo "$(date -Is) not modified"
    rm -f "$BODY.tmp"
    exit 0
    ;;
  200) mv "$BODY.tmp" "$BODY" ;;
  400)
    # BAD_SINCE: state file is corrupt → reset and take a full snapshot next run
    echo "$(date -Is) 400: $(cat "$BODY.tmp")" >&2
    rm -f "$SINCE_FILE" "$ETAG_FILE" "$BODY.tmp"
    exit 1
    ;;
  *)
    echo "$(date -Is) HTTP $STATUS: $(cat "$BODY.tmp" 2>/dev/null)" >&2
    rm -f "$BODY.tmp"
    exit 1
    ;;
esac

# Save the ETag (header names are case-insensitive) and the next cursor
ETAG="$(grep -i '^etag:' "$HDRS" | tail -1 | cut -d' ' -f2- | tr -d '\r')"
[[ -n "$ETAG" ]] && printf '%s' "$ETAG" > "$ETAG_FILE"
NEXT="$(jq -r '.nextSince // .generatedAt // empty' "$BODY")"
[[ -n "$NEXT" ]] && printf '%s' "$NEXT" > "$SINCE_FILE"

CHANGED="$(jq -r '(.changedSince // [.cities[].cityCode]) | join(",")' "$BODY")"
if [[ -z "$CHANGED" ]]; then
  echo "$(date -Is) no city changed"
  exit 0
fi

echo "$(date -Is) changed: $CHANGED"
jq -r '.cities[] | "\(.city)\t\(.dataDate)\t\(.phase)\t二手去化 \(.secondHand.inventoryCycle // "—") 月"' "$BODY"
# → send to WeCom / Slack / email here
