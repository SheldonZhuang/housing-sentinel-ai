"""OpenAI Agents SDK + Housing Sentinel MCP (Streamable HTTP)
房哨兵 MCP 接入 OpenAI Agents SDK 示例

    pip install openai-agents
    export OPENAI_API_KEY=sk-...
    export HOUSING_SENTINEL_API_KEY=hs_live_...
    python openai-agents-sdk.py

From mainland China, set HOUSING_SENTINEL_URL=https://housingpi-proxy-anirmyfaea.cn-shanghai.fcapp.run/mcp
"""
import asyncio
import os

from agents import Agent, Runner
from agents.mcp import MCPServerStreamableHttp

MCP_URL = os.environ.get("HOUSING_SENTINEL_URL", "https://api.housingsentinel.cn/mcp")
API_KEY = os.environ["HOUSING_SENTINEL_API_KEY"]


async def main() -> None:
    async with MCPServerStreamableHttp(
        name="housing-sentinel",
        params={
            "url": MCP_URL,
            "headers": {"Authorization": f"Bearer {API_KEY}"},
            "timeout": 30,
        },
        cache_tools_list=True,  # tool list is static; skip re-listing on every run
    ) as server:
        agent = Agent(
            name="Housing analyst",
            instructions=(
                "You analyse Chinese housing markets with the housing-sentinel tools. "
                "Use get_market_signal for current phases; use get_metrics for trends. "
                "Months-of-supply >=18 = defense, 12-18 = watch, 8-12 = buy, <8 = strong buy. "
                "Always state the data date and that this is not investment advice."
            ),
            mcp_servers=[server],
        )
        result = await Runner.run(agent, "深圳和上海现在分别处于什么市场阶段？二手去化周期多少个月？")
        print(result.final_output)

        # MCP prompts are available too:
        prompt = await server.get_prompt("daily_brief", {"cities": "shenzhen,shanghai"})
        print(prompt.messages[0].content.text[:200], "...")


if __name__ == "__main__":
    asyncio.run(main())
