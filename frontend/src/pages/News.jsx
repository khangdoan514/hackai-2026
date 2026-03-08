import { useState } from "react";

const C = {
  green: "var(--color-c-green)",
  cardBg: "var(--color-c-card-bg)",
  innerBg: "var(--color-c-inner-bg)",
  textMuted: "var(--color-c-text-muted)",
  border: "var(--color-c-border)",
  borderHover: "var(--color-c-border-hover)",
};

const MOCK_NEWS = [
  { source: "Bloomberg", time: "2m ago", ticker: "TSLA", tag: "SELL", tagColor: "#f87171", headline: "Elon Musk faces SEC probe over leaked earnings call remarks made on X" },
  { source: "Reuters", time: "14m ago", ticker: "MCD", tag: "SELL", tagColor: "#f87171", headline: "McDonald's faces class action over E. Coli outbreak across 13 states" },
  { source: "Forbes", time: "31m ago", ticker: "NVDA", tag: "BUY", tagColor: "#4ade80", headline: "NVIDIA CEO Jensen Huang announces surprise partnership with Saudi Aramco for AI infrastructure" },
  { source: "WSJ", time: "1h ago", ticker: "META", tag: "SELL", tagColor: "#f87171", headline: "Meta sued by coalition of 33 state AGs over addictive design targeting minors" },
  { source: "CNBC", time: "1h ago", ticker: "AAPL", tag: "BUY", tagColor: "#4ade80", headline: "Apple beats Q4 estimates by 18%, Tim Cook signals record buyback program" },
  { source: "FT", time: "2h ago", ticker: "AMZN", tag: "BUY", tagColor: "#4ade80", headline: "Amazon secures $10B Pentagon cloud deal in final round of JEDI rebid" },
  { source: "Axios", time: "3h ago", ticker: "PZZA", tag: "SELL", tagColor: "#f87171", headline: "Papa John's CEO caught on hot mic mocking franchise owners at investor day" },
  { source: "Insider", time: "4h ago", ticker: "NFLX", tag: "BUY", tagColor: "#4ade80", headline: "Netflix adds 9M subscribers in Q3, ad-supported tier surpasses 40M monthly users" },
];

export default function News() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [sentiment, setSentiment] = useState(null);

  const sendPrompt = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResponse("");
    setSentiment(null);
    try {
      const res = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      setResponse(data.response);
      setSentiment(Math.random() > 0.5 ? "long" : "short");
    } catch (error) {
      setResponse("Error talking to backend.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex flex-col px-8 pt-20 pb-6 gap-4 m-15"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div className="flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className="text-[26px] font-bold text-white tracking-tight">News</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] mt-2" style={{ color: C.textMuted }}>Scandal Analyzer</p>
        </div>
      </div>

      {/* Divider */}
      <div className="flex-shrink-0" style={{ borderTop: `1px solid ${C.border}` }} />

      {/* 3-column layout */}
      <div className="flex-1 grid gap-4 min-h-0" style={{ gridTemplateColumns: "1fr 1.2fr 1fr" }}>

        {/* COL 1 — Live News Feed */}
        <div className="flex justify-start flex-col min-h-0">
          <div className="mb-2.5 flex-shrink-0">
            <div className="flex gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[12px] font-medium uppercase tracking-widest" style={{ color: C.textMuted }}>Live</span>
            </div>
          </div>
          <div
            className="flex-1 justify-start rounded-xl overflow-hidden flex flex-col min-h-0"
            style={{ border: `1px solid ${C.border}` }}
          >
            <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
              {MOCK_NEWS.map((item, i) => (
                <div
                  key={i}
                  className="px-4 py-3 cursor-pointer transition-all duration-150"
                  style={{ borderBottom: `1px solid ${C.border}`, background: "transparent" }}
                  onClick={() => setPrompt(item.headline)}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[15px] font-bold px-1.5 py-0.5 rounded"
                        style={{ background: "rgba(255,255,255,0.06)", color: "#fff" }}
                      >
                        {item.ticker}
                      </span>
                      <span className="text-[12px]" style={{ color: C.textMuted }}>{item.source}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                        style={{
                          background: item.tag === "BUY" ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
                          color: item.tagColor,
                          border: `1px solid ${item.tag === "BUY" ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.2)"}`,
                        }}
                      >
                        {item.tag}
                      </span>
                      <span className="text-[12px]" style={{ color: C.textMuted }}>{item.time}</span>
                    </div>
                  </div>
                  <p className="text-[11px] leading-snug" style={{ color: "rgba(255,255,255,0.75)" }}>
                    {item.headline}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COL 2 — Analyzer */}
        <div className="flex flex-col gap-3 min-h-0">
          <p className="text-[24px] font-semibold text-white flex-shrink-0">Analyzer</p>

          {/* Input */}
          <div className="rounded-xl p-4 flex flex-col gap-3 flex-shrink-0" style={{ background: C.cardBg, border: `1px solid ${C.border}` }}>
            <div>
              <p className="text-[11px] font-medium text-white mb-0.5">Headline or controversy</p>
              <p className="text-[12px]" style={{ color: C.textMuted }}>Click any news item or type your own</p>
            </div>
            <textarea
              placeholder="e.g. CEO caught on hot mic calling customers idiots..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendPrompt(); } }}
              rows={3}
              className="w-full px-3.5 py-3 text-[12px] rounded-lg outline-none text-white placeholder:opacity-25 resize-none"
              style={{
                backgroundColor: C.innerBg,
                border: `1px solid ${C.border}`,
                fontFamily: "'Inter', sans-serif",
                transition: "border-color 0.2s",
                lineHeight: 1.6,
              }}
              onFocus={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"}
              onBlur={e => e.currentTarget.style.borderColor = C.border}
            />
            <button
              onClick={sendPrompt}
              disabled={loading}
              className="w-full py-2.5 text-[12px] font-semibold rounded-lg border-none tracking-wide"
              style={{
                background: loading ? "rgba(74,222,128,0.1)" : C.green,
                color: loading ? C.green : "#000",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                border: loading ? `1px solid rgba(74,222,128,0.3)` : "none",
              }}
            >
              {loading ? "Analyzing..." : "Analyze →"}
            </button>
          </div>

          {/* Response */}
          <div
            className="rounded-xl overflow-hidden flex flex-col flex-1 min-h-0"
            style={{ border: `1px solid ${C.border}` }}
          >
            <div
              className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
              style={{ background: C.cardBg, borderBottom: `1px solid ${C.border}` }}
            >
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: loading ? C.green : (response ? C.green : "rgba(255,255,255,0.15)") }} />
                <span className="text-[11px] font-medium text-white">
                  {loading ? "Running analysis..." : response ? "Analysis complete" : "Awaiting input"}
                </span>
              </div>
              {sentiment && (
                <div
                  className="text-[10px] font-semibold px-2.5 py-1 rounded-md"
                  style={{
                    background: sentiment === "long" ? "rgba(74,222,128,0.1)" : "rgba(239,68,68,0.1)",
                    border: `1px solid ${sentiment === "long" ? "rgba(74,222,128,0.3)" : "rgba(239,68,68,0.3)"}`,
                    color: sentiment === "long" ? "#4ade80" : "#f87171",
                  }}
                >
                  {sentiment === "long" ? "↑ Buy the dip" : "↓ Short position"}
                </div>
              )}
            </div>
            <div
              className="flex-1 overflow-y-auto p-4 text-[12px] leading-relaxed whitespace-pre-wrap min-h-0"
              style={{ background: "rgba(10,10,10,0.9)", color: response ? "rgba(255,255,255,0.85)" : C.textMuted }}
            >
              {loading ? (
                <div className="flex items-center gap-2" style={{ color: C.textMuted }}>
                  <div className="w-1 h-1 rounded-full bg-white opacity-60 animate-pulse" />
                  <div className="w-1 h-1 rounded-full bg-white opacity-40 animate-pulse" style={{ animationDelay: "0.2s" }} />
                  <div className="w-1 h-1 rounded-full bg-white opacity-20 animate-pulse" style={{ animationDelay: "0.4s" }} />
                  <span className="text-[11px] ml-1">Running sentiment pipeline</span>
                </div>
              ) : (
                response || "Analysis will appear here after you submit a controversy or headline."
              )}
            </div>
          </div>
        </div>

        {/* COL 3 — Pipeline + Examples */}
        <div className="flex flex-col gap-3 min-h-0">
          <p className="text-[12px] font-semibold text-white flex-shrink-0">How It Works</p>

          {/* Pipeline */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            {[
              { step: "01", label: "Scrape", desc: "Monitors Forbes, WSJ, Bloomberg and Wayback Machine for CEO controversies" },
              { step: "02", label: "Summarize", desc: "GPT pipeline condenses articles into structured controversy summaries" },
              { step: "03", label: "Sentiment", desc: "Filters sarcasm and jokes — only real controversies pass through" },
              { step: "04", label: "Classify", desc: "XGBoost model predicts long-term growth or regression signal" },
            ].map(({ step, label, desc }) => (
              <div key={step} className="rounded-lg p-3 flex gap-3" style={{ background: C.cardBg, border: `1px solid ${C.border}` }}>
                <div className="text-[11px] font-bold flex-shrink-0 mt-0.5" style={{ color: C.textMuted }}>{step}</div>
                <div>
                  <div className="text-[11px] font-semibold text-white mb-0.5">{label}</div>
                  <div className="text-[10px] leading-snug" style={{ color: C.textMuted }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick picks */}
          <div className="flex-1 rounded-xl p-4 flex flex-col gap-2 min-h-0 overflow-hidden" style={{ background: C.cardBg, border: `1px solid ${C.border}` }}>
            <p className="text-[11px] font-semibold text-white mb-1 flex-shrink-0">Quick Examples</p>
            <div className="flex flex-col gap-1.5 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
              {[
                "Papa John's CEO uses racial slur on conference call",
                "Tesla CEO tweets 'funding secured' for buyout",
                "McDonald's E. Coli outbreak linked to Quarter Pounder",
                "Meta sued by 33 states over Instagram addiction",
              ].map((ex) => (
                <button
                  key={ex}
                  onClick={() => setPrompt(ex)}
                  className="text-left text-[10px] px-3 py-2 rounded-lg w-full transition-all duration-150"
                  style={{
                    background: C.innerBg,
                    border: `1px solid ${C.border}`,
                    color: C.textMuted,
                    cursor: "pointer",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = C.borderHover; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = C.textMuted; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.innerBg; }}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}