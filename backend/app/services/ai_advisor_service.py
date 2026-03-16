from __future__ import annotations

import json
import os
from typing import Any

from app.services.crypto_service import fetch_crypto_markets
from app.services.risk_service import evaluate_crypto_risk
from app.services.safety_service import build_safe_entry_checklist
from app.services.trade_history_service import get_portfolio_summary
from dotenv import load_dotenv
from groq import Groq

load_dotenv()


def _get_groq_settings() -> tuple[str, str]:
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile").strip()
    return api_key, model


def _safe_float(value: Any) -> str:
    try:
        return f"{float(value):,.2f}"
    except (TypeError, ValueError):
        return str(value)


def _extract_json_object(text: str) -> dict[str, Any] | None:
    text = text.strip()

    # Best case: model returns valid JSON directly
    try:
        parsed = json.loads(text)
        if isinstance(parsed, dict):
            return parsed
    except json.JSONDecodeError:
        pass

    # Fallback: extract first JSON object from surrounding text / markdown fences
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        candidate = text[start : end + 1]
        try:
            parsed = json.loads(candidate)
            if isinstance(parsed, dict):
                return parsed
        except json.JSONDecodeError:
            return None

    return None


def _clean_text(value: Any, fallback: str) -> str:
    if value is None:
        return fallback
    cleaned = str(value).strip()
    return cleaned if cleaned else fallback


async def get_ai_trade_advice(symbol: str) -> dict:
    symbol = symbol.upper().strip()

    markets = await fetch_crypto_markets()
    asset = next((coin for coin in markets if coin["symbol"].upper() == symbol), None)

    if not asset:
        return {
            "asset": symbol,
            "model": "unavailable",
            "market_view": f"Asset '{symbol}' was not found in the current market feed.",
            "risk_commentary": "No risk commentary is available because the asset could not be located.",
            "advisor_message": "Please select a supported crypto asset from the dashboard.",
            "disclaimer": "This analysis is informational and not financial advice.",
        }

    risk_data = await evaluate_crypto_risk(symbol)
    safety_data = await build_safe_entry_checklist(symbol)
    portfolio_data = get_portfolio_summary()

    groq_api_key, groq_model = _get_groq_settings()

    if not groq_api_key:
        return {
            "asset": symbol,
            "model": groq_model,
            "market_view": "Groq API key is not configured.",
            "risk_commentary": "Add GROQ_API_KEY to backend/.env locally and to Azure App Service environment variables in production.",
            "advisor_message": "The AI advisor is offline until the Groq key is configured and the API app is restarted.",
            "disclaimer": "This analysis is informational and not financial advice.",
        }

    prompt = f"""
You are a cautious crypto market risk analyst inside the Market-Guardian application.

Your job:
- explain current conditions clearly
- stay conservative
- do NOT say "buy now" or "sell now"
- do NOT promise profits
- do NOT provide financial advice
- focus on risk awareness, gradual entry, and disciplined position sizing

Return ONLY valid JSON.
Do not use markdown.
Do not add explanations before or after the JSON.
Use exactly this schema:

{{
  "market_view": "2 to 4 sentences",
  "risk_commentary": "2 to 4 sentences",
  "advisor_message": "2 to 4 sentences"
}}

Asset Data:
- Asset: {asset["symbol"]} ({asset["name"]})
- Price USD: {_safe_float(asset["price_usd"])}
- 24h Change: {_safe_float(asset["change_24h"])}%
- Market Cap: {_safe_float(asset["market_cap"])}
- 24h Volume: {_safe_float(asset["volume_24h"])}

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
- Keep each field concise
- Be educational
- Mention caution if risk is medium or higher
- Mention gradual entries and position sizing when relevant
"""

    try:
        client = Groq(api_key=groq_api_key)

        completion = client.chat.completions.create(
            model=groq_model,
            temperature=0.2,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a cautious crypto risk advisor for a safety-first "
                        "educational dashboard. You must return only valid JSON."
                    ),
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
        )

        content = (completion.choices[0].message.content or "").strip()
        parsed = _extract_json_object(content)

        if parsed:
            market_view = _clean_text(
                parsed.get("market_view"),
                "Current market conditions are available, but a concise market summary could not be generated.",
            )
            risk_commentary = _clean_text(
                parsed.get("risk_commentary"),
                "Use the internal risk engine and safety checklist before making decisions.",
            )
            advisor_message = _clean_text(
                parsed.get("advisor_message"),
                "Favor gradual entries and disciplined position sizing.",
            )
        else:
            market_view = (
                content
                or "Current market conditions are available, but the AI response format was incomplete."
            )
            risk_commentary = "Use the internal risk engine and safety checklist before making decisions."
            advisor_message = "Favor gradual entries and disciplined position sizing."

        return {
            "asset": asset["symbol"],
            "model": groq_model,
            "market_view": market_view,
            "risk_commentary": risk_commentary,
            "advisor_message": advisor_message,
            "disclaimer": "This analysis is informational and not financial advice.",
        }

    except Exception as exc:
        return {
            "asset": asset["symbol"],
            "model": groq_model,
            "market_view": "The AI advisor could not generate commentary at this time.",
            "risk_commentary": f"Groq request failed: {str(exc)}",
            "advisor_message": "Use the dashboard risk meter, safe-entry checklist, and paper-trading simulator until the AI service is restored.",
            "disclaimer": "This analysis is informational and not financial advice.",
        }
