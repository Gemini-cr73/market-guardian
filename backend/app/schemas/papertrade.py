from pydantic import BaseModel, Field


class PaperTradeRequest(BaseModel):
    asset: str = Field(..., description="Asset symbol, e.g. BTC")
    entry_price: float = Field(..., gt=0)
    investment: float = Field(..., gt=0)
    target_price: float = Field(..., gt=0)
    stop_loss: float = Field(..., gt=0)


class PaperTradeResponse(BaseModel):
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
