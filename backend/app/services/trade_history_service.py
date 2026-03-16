from __future__ import annotations

from datetime import datetime

from app.schemas.papertrade import PaperTradeRequest
from app.services.papertrade_service import simulate_paper_trade

_trade_history: list[dict] = []
_trade_counter = 1


def save_paper_trade(trade: PaperTradeRequest) -> dict:
    global _trade_counter

    simulated = simulate_paper_trade(trade)

    saved_trade = {
        "trade_id": _trade_counter,
        **simulated,
        "created_at": datetime.utcnow().isoformat() + "Z",
    }

    _trade_history.append(saved_trade)
    _trade_counter += 1

    return saved_trade


def get_trade_history() -> list[dict]:
    return _trade_history


def reset_trade_history() -> dict:
    global _trade_history, _trade_counter
    _trade_history = []
    _trade_counter = 1
    return {"message": "Trade history has been reset."}


def get_portfolio_summary() -> dict:
    total_trades = len(_trade_history)

    if total_trades == 0:
        return {
            "total_trades": 0,
            "total_investment": 0.0,
            "total_potential_profit": 0.0,
            "total_potential_loss": 0.0,
            "average_risk_reward_ratio": 0.0,
            "favorable_trades": 0,
            "balanced_trades": 0,
            "aggressive_trades": 0,
        }

    total_investment = sum(t["investment"] for t in _trade_history)
    total_potential_profit = sum(t["potential_profit"] for t in _trade_history)
    total_potential_loss = sum(t["potential_loss"] for t in _trade_history)
    average_risk_reward_ratio = (
        sum(t["risk_reward_ratio"] for t in _trade_history) / total_trades
    )

    favorable_trades = sum(1 for t in _trade_history if t["trade_bias"] == "FAVORABLE")
    balanced_trades = sum(1 for t in _trade_history if t["trade_bias"] == "BALANCED")
    aggressive_trades = sum(
        1 for t in _trade_history if t["trade_bias"] == "AGGRESSIVE"
    )

    return {
        "total_trades": total_trades,
        "total_investment": round(total_investment, 2),
        "total_potential_profit": round(total_potential_profit, 2),
        "total_potential_loss": round(total_potential_loss, 2),
        "average_risk_reward_ratio": round(average_risk_reward_ratio, 2),
        "favorable_trades": favorable_trades,
        "balanced_trades": balanced_trades,
        "aggressive_trades": aggressive_trades,
    }
