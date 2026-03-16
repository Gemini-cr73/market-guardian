from __future__ import annotations

import os

from app.services.crypto_service import fetch_crypto_markets
from app.services.risk_service import evaluate_crypto_risk
from app.services.safety_service import build_safe_entry_checklist
from app.services.trade_history_service import get_portfolio_summary
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")


async def get_ai_trade_advice(symbol: str) -> dict:
    symbol = symbol.upper()

    markets = await fetch_crypto_markets()
    asset = next((coin for coin in markets if coin["symbol"].upper() == symbol), None)

    if not asset:
        return {"error": f"Asset '{symbol}' not found."}

    risk_data = await evaluate_crypto_risk(symbol)
    safety_data = await build_safe_entry_checklist(symbol)
    portfolio_data = get_portfolio_summary()

    if not GROQ_API_KEY:
        return {
            "asset": symbol,
            "model": GROQ_MODEL,
            "market_view": "Groq API key is not configured.",
            "risk_commentary": "Set GROQ_API_KEY in backend/.env to enable AI commentary.",
            "advisor_message": "The advisor is offline until the Groq key is configured.",
            "disclaimer": "This analysis is informational and not financial advice.",
        }

    client = Groq(api_key=GROQ_API_KEY)

    prompt = f"""
You are a cautious crypto market risk analyst inside the Market-Guardian application.

Your job:
- explain current conditions clearly
- stay conservative
- do NOT say "buy now" or "sell now"
- do NOT promise profits
- do NOT provide financial advice
- focus on risk awareness, gradual entry, and disciplined position sizing

Return exactly 3 short sections:
1. Market View
2. Risk Commentary
3. Advisor Message

Asset Data:
- Asset: {asset["symbol"]} ({asset["name"]})
- Price USD: {asset["price_usd"]}
- 24h Change: {asset["change_24h"]}%
- Market Cap: {asset["market_cap"]}
- 24h Volume: {asset["volume_24h"]}

Risk Engine:
- Risk Score: {risk_data.get("risk_score")}
- Risk Level: {risk_data.get("risk_level")}
- Warnings: {risk_data.get("warnings")}

Safety Checklist:
- Safe To Review: {safety_data.get("safe_to_review")}
- Checklist: {safety_data.get("checklist")}
- Education: {safety_data.get("education")}

Portfolio Summary:
- Total Trades: {portfolio_data.get("total_trades")}
- Total Investment: {portfolio_data.get("total_investment")}
- Total Potential Profit: {portfolio_data.get("total_potential_profit")}
- Total Potential Loss: {portfolio_data.get("total_potential_loss")}
- Average Risk Reward Ratio: {portfolio_data.get("average_risk_reward_ratio")}
- Favorable Trades: {portfolio_data.get("favorable_trades")}
- Balanced Trades: {portfolio_data.get("balanced_trades")}
- Aggressive Trades: {portfolio_data.get("aggressive_trades")}

Formatting rules:
- Keep each section concise
- Be educational
- Mention caution if risk is medium or higher
- Mention gradual entries and position sizing when relevant
"""

    completion = client.chat.completions.create(
        model=GROQ_MODEL,
        temperature=0.3,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a cautious crypto risk advisor for a safety-first educational dashboard."
                ),
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
    )

    content = completion.choices[0].message.content.strip()

    market_view = ""
    risk_commentary = ""
    advisor_message = ""

    lines = [line.strip() for line in content.splitlines() if line.strip()]

    current_section = None
    collected = {"market": [], "risk": [], "advisor": []}

    for line in lines:
        lower = line.lower()

        if "market view" in lower:
            current_section = "market"
            continue
        if "risk commentary" in lower:
            current_section = "risk"
            continue
        if "advisor message" in lower:
            current_section = "advisor"
            continue

        if current_section:
            collected[current_section].append(line)

    market_view = " ".join(collected["market"]).strip()
    risk_commentary = " ".join(collected["risk"]).strip()
    advisor_message = " ".join(collected["advisor"]).strip()

    if not market_view and not risk_commentary and not advisor_message:
        market_view = content
        risk_commentary = (
            "Use the internal risk engine and checklist before making decisions."
        )
        advisor_message = "Favor gradual entries and disciplined position sizing."

    return {
        "asset": asset["symbol"],
        "model": GROQ_MODEL,
        "market_view": market_view,
        "risk_commentary": risk_commentary,
        "advisor_message": advisor_message,
        "disclaimer": "This analysis is informational and not financial advice.",
    }
