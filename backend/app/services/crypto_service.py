import httpx

COINLORE_API = "https://api.coinlore.net/api/tickers/?limit=25"


async def fetch_crypto_markets():
    async with httpx.AsyncClient() as client:
        response = await client.get(COINLORE_API)
        response.raise_for_status()
        data = response.json()

    markets = []

    for coin in data["data"]:
        markets.append(
            {
                "symbol": coin["symbol"],
                "name": coin["name"],
                "price_usd": float(coin["price_usd"]),
                "change_24h": float(coin["percent_change_24h"]),
                "market_cap": float(coin["market_cap_usd"]),
                "volume_24h": float(coin["volume24"]),
            }
        )

    return markets
