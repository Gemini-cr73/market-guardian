type AIAdvisorResponse = {
    asset: string;
    model: string;
    market_view: string;
    risk_commentary: string;
    advisor_message: string;
    disclaimer: string;
};

export default function AIAdvisorPanel({
    advisor,
}: {
    advisor: AIAdvisorResponse | null;
}) {
    return (
        <section className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.88),rgba(9,14,24,0.96))] p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold">Crypto Market Advisor</h2>
                    <p className="mt-1 text-sm text-slate-400">
                        Crypto commentary grounded in Market-Guardian signals
                    </p>
                </div>
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-medium text-emerald-300">
                    {advisor?.model || "Groq"}
                </div>
            </div>

            <div className="space-y-5">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <h3 className="mb-2 text-lg font-semibold text-cyan-300">Market View</h3>
                    <p className="text-sm leading-7 text-slate-300">
                        {advisor?.market_view || "Loading market commentary..."}
                    </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <h3 className="mb-2 text-lg font-semibold text-orange-300">Risk Commentary</h3>
                    <p className="text-sm leading-7 text-slate-300">
                        {advisor?.risk_commentary || "Loading risk commentary..."}
                    </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <h3 className="mb-2 text-lg font-semibold text-emerald-300">Advisor Message</h3>
                    <p className="text-sm leading-7 text-slate-300">
                        {advisor?.advisor_message || "Loading advisor guidance..."}
                    </p>
                </div>

                <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4">
                    <p className="text-sm leading-6 text-yellow-200">
                        {advisor?.disclaimer ||
                            "This analysis is informational and not financial advice."}
                    </p>
                </div>
            </div>
        </section>
    );
}
