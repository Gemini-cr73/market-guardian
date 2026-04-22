import os

from app.schemas.papertrade import PaperTradeRequest
from app.services.ai_advisor_service import get_ai_trade_advice
from app.services.crypto_service import fetch_crypto_markets
from app.services.forex_service import fetch_forex_rates
from app.services.papertrade_service import simulate_paper_trade
from app.services.risk_service import evaluate_crypto_risk
from app.services.safety_service import build_safe_entry_checklist
from app.services.trade_history_service import (
    get_portfolio_summary,
    get_trade_history,
    reset_trade_history,
    save_paper_trade,
)
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Market-Guardian API")

# Prefer env-driven CORS for production, with safe defaults.
default_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "https://guardian.ai-coach-lab.com",
    "https://market-guardian-ui-prod-bdehcxhna9ehhvcz.eastus-01.azurewebsites.net",
]

cors_env = os.getenv("ALLOWED_ORIGINS", "").strip()
allowed_origins = (
    [origin.strip() for origin in cors_env.split(",") if origin.strip()]
    if cors_env
    else default_origins
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "Market-Guardian API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/api/crypto/markets")
async def crypto_markets():
    return await fetch_crypto_markets()


@app.get("/api/forex/rates")
async def forex_rates():
    return await fetch_forex_rates()


@app.get("/api/risk/crypto/{symbol}")
async def crypto_risk(symbol: str):
    return await evaluate_crypto_risk(symbol)


@app.get("/api/safety/crypto/{symbol}")
async def crypto_safety(symbol: str):
    return await build_safe_entry_checklist(symbol)


@app.post("/api/papertrade/simulate")
async def papertrade_simulate(trade: PaperTradeRequest):
    return simulate_paper_trade(trade)


@app.post("/api/papertrade/save")
async def papertrade_save(trade: PaperTradeRequest):
    return save_paper_trade(trade)


@app.get("/api/papertrade/history")
async def papertrade_history():
    return get_trade_history()


@app.get("/api/portfolio/summary")
async def portfolio_summary():
    return get_portfolio_summary()


@app.delete("/api/papertrade/reset")
async def papertrade_reset():
    return reset_trade_history()


@app.get("/api/ai/advisor/{symbol}")
async def ai_advisor(symbol: str):
    return await get_ai_trade_advice(symbol)
