from pydantic import BaseModel


class SavedTrade(BaseModel):
    trade_id: int
    asset: str
    entry_price: float
    investment: float
    target_price: float
    stop_loss: float
    position_size: float
    potential_profit: float
    potential_loss: float
    risk_reward_ratio: float
    trade_bias: str
    guidance: str
    created_at: str


class PortfolioSummary(BaseModel):
    total_trades: int
    total_investment: float
    total_potential_profit: float
    total_potential_loss: float
    average_risk_reward_ratio: float
    favorable_trades: int
    balanced_trades: int
    aggressive_trades: int
