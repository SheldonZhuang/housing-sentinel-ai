"""
房哨兵 API 示例：拉取全部订阅城市信号 + 阶段跨越检测

用法：
  export HS_API_KEY=hs_live_你的密钥
  python python-example.py

典型场景：放进每日定时任务（cron），阶段发生变化时接入你自己的通知渠道。
数据每日更新一次，轮询间隔建议 ≥ 1 小时。
"""

import json
import os
import urllib.request
from pathlib import Path

API = "https://api.housingsentinel.cn/api/v1"
KEY = os.environ["HS_API_KEY"]
STATE_FILE = Path("last_phases.json")   # 上次各城市阶段，用于跨越检测


def get(path: str) -> dict:
    req = urllib.request.Request(f"{API}{path}", headers={"Authorization": f"Bearer {KEY}"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.load(resp)


def main():
    data = get("/signals")
    if not data.get("success"):
        raise SystemExit(f"请求失败: {data}")

    last = json.loads(STATE_FILE.read_text("utf-8")) if STATE_FILE.exists() else {}
    changes = []

    print(f"{'城市':<6}{'阶段':<10}{'二手周期':>8}{'一手周期':>8}  数据日期")
    for c in data["cities"]:
        sh, fh = c["secondHand"], c["firstHand"]
        print(f"{c['city']:<6}{c['phase']:<10}"
              f"{sh['inventoryCycle'] or '—':>8}{fh['inventoryCycle'] or '—':>8}  {c['dataDate']}")

        prev = last.get(c["cityCode"])
        if prev and prev != c["phase"]:
            changes.append(f"⚡ {c['city']}: {prev} → {c['phase']}（{c['dataDate']}）")
        last[c["cityCode"]] = c["phase"]

    STATE_FILE.write_text(json.dumps(last, ensure_ascii=False, indent=2), "utf-8")

    if changes:
        print("\n=== 阶段跨越提醒（接入你的通知渠道）===")
        for line in changes:
            print(line)
        # TODO: 在这里调用你的通知方式，例如企业微信机器人 / 邮件 / Server酱
        # requests.post(WEBHOOK_URL, json={"msgtype": "text", "text": {"content": "\n".join(changes)}})


if __name__ == "__main__":
    main()
