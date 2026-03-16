from __future__ import annotations

from app.services.crypto_service import fetch_crypto_markets


def _clamp_score(score: int) -> int:
    return max(0, min(score, 100))


def _risk_level(score: int) -> str:
    if score <= 25:
        return "LOW"
    if score <= 50:
        return "MEDIUM"
    if score <= 75:
        return "HIGH"
    return "EXTREME"


async def evaluate_crypto_risk(symbol: str) -> dict:
    markets = await fetch_crypto_markets()
    symbol = symbol.upper()

    asset = next((coin for coin in markets if coin["symbol"].upper() == symbol), None)

    if not asset:
        return {"error": f"Asset '{symbol}' not found."}

    change_24h = abs(asset["change_24h"])
    market_cap = asset["market_cap"]
    volume_24h = asset["volume_24h"]

    score = 0
    warnings: list[str] = []

    # Price movement contribution
    if change_24h < 2:
        score += 15
        warnings.append("Price movement is relatively calm.")
    elif change_24h < 5:
        score += 35
        warnings.append("Price movement is moderate.")
    elif change_24h < 10:
        score += 65
        warnings.append("Price movement is elevated.")
    else:
        score += 85
        warnings.append("Large 24h price swing detected.")

    # Market cap adjustment
    if market_cap >= 100_000_000_000:
        score -= 10
        warnings.append("Large-cap asset lowers extreme-risk probability.")
    elif market_cap <= 2_000_000_000:
        score += 15
        warnings.append("Small-cap asset can be more volatile.")

    # Volume adjustment
    if volume_24h <= 50_000_000:
        score += 10
        warnings.append("Lower volume may increase price instability.")
    elif volume_24h >= 5_000_000_000:
        score -= 5
        warnings.append("Strong trading volume supports market activity.")

    score = _clamp_score(score)
    level = _risk_level(score)

    if level == "LOW":
        recommendation = (
            "Conditions appear relatively stable, but manage position size carefully."
        )
    elif level == "MEDIUM":
        recommendation = "Watch the market and avoid oversized positions."
    elif level == "HIGH":
        recommendation = "Use caution. Wait for stronger confirmation before entering."
    else:
        recommendation = (
            "Risk is elevated. Avoid impulsive entries and reassess market conditions."
        )

    return {
        "asset": asset["symbol"],
        "name": asset["name"],
        "risk_score": score,
        "risk_level": level,
        "signals": {
            "change_24h": asset["change_24h"],
            "market_cap": asset["market_cap"],
            "volume_24h": asset["volume_24h"],
        },
        "warnings": warnings,
        "recommendation": recommendation,
    }
