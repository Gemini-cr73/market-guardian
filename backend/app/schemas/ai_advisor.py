from pydantic import BaseModel


class AIAdvisorResponse(BaseModel):
    asset: str
    model: str
    market_view: str
    risk_commentary: str
    advisor_message: str
    disclaimer: str
