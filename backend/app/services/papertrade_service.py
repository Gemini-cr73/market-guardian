from __future__ import annotations

from app.schemas.papertrade import PaperTradeRequest


def simulate_paper_trade(trade: PaperTradeRequest) -> dict:
    position_size = trade.investment / trade.entry_price

    potential_profit = (trade.target_price - trade.entry_price) * position_size
    potential_loss = (trade.entry_price - trade.stop_loss) * position_size

    if potential_loss <= 0:
        risk_reward_ratio = 0.0
    else:
        risk_reward_ratio = potential_profit / potential_loss

    if risk_reward_ratio >= 2:
        trade_bias = "FAVORABLE"
        guidance = (
            "This setup has a stronger reward profile than risk profile. "
            "Even so, keep position sizing disciplined."
        )
    elif risk_reward_ratio >= 1:
        trade_bias = "BALANCED"
        guidance = (
            "This setup has a moderate risk/reward profile. "
            "Review market conditions and avoid oversized entries."
        )
    else:
        trade_bias = "AGGRESSIVE"
        guidance = (
            "This setup risks more relative to expected reward. "
            "It may be safer to adjust the target, stop-loss, or entry plan."
        )

    return {
        "asset": trade.asset.upper(),
        "entry_price": round(trade.entry_price, 4),
        "investment": round(trade.investment, 2),
        "target_price": round(trade.target_price, 4),
        "stop_loss": round(trade.stop_loss, 4),
        "position_size": round(position_size, 8),
        "potential_profit": round(potential_profit, 2),
        "potential_loss": round(potential_loss, 2),
        "risk_reward_ratio": round(risk_reward_ratio, 2),
        "trade_bias": trade_bias,
        "guidance": guidance,
    }
