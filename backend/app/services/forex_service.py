import httpx

FRANKFURTER_API = (
    "https://api.frankfurter.dev/v1/latest?base=USD&symbols=EUR,JPY,GBP,CAD,AUD"
)


async def fetch_forex_rates():
    async with httpx.AsyncClient() as client:
        response = await client.get(FRANKFURTER_API)
        response.raise_for_status()
        data = response.json()

    rates = []

    for symbol, rate in data["rates"].items():
        rates.append(
            {
                "pair": f"USD/{symbol}",
                "base": data["base"],
                "quote": symbol,
                "rate": float(rate),
                "date": data["date"],
            }
        )

    return rates
