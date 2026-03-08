import { useEffect, useState } from "react";

const C = {
  green: "var(--color-c-green)",
  cardBg: "var(--color-c-card-bg)",
  innerBg: "var(--color-c-inner-bg)",
  textMuted: "var(--color-c-text-muted)",
  border: "var(--color-c-border)",
  borderHover: "var(--color-c-border-hover)",
};

const TABS = [
  { id: "analyzer", label: "Analyzer" },
  { id: "results", label: "Results" },
];

function timeAgo(isoDate) {
  const now = new Date();
  const then = new Date(isoDate);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

const PATTERN_COLORS = {
  CEO_RACIAL_SCANDAL: { bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.3)", text: "#f87171" },
  BRAND_BOYCOTT: { bg: "rgba(251,146,60,0.12)", border: "rgba(251,146,60,0.3)", text: "#fb923c" },
  EARNINGS_MISS: { bg: "rgba(234,179,8,0.12)", border: "rgba(234,179,8,0.3)", text: "#facc15" },
  REGULATORY_ACTION: { bg: "rgba(139,92,246,0.12)", border: "rgba(139,92,246,0.3)", text: "#a78bfa" },
  CEO_MISCONDUCT_RESIGNATION: { bg: "rgba(236,72,153,0.12)", border: "rgba(236,72,153,0.3)", text: "#f472b6" },
};

function patternLabel(p) {
  return p.replace(/_/g, " ");
}

function ResultsTab() {
  const [filter, setFilter] = useState("ALL");
  const [sortKey, setSortKey] = useState("return30d");
  const [hoveredRow, setHoveredRow] = useState(null);
  const [analysisData, setAnalysisData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8000/api/analysis-results')
      .then(res => res.json())
      .then(data => {
        setAnalysisData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading analysis data:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-4" style={{ borderColor: C.green, borderTopColor: "transparent" }} />
          <p className="text-[12px]" style={{ color: C.textMuted }}>Loading analysis data...</p>
        </div>
      </div>
    );
  }

  if (analysisData.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[12px]" style={{ color: C.textMuted }}>No analysis data available.</p>
      </div>
    );
  }

  const allPatterns = ["ALL", ...new Set(analysisData.map(d => d.pattern))];

  const filtered = analysisData
    .filter(d => filter === "ALL" || d.pattern === filter)
    .slice()
    .sort((a, b) => {
      if (sortKey === "return30d") return a.return30d - b.return30d;
      if (sortKey === "conf") return b.conf - a.conf;
      if (sortKey === "irony") return b.irony - a.irony;
      return 0;
    });

  const avgReturn = (analysisData.reduce((s, d) => s + d.return30d, 0) / analysisData.length).toFixed(1);
  const avgConf = Math.round(analysisData.reduce((s, d) => s + d.conf, 0) / analysisData.length);
  const worstReturn = Math.min(...analysisData.map(d => d.return30d));
  const patternCounts = analysisData.reduce((acc, d) => { acc[d.pattern] = (acc[d.pattern] || 0) + 1; return acc; }, {});
  const topPattern = Object.entries(patternCounts).sort((a, b) => b[1] - a[1])[0][0];

  const STATS = [
    { label: "Companies", value: analysisData.length },
    { label: "Avg 30d Return", value: `${avgReturn}%`, color: "#f87171" },
    { label: "Avg Confidence", value: `${avgConf}%` },
    { label: "Worst Return", value: `${worstReturn}%`, color: "#f87171" },
    { label: "Top Pattern", value: patternLabel(topPattern), small: true },
  ];

  return (
    <div className="flex-1 flex flex-col gap-4 min-h-0">

      {/* Stat strip */}
      <div className="grid grid-cols-5 gap-3 flex-shrink-0">
        {STATS.map(({ label, value, color, small }) => (
          <div key={label} className="rounded-xl px-4 py-3 flex flex-col gap-1" style={{ background: C.cardBg, border: `1px solid ${C.border}` }}>
            <p className="text-[11px] uppercase tracking-widest" style={{ color: C.textMuted }}>{label}</p>
            <p className={`font-bold ${small ? "text-[13px]" : "text-[20px]"}`} style={{ color: color || "#fff" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex gap-2 flex-wrap">
          {allPatterns.map(p => {
            const col = p === "ALL" ? null : PATTERN_COLORS[p];
            const active = filter === p;
            return (
              <button
                key={p}
                onClick={() => setFilter(p)}
                className="text-[11px] px-3 py-1.5 rounded-lg transition-all duration-150"
                style={{
                  background: active ? (col ? col.bg : "rgba(255,255,255,0.1)") : "transparent",
                  border: `1px solid ${active ? (col ? col.border : "rgba(255,255,255,0.3)") : C.border}`,
                  color: active ? (col ? col.text : "#fff") : C.textMuted,
                }}
              >
                {p === "ALL" ? "All" : patternLabel(p)}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px]" style={{ color: C.textMuted }}>Sort:</span>
          {[["return30d", "30d Return"], ["conf", "Confidence"], ["irony", "Irony"]].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSortKey(key)}
              className="text-[10px] px-3 py-1.5 rounded-lg transition-all duration-150"
              style={{
                background: sortKey === key ? "rgba(255,255,255,0.08)" : "transparent",
                border: `1px solid ${sortKey === key ? C.borderHover : "transparent"}`,
                color: sortKey === key ? "#fff" : C.textMuted,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 rounded-xl overflow-hidden flex flex-col min-h-0" style={{ border: `1px solid ${C.border}` }}>
        {/* Header */}
        <div
          className="grid flex-shrink-0 px-4 py-2.5"
          style={{ gridTemplateColumns: "2fr 1fr 1.2fr 0.8fr 0.8fr 0.8fr", background: C.cardBg, borderBottom: `1px solid ${C.border}` }}
        >
          {["Company", "CEO", "Pattern", "Sentiment", "30d Return", "Confidence"].map(h => (
            <span key={h} className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: C.textMuted }}>{h}</span>
          ))}
        </div>
        {/* Rows */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          {filtered.map((row, i) => {
            const patCol = PATTERN_COLORS[row.pattern] || { bg: "rgba(255,255,255,0.06)", border: C.border, text: C.textMuted };
            const isNeg = row.sentiment === "NEGATIVE";
            const isHovered = hoveredRow === i;
            return (
              <div
                key={i}
                className="grid px-4 py-3 transition-all duration-150"
                style={{
                  gridTemplateColumns: "2fr 1fr 1.2fr 0.8fr 0.8fr 0.8fr",
                  borderBottom: `1px solid ${C.border}`,
                  background: isHovered ? "rgba(255,255,255,0.03)" : "transparent",
                  alignItems: "center",
                }}
                onMouseEnter={() => setHoveredRow(i)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                {/* Company */}
                <div>
                  <p className="text-[12px] font-semibold text-white leading-tight">{row.company}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: C.textMuted }}>{row.price}</p>
                </div>
                {/* CEO */}
                <p className="text-[11px] leading-tight pr-2" style={{ color: row.ceo === "N/A" ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.6)" }}>
                  {row.ceo === "N/A" ? "—" : row.ceo.replace(/^Mr\.\s+|^Ms\.\s+/, "")}
                </p>
                {/* Pattern */}
                <span
                  className="text-[9px] font-semibold px-2 py-1 rounded-md w-fit"
                  style={{ background: patCol.bg, border: `1px solid ${patCol.border}`, color: patCol.text }}
                >
                  {patternLabel(row.pattern)}
                </span>
                {/* Sentiment */}
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: isNeg ? "#f87171" : "#facc15" }} />
                  <span className="text-[11px]" style={{ color: isNeg ? "#f87171" : "#facc15" }}>{row.direction}</span>
                </div>
                {/* 30d Return */}
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-semibold" style={{ color: "#f87171" }}>{row.return30d}%</span>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)", width: 32 }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.abs(row.return30d) / 20 * 100}%`, background: "#f87171" }} />
                  </div>
                </div>
                {/* Confidence */}
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-semibold text-white">{row.conf}%</span>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)", width: 32 }}>
                    <div className="h-full rounded-full" style={{ width: `${row.conf}%`, background: row.conf >= 80 ? "#4ade80" : row.conf >= 50 ? "#facc15" : "#f87171" }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
export default function News() {
  const [activeTab, setActiveTab] = useState("analyzer");
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [sentiment, setSentiment] = useState(null);
  const [newsData, setNewsData] = useState(null);
  const [liveNews, setLiveNews] = useState([]);
  const [topControversy, setTopControversy] = useState(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/news-data')
      .then(res => res.json())
      .then(data => {
        setNewsData(data);
        if (data && data.ranked_articles) {
          const processed = data.ranked_articles.map((item) => {
            const score = item.analysis.controversy_score;
            const tickers = item.analysis.ticker_tags;
            const isBuy = score < 0.8;
            return {
              source: item.article.source,
              time: timeAgo(item.article.publishedAt),
              ticker: tickers.length > 0 ? tickers[0] : "—",
              tag: isBuy ? "BUY" : "SELL",
              tagColor: isBuy ? "#4ade80" : "#f87171",
              headline: item.article.title,
              excerpt: item.analysis.controversial_excerpt,
              score: score,
              url: item.article.url,
            };
          });
          setLiveNews(processed);
        }
        if (data && data.top_controversy) {
          setTopControversy(data.top_controversy);
        }
      })
      .catch(err => console.error('Error loading news data:', err));
  }, []);

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

  if (!newsData || !topControversy || liveNews.length === 0) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: C.green, borderTopColor: "transparent" }} />
          <p style={{ color: C.textMuted }}>Loading news data...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 flex text-left flex-col px-8 pt-20 pb-6 gap-4 m-15"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div className="flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className="text-[26px] font-bold text-white tracking-tight">News</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] mt-2" style={{ color: C.textMuted }}>Scandal Analyzer</p>
        </div>
        {/* Top controversy badge */}
        <div
          className="flex flex-col gap-1 p-3 rounded-xl max-w-s"
          style={{ background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.2)" }}
        >
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-bold uppercase tracking-widest" style={{ color: "#f87171" }}>Top Controversy</span>
            <span className="text-[12px] font-semibold px-1.5 py-0.5 rounded" style={{ background: "rgba(248,113,113,0.15)", color: "#f87171" }}>
              {topControversy.analysis.ticker_tags?.join(", ") || "—"}
            </span>
            <span className="text-[11px] text-right" style={{ color: C.textMuted }}>Score: {topControversy.analysis.controversy_score}</span>
          </div>
          <p className="text-[11px] leading-snug" style={{ color: "rgba(255,255,255,0.7)" }}>{topControversy.article.title}</p>
        </div>
      </div>

      {/* Divider */}
      <div className="flex-shrink-0" style={{ borderTop: `1px solid ${C.border}` }} />

      {/* Tabs */}
      <div className="flex gap-2 flex-shrink-0">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className="px-4 py-2 text-[14px] rounded-lg transition-all duration-200"
            style={{
              background: activeTab === id ? "rgba(255,255,255,0.08)" : "transparent",
              color: activeTab === id ? "#fff" : C.textMuted,
              border: `1px solid ${activeTab === id ? C.borderHover : "transparent"}`,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ANALYZER TAB */}
      {activeTab === "analyzer" && (
        <div className="flex-1 grid gap-4 min-h-0" style={{ gridTemplateColumns: "1fr 1.2fr" }}>

          {/* COL 1 — Live News Feed */}
          <div className="flex justify-start flex-col min-h-0">
            <div className="mb-2.5 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5 items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[12px] text-white font-medium uppercase tracking-widest">Live</span>
                </div>
                <span className="text-[13px]" style={{ color: C.textMuted }}>{newsData.article_count} articles</span>
              </div>
            </div>
            <div
              className="flex-1 justify-start rounded-xl overflow-hidden flex flex-col min-h-0"
              style={{ border: `1px solid ${C.border}` }}
            >
              <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                {liveNews.map((item, i) => (
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
                          className="text-[15px] font-bold py-0.5 rounded"
                          style={{ background: "rgba(255,255,255,0.06)", color: "#fff" }}
                        >
                          {item.ticker}
                        </span>
                        <span className="text-[13px]" style={{ color: C.textMuted }}>{item.source}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[12px] font-semibold px-1.5 py-0.5 rounded"
                          style={{
                            background: item.tag === "BUY" ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
                            color: item.tagColor,
                            border: `1px solid ${item.tag === "BUY" ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.2)"}`,
                          }}
                        >
                          {item.tag}
                        </span>
                        <span className="text-[12px] font-semibold px-1 py-0.5 rounded" style={{ color: C.textMuted }} title="Controversy score">
                          {item.score.toFixed(2)}
                        </span>
                        <span className="text-[12px]" style={{ color: C.textMuted }}>{item.time}</span>
                      </div>
                    </div>
                    <p className="text-[12px] leading-snug text-left" style={{ color: "rgba(255,255,255,0.75)" }}>
                      {item.headline}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* COL 2 — Analyzer */}
          <div className="flex flex-col gap-3 min-h-0">
            <div className="rounded-xl p-4 flex flex-col gap-3 flex-shrink-0" style={{ background: C.cardBg, border: `1px solid ${C.border}` }}>
              <div className="text-center">
                <p className="text-[17px] font-bold text-white mb-1.5">Headline</p>
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
                className="w-full py-2.5 text-[13px] font-bold rounded-lg border-none tracking-wide"
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
            <div className="rounded-xl overflow-hidden flex flex-col flex-1 min-h-0" style={{ border: `1px solid ${C.border}` }}>
              <div
                className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
                style={{ background: C.cardBg, borderBottom: `1px solid ${C.border}` }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: loading ? C.green : (response ? C.green : "rgba(255,255,255,0.15)") }} />
                  <span className="text-[14px] font-medium text-white">
                    {loading ? "Running analysis..." : response ? "Analysis complete" : "Awaiting input"}
                  </span>
                </div>
                {sentiment && (
                  <div
                    className="text-[12px] font-semibold px-2.5 py-1 rounded-md"
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
                className="flex-1 overflow-y-auto p-4 text-[13px] leading-relaxed whitespace-pre-wrap min-h-0"
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



        </div>
      )}

      {/* RESULTS TAB */}
      {activeTab === "results" && <ResultsTab />}

    </div>
  );
}
