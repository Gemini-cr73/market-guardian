from __future__ import annotations

from app.services.risk_service import evaluate_crypto_risk


async def build_safe_entry_checklist(symbol: str) -> dict:
    risk_data = await evaluate_crypto_risk(symbol)

    if "error" in risk_data:
        return risk_data

    asset = risk_data["asset"]
    name = risk_data["name"]
    risk_level = risk_data["risk_level"]
    change_24h = abs(risk_data["signals"]["change_24h"])
    market_cap = risk_data["signals"]["market_cap"]

    checklist: list[str] = [
        "Position size should stay small relative to account size.",
        "Review recent market news before entering.",
        "Always define a stop-loss or exit plan before risking capital.",
    ]

    if change_24h >= 5:
        checklist.append("Avoid chasing large 24h price spikes.")
    else:
        checklist.append("Avoid impulsive entries even when conditions look calm.")

    if risk_level == "LOW":
        checklist.append("Gradual entry is safer than investing full capital at once.")
        safe_to_review = True
        education = (
            "Safer investing usually means entering gradually, limiting position size, "
            "and avoiding impulsive decisions."
        )
    elif risk_level == "MEDIUM":
        checklist.append("Wait for stronger trend confirmation before entering.")
        checklist.append("Reduce position size until market direction becomes clearer.")
        safe_to_review = True
        education = (
            "Moderate-risk conditions require patience. Smaller entries and confirmation "
            "signals are safer than rushing into the market."
        )
    elif risk_level == "HIGH":
        checklist.append("Wait before entering unless you have a clear strategy.")
        checklist.append("Do not increase position size during volatile moves.")
        safe_to_review = False
        education = (
            "High-risk conditions can produce emotional decisions. It is safer to wait "
            "for better confirmation than to chase volatility."
        )
    else:
        checklist.append("Avoid entering during extreme volatility.")
        checklist.append("Preserve capital and reassess when conditions stabilize.")
        safe_to_review = False
        education = (
            "Extreme-risk conditions are not suitable for beginners. Protecting capital "
            "is more important than trying to catch fast moves."
        )

    if market_cap <= 2_000_000_000:
        checklist.append("Small-cap assets can move sharply; use extra caution.")

    return {
        "asset": asset,
        "name": name,
        "risk_level": risk_level,
        "safe_to_review": safe_to_review,
        "checklist": checklist,
        "education": education,
    }
