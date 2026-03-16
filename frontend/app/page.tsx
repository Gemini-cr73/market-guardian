"use client";

import {
  ArrowRightLeft,
  BadgeCheck,
  Bot,
  CircleDollarSign,
  Coins,
  History,
  Shield,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AIAdvisorPanel from "../components/AIAdvisorPanel";

type CryptoMarket = {
  symbol: string;
  name: string;
  price_usd: number;
  change_24h: number;
  market_cap: number;
  volume_24h: number;
};

type ForexRate = {
  pair: string;
  base: string;
  quote: string;
  rate: number;
  date: string;
};

type RiskResponse = {
  asset: string;
  name: string;
  risk_score: number;
  risk_level: string;
  signals: {
    change_24h: number;
    market_cap: number;
    volume_24h: number;
  };
  warnings: string[];
  recommendation: string;
};

type SafetyResponse = {
  asset: string;
  name: string;
  risk_level: string;
  safe_to_review: boolean;
  checklist: string[];
  education: string;
};

type PaperTradeResponse = {
  asset: string;
  entry_price: number;
  investment: number;
  target_price: number;
  stop_loss: number;
  position_size: number;
  potential_profit: number;
  potential_loss: number;
  risk_reward_ratio: number;
  trade_bias: string;
  guidance: string;
};

type SavedTrade = {
  trade_id: number;
  asset: string;
  entry_price: number;
  investment: number;
  target_price: number;
  stop_loss: number;
  position_size: number;
  potential_profit: number;
  potential_loss: number;
  risk_reward_ratio: number;
  trade_bias: string;
  guidance: string;
  created_at: string;
};

type PortfolioSummary = {
  total_trades?: number;
  total_investment?: number;
  total_potential_profit?: number;
  total_potential_loss?: number;
  average_risk_reward_ratio?: number;
  favorable_trades?: number;
  balanced_trades?: number;
  aggressive_trades?: number;
};

type AIAdvisorResponse = {
  asset: string;
  model: string;
  market_view: string;
  risk_commentary: string;
  advisor_message: string;
  disclaimer: string;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://guardian-api.ai-coach-lab.com";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value);
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

function riskNeedleRotation(level: string) {
  switch (level) {
    case "LOW":
      return "-55deg";
    case "MEDIUM":
      return "-10deg";
    case "HIGH":
      return "30deg";
    case "EXTREME":
      return "58deg";
    default:
      return "-20deg";
  }
}

function formatDate(dateString: string) {
  try {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

export default function HomePage() {
  const [crypto, setCrypto] = useState<CryptoMarket[]>([]);
  const [forex, setForex] = useState<ForexRate[]>([]);
  const [risk, setRisk] = useState<RiskResponse | null>(null);
  const [safety, setSafety] = useState<SafetyResponse | null>(null);
  const [paperTrade, setPaperTrade] = useState<PaperTradeResponse | null>(null);
  const [tradeHistory, setTradeHistory] = useState<SavedTrade[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [advisor, setAdvisor] = useState<AIAdvisorResponse | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState("BTC");
  const [loadingBase, setLoadingBase] = useState(true);
  const [loadingAsset, setLoadingAsset] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    async function loadBaseDashboard() {
      setLoadingBase(true);

      try {
        const [cryptoRes, forexRes, historyRes, portfolioRes] = await Promise.all([
          fetch(`${API_BASE}/api/crypto/markets`),
          fetch(`${API_BASE}/api/forex/rates`),
          fetch(`${API_BASE}/api/papertrade/history`),
          fetch(`${API_BASE}/api/portfolio/summary`),
        ]);

        const cryptoData = await cryptoRes.json();
        const forexData = await forexRes.json();
        const historyData = await historyRes.json();
        const portfolioData = await portfolioRes.json();

        const cryptoList = Array.isArray(cryptoData) ? cryptoData : [];

        if (!isCancelled) {
          setCrypto(cryptoList);
          setForex(Array.isArray(forexData) ? forexData : []);
          setTradeHistory(Array.isArray(historyData) ? historyData : []);
          setPortfolio(
            portfolioData && typeof portfolioData === "object" ? portfolioData : {}
          );

          const selectedExists = cryptoList.some(
            (coin: CryptoMarket) => coin.symbol === selectedSymbol
          );

          if (!selectedExists && cryptoList.length > 0) {
            const btcExists = cryptoList.find(
              (coin: CryptoMarket) => coin.symbol === "BTC"
            );
            setSelectedSymbol(btcExists ? "BTC" : cryptoList[0].symbol);
          }
        }
      } catch (error) {
        console.error("Base dashboard data failed to load:", error);
        if (!isCancelled) {
          setCrypto([]);
          setForex([]);
          setTradeHistory([]);
          setPortfolio({});
        }
      } finally {
        if (!isCancelled) {
          setLoadingBase(false);
        }
      }
    }

    loadBaseDashboard();

    return () => {
      isCancelled = true;
    };
  }, [selectedSymbol]);

  useEffect(() => {
    let isCancelled = false;

    async function loadSelectedAssetData() {
      setLoadingAsset(true);

      try {
        const [riskRes, safetyRes, advisorRes] = await Promise.all([
          fetch(`${API_BASE}/api/risk/crypto/${selectedSymbol}`),
          fetch(`${API_BASE}/api/safety/crypto/${selectedSymbol}`),
          fetch(`${API_BASE}/api/ai/advisor/${selectedSymbol}`),
        ]);

        const riskData = await riskRes.json();
        const safetyData = await safetyRes.json();
        const advisorData = await advisorRes.json();

        const selectedCoin =
          crypto.find((coin) => coin.symbol === selectedSymbol) ?? null;

        const entryPrice = selectedCoin?.price_usd ?? 100;
        const targetPrice = entryPrice * 1.05;
        const stopLoss = entryPrice * 0.97;

        const tradeRes = await fetch(`${API_BASE}/api/papertrade/simulate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            asset: selectedSymbol,
            entry_price: entryPrice,
            investment: 5000,
            target_price: targetPrice,
            stop_loss: stopLoss,
          }),
        });

        const tradeData = await tradeRes.json();

        if (!isCancelled) {
          setRisk(riskData);
          setSafety(safetyData);
          setAdvisor(advisorData);
          setPaperTrade(tradeData);
        }
      } catch (error) {
        console.error("Selected asset data failed to load:", error);
        if (!isCancelled) {
          setRisk(null);
          setSafety(null);
          setAdvisor(null);
          setPaperTrade(null);
        }
      } finally {
        if (!isCancelled) {
          setLoadingAsset(false);
        }
      }
    }

    if (selectedSymbol) {
      loadSelectedAssetData();
    }

    return () => {
      isCancelled = true;
    };
  }, [selectedSymbol, crypto]);

  const topCrypto = useMemo(() => crypto.slice(0, 5), [crypto]);
  const topForex = useMemo(() => forex.slice(0, 3), [forex]);
  const recentTrades = useMemo(() => tradeHistory.slice(-5).reverse(), [tradeHistory]);

  return (
    <main className="min-h-screen bg-[#050b18] text-white">
      <div className="mx-auto max-w-[1450px] px-8 py-8">
        <header className="mb-8 flex flex-col gap-6 border-b border-white/10 pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 shadow-lg">
              <Shield className="h-9 w-9 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold tracking-wide">MARKET-GUARDIAN</h1>
              <p className="text-sm text-slate-400">Risk-First Crypto & Forex Tracker</p>
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:items-end">
            <nav className="flex flex-wrap gap-3">
              <NavPill icon={<Coins className="h-4 w-4" />} label="Crypto Markets" />
              <NavPill icon={<ArrowRightLeft className="h-4 w-4" />} label="Forex Rates" />
              <NavPill icon={<TriangleAlert className="h-4 w-4" />} label="Risk Meter" />
              <NavPill icon={<BadgeCheck className="h-4 w-4" />} label="Safe Entry" />
              <NavPill icon={<History className="h-4 w-4" />} label="Trade History" />
              <NavPill icon={<Bot className="h-4 w-4" />} label="AI Advisor" />
            </nav>

            <div className="flex items-center gap-3">
              <label htmlFor="crypto-select" className="text-sm font-medium text-slate-300">
                Select Crypto Asset
              </label>

              <select
                id="crypto-select"
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                disabled={loadingBase || crypto.length === 0}
                className="min-w-[240px] rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none transition focus:border-emerald-400/40 disabled:opacity-70"
              >
                {loadingBase ? (
                  <option value="BTC">Loading assets...</option>
                ) : crypto.length === 0 ? (
                  <option value="BTC">No assets available</option>
                ) : (
                  crypto.map((coin) => (
                    <option key={coin.symbol} value={coin.symbol} className="bg-slate-900">
                      {coin.symbol} — {coin.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card title="Crypto Markets">
            <table className="w-full text-left">
              <thead className="text-sm text-slate-400">
                <tr>
                  <th className="pb-4">Symbol</th>
                  <th className="pb-4">Price</th>
                  <th className="pb-4">24h Change</th>
                  <th className="pb-4">Market Cap</th>
                </tr>
              </thead>
              <tbody>
                {topCrypto.length > 0 ? (
                  topCrypto.map((coin) => (
                    <tr
                      key={coin.symbol}
                      className={`border-t border-white/10 ${coin.symbol === selectedSymbol ? "bg-white/5" : ""
                        }`}
                    >
                      <td className="py-4 font-medium">{coin.symbol}</td>
                      <td className="py-4">{formatCurrency(coin.price_usd)}</td>
                      <td
                        className={`py-4 font-semibold ${coin.change_24h >= 0 ? "text-emerald-400" : "text-red-400"
                          }`}
                      >
                        {coin.change_24h >= 0 ? "+" : ""}
                        {coin.change_24h.toFixed(2)}%
                      </td>
                      <td className="py-4">{formatCompact(coin.market_cap)}</td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-t border-white/10">
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      {loadingBase ? "Loading crypto markets..." : "No crypto data available."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>

          <Card title="Forex Exchange Rates">
            <table className="w-full text-left">
              <thead className="text-sm text-slate-400">
                <tr>
                  <th className="pb-4">Pair</th>
                  <th className="pb-4">Rate</th>
                </tr>
              </thead>
              <tbody>
                {topForex.length > 0 ? (
                  topForex.map((item) => (
                    <tr key={item.pair} className="border-t border-white/10">
                      <td className="py-4 font-medium">{item.pair}</td>
                      <td className="py-4">{item.rate}</td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-t border-white/10">
                    <td colSpan={2} className="py-6 text-center text-slate-400">
                      {loadingBase ? "Loading forex rates..." : "No forex data available."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card title={`Risk Meter — ${selectedSymbol}`}>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
              <div className="flex items-center justify-center">
                <div className="relative h-64 w-64">
                  <div className="absolute inset-0 rounded-full border-[18px] border-transparent border-t-red-500 border-r-red-400 border-l-yellow-400 opacity-80" />
                  <div className="absolute inset-[28px] rounded-full border-[18px] border-transparent border-t-orange-400 border-l-emerald-500 border-r-red-500 opacity-70" />
                  <div
                    className="absolute left-1/2 top-1/2 h-24 w-1 -translate-x-1/2 -translate-y-[85%] origin-bottom rounded-full bg-slate-300 shadow-lg transition-transform duration-500"
                    style={{
                      transform: `translateX(-50%) translateY(-85%) rotate(${riskNeedleRotation(
                        risk?.risk_level || "MEDIUM"
                      )})`,
                    }}
                  />
                  <div className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-300" />
                  <div className="absolute inset-x-0 top-[57%] text-center">
                    <p className="text-2xl font-bold text-orange-300">
                      {risk?.risk_level || "MEDIUM"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-center">
                <h3 className="mb-2 text-3xl font-bold text-red-400">
                  {risk?.risk_level || "MEDIUM"} Risk
                </h3>
                <p className="mb-4 text-sm text-slate-400">
                  {risk?.recommendation ||
                    (loadingAsset ? "Loading risk guidance..." : "No recommendation available.")}
                </p>
                <ul className="space-y-3">
                  {(risk?.warnings || []).slice(0, 3).map((warning, index) => (
                    <li key={index} className="flex items-start gap-3 text-lg">
                      <span className="mt-1 text-emerald-400">✓</span>
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>

          <Card title={`Safe Entry Checklist — ${selectedSymbol}`}>
            <table className="w-full text-left">
              <thead className="text-sm text-slate-400">
                <tr>
                  <th className="pb-4">Checklist Item</th>
                </tr>
              </thead>
              <tbody>
                {(safety?.checklist || []).length > 0 ? (
                  (safety?.checklist || []).slice(0, 5).map((item, index) => (
                    <tr key={index} className="border-t border-white/10">
                      <td className="py-4">
                        <div className="flex items-start gap-3">
                          <span className="mt-1 text-emerald-400">✓</span>
                          <span>{item}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-t border-white/10">
                    <td className="py-6 text-center text-slate-400">
                      {loadingAsset ? "Loading checklist..." : "No checklist available."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card title={`Paper Trading Simulator — ${selectedSymbol}`}>
            <table className="w-full text-left">
              <thead className="text-sm text-slate-400">
                <tr>
                  <th className="pb-4">Asset</th>
                  <th className="pb-4">Investment</th>
                  <th className="pb-4">Current Value</th>
                  <th className="pb-4">P&amp;L</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-white/10">
                  <td className="py-4 font-medium">{selectedSymbol}</td>
                  <td className="py-4">{formatCurrency(paperTrade?.investment || 0)}</td>
                  <td className="py-4">
                    {formatCurrency(
                      (paperTrade?.investment || 0) + (paperTrade?.potential_profit || 0)
                    )}
                  </td>
                  <td className="py-4 font-semibold text-emerald-400">
                    +{formatCurrency(paperTrade?.potential_profit || 0)}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="grid grid-cols-2 gap-4 text-sm text-slate-300 md:grid-cols-4">
                <Stat
                  label="Entry"
                  value={paperTrade ? formatCurrency(paperTrade.entry_price) : "..."}
                />
                <Stat
                  label="Target"
                  value={paperTrade ? formatCurrency(paperTrade.target_price) : "..."}
                />
                <Stat
                  label="Stop Loss"
                  value={paperTrade ? formatCurrency(paperTrade.stop_loss) : "..."}
                />
                <Stat
                  label="R/R Ratio"
                  value={String(paperTrade?.risk_reward_ratio ?? 0)}
                />
              </div>
              <p className="mt-4 text-sm text-slate-400">
                {paperTrade?.guidance ||
                  (loadingAsset ? "Loading paper trade guidance..." : "No guidance available.")}
              </p>
            </div>
          </Card>

          <Card title="Portfolio Tracker">
            <div className="grid gap-4 md:grid-cols-2">
              <SummaryBox
                label="Total Trades"
                value={String(portfolio?.total_trades ?? 0)}
                tone="text-cyan-300"
              />
              <SummaryBox
                label="Total Investment"
                value={formatCurrency(portfolio?.total_investment ?? 0)}
                tone="text-violet-300"
              />
              <SummaryBox
                label="Potential Profit"
                value={formatCurrency(portfolio?.total_potential_profit ?? 0)}
                tone="text-emerald-300"
              />
              <SummaryBox
                label="Potential Loss"
                value={formatCurrency(portfolio?.total_potential_loss ?? 0)}
                tone="text-red-300"
              />
              <SummaryBox
                label="Average R/R"
                value={String(portfolio?.average_risk_reward_ratio ?? 0)}
                tone="text-orange-300"
              />
              <SummaryBox
                label="Favorable Trades"
                value={String(portfolio?.favorable_trades ?? 0)}
                tone="text-lime-300"
              />
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Wallet className="h-5 w-5 text-emerald-400" />
                <h3 className="text-lg font-semibold">Portfolio Guidance</h3>
              </div>
              <p className="text-sm leading-7 text-slate-400">
                Diversify entries, monitor risk/reward ratios, and avoid concentrating too much
                simulated capital in a single trade setup.
              </p>
            </div>
          </Card>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-6">
          <Card title="Trade History">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-sm text-slate-400">
                  <tr>
                    <th className="pb-4">ID</th>
                    <th className="pb-4">Asset</th>
                    <th className="pb-4">Investment</th>
                    <th className="pb-4">Profit</th>
                    <th className="pb-4">Loss</th>
                    <th className="pb-4">R/R</th>
                    <th className="pb-4">Bias</th>
                    <th className="pb-4">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTrades.length > 0 ? (
                    recentTrades.map((trade) => (
                      <tr key={trade.trade_id} className="border-t border-white/10">
                        <td className="py-4">{trade.trade_id}</td>
                        <td className="py-4 font-medium">{trade.asset}</td>
                        <td className="py-4">{formatCurrency(trade.investment)}</td>
                        <td className="py-4 text-emerald-400">
                          {formatCurrency(trade.potential_profit)}
                        </td>
                        <td className="py-4 text-red-400">
                          {formatCurrency(trade.potential_loss)}
                        </td>
                        <td className="py-4">{trade.risk_reward_ratio}</td>
                        <td
                          className={`py-4 font-semibold ${trade.trade_bias === "FAVORABLE"
                            ? "text-emerald-400"
                            : trade.trade_bias === "BALANCED"
                              ? "text-yellow-400"
                              : "text-red-400"
                            }`}
                        >
                          {trade.trade_bias}
                        </td>
                        <td className="py-4 text-slate-400">{formatDate(trade.created_at)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr className="border-t border-white/10">
                      <td colSpan={8} className="py-6 text-center text-slate-400">
                        No saved trades yet. Use the backend save endpoint to build history.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </section>

        <section className="mt-6">
          <AIAdvisorPanel advisor={advisor} />
        </section>

        <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card title="Market Summary">
            <div className="grid gap-4 md:grid-cols-2">
              <SummaryBox
                label="Tracked Crypto"
                value={String(crypto?.length ?? 0)}
                tone="text-cyan-300"
              />
              <SummaryBox
                label="Tracked Forex Pairs"
                value={String(forex?.length ?? 0)}
                tone="text-violet-300"
              />
              <SummaryBox
                label={`${selectedSymbol} Risk Score`}
                value={String(risk?.risk_score ?? 0)}
                tone="text-orange-300"
              />
              <SummaryBox
                label="Trade Bias"
                value={paperTrade?.trade_bias ?? "BALANCED"}
                tone="text-emerald-300"
              />
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-2 flex items-center gap-2">
                <CircleDollarSign className="h-5 w-5 text-emerald-400" />
                <h3 className="text-lg font-semibold">Safety Education</h3>
              </div>
              <p className="text-sm leading-7 text-slate-400">
                {safety?.education ||
                  "Safer investing usually means entering gradually, limiting position size, and avoiding impulsive decisions."}
              </p>
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
}

function NavPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-slate-200 shadow-md">
      {icon}
      <span>{label}</span>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.88),rgba(9,14,24,0.96))] p-6 shadow-2xl">
      <h2 className="mb-5 text-2xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-base font-semibold text-white">{value}</p>
    </div>
  );
}

function SummaryBox({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}
