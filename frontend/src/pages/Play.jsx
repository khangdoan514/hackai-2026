import { useState, useEffect, useRef, useCallback } from "react";
import { TrendingUp, TrendingDown, MessageCircle, Send } from "lucide-react";

const C = {
  bg:        "#000000",
  cardBg:    "#1a1a1a",
  cardBorder:"#6AD972",
  green:     "#6AD972",
  red:       "#FF4455",
  yellow:    "#e6a817",
  textLight: "#ffffff",
  textMuted: "rgba(255,255,255,0.45)",
  innerBg:   "rgba(255,255,255,0.05)",
};

const ROUNDS = [
  { source: "Business Insider", time: "1 hour ago", text: "Papa John's CEO Caught on Hot Mic Calling Customers 'Idiots' – Brand Backlash Erupts on Social Media", correct: "crash", ticker: "PZZA", company: "Papa John's", basePrice: 58 },
  { source: "Reuters", time: "30 mins ago", text: "Apple Reports Record-Breaking Q4 Earnings, Beats Wall Street Estimates by 18% – iPhone Demand Surges", correct: "grow", ticker: "AAPL", company: "Apple", basePrice: 213 },
  { source: "TechCrunch", time: "2 hours ago", text: "Tesla Recalls 500,000 Vehicles Over Autopilot Software Defect – NHTSA Launches Formal Investigation", correct: "crash", ticker: "TSLA", company: "Tesla", basePrice: 248 },
  { source: "CNBC", time: "45 mins ago", text: "NVIDIA Announces Next-Gen Blackwell Chip — AI Demand 'Far Exceeds' Production Capacity, CEO Says", correct: "grow", ticker: "NVDA", company: "NVIDIA", basePrice: 875 },
  { source: "Wall Street Journal", time: "3 hours ago", text: "McDonald's E. Coli Outbreak Linked to Quarter Pounder — 75 Cases Across 13 States, FDA Investigating", correct: "crash", ticker: "MCD", company: "McDonald's", basePrice: 294 },
  { source: "Bloomberg", time: "20 mins ago", text: "Amazon Wins $10 Billion Pentagon Cloud Contract, Beating Microsoft in Final Round of JEDI Rebid", correct: "grow", ticker: "AMZN", company: "Amazon", basePrice: 185 },
  { source: "MarketWatch", time: "1 hour ago", text: "Meta CEO Mark Zuckerberg Sued by 33 States Over Addictive Features Targeting Minors on Instagram", correct: "crash", ticker: "META", company: "Meta", basePrice: 512 },
  { source: "Forbes", time: "15 mins ago", text: "Netflix Smashes Q3 Subscriber Forecasts, Adding 9 Million New Users — Ad-Supported Tier Driving Growth", correct: "grow", ticker: "NFLX", company: "Netflix", basePrice: 680 },
];

const TIMEFRAMES = ["1D", "5D", "1M", "3M"];
const TF_POINTS  = { "1D": 48, "5D": 60, "1M": 30, "3M": 90 };

function generateHistory(base, count) {
  const pts = [];
  let p = base;
  for (let i = 0; i < count; i++) {
    p += (Math.random() - 0.48) * (base * 0.022);
    p = Math.max(base * 0.3, p);
    pts.push(Math.round(p * 100) / 100);
  }
  return pts;
}

function StockChart({ data, color, height = 120 }) {
  if (!data || data.length < 2) return null;
  const W = 600, H = height;
  const min = Math.min(...data) * 0.995;
  const max = Math.max(...data) * 1.005;
  const rng = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / rng) * (H - 6) - 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const last = data[data.length - 1];
  const lx = W, ly = H - ((last - min) / rng) * (H - 6) - 3;
  const gid = `g${color.replace("#", "")}`;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0"   />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map(f => (
        <line key={f} x1="0" y1={H*f} x2={W} y2={H*f} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      ))}
      <polygon points={`0,${H} ${pts} ${W},${H}`} fill={`url(#${gid})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lx} cy={ly} r="4" fill={color} />
    </svg>
  );
}

function getTimerColor(s) {
  if (s > 40) return { color: C.green,  border: C.green,  bg: "rgba(106,217,114,0.1)" };
  if (s > 20) return { color: C.yellow, border: C.yellow, bg: "rgba(230,168,23,0.1)"  };
  return             { color: C.red,    border: C.red,    bg: "rgba(255,68,85,0.1)"   };
}

export default function Play() {
  const [roundIdx,      setRoundIdx]      = useState(0);
  const [seconds,       setSeconds]       = useState(60);
  const [selected,      setSelected]      = useState(null);
  const [revealed,      setRevealed]      = useState(false);
  const [myScore,       setMyScore]       = useState(0);
  const timerRef = useRef(null);

  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput,    setChatInput]    = useState("");
  const [username]                      = useState(() => "User" + Math.floor(Math.random() * 9000 + 1000));
  const chatEndRef = useRef(null);

  const [timeframe,     setTimeframe]     = useState("1D");
  const [chartData,     setChartData]     = useState(() => generateHistory(ROUNDS[0].basePrice, TF_POINTS["1D"]));
  const [stockPick,     setStockPick]     = useState(null);
  const [opponentPick,  setOpponentPick]  = useState(null);
  const [stockRevealed, setStockRevealed] = useState(false);
  const [stockResult,   setStockResult]   = useState(null);
  const [portfolioMe,   setPortfolioMe]   = useState(1000);
  const [portfolioOpp,  setPortfolioOpp]  = useState(1000);
  const [stockSecs,     setStockSecs]     = useState(30);
  const stockTimerRef = useRef(null);
  const opponentRef   = useRef(null);

  const round      = ROUNDS[roundIdx];
  const timerStyle = getTimerColor(seconds);
  const isCorrect  = selected === round.correct;

  const lastPrice    = chartData[chartData.length - 1] || round.basePrice;
  const firstPrice   = chartData[0] || round.basePrice;
  const pricePct     = ((lastPrice - firstPrice) / firstPrice * 100).toFixed(2);
  const displayPrice = (round.basePrice + lastPrice - firstPrice).toFixed(2);
  const chartColor   = stockRevealed ? (stockResult === "grow" ? C.green : C.red) : C.green;

  useEffect(() => {
    if (revealed) return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSeconds(s => { if (s <= 1) { clearInterval(timerRef.current); setRevealed(true); return 0; } return s - 1; });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [roundIdx, revealed]);

  useEffect(() => {
    if (stockRevealed) return;
    clearInterval(stockTimerRef.current);
    setStockSecs(30);
    stockTimerRef.current = setInterval(() => {
      setStockSecs(s => { if (s <= 1) { clearInterval(stockTimerRef.current); return 0; } return s - 1; });
    }, 1000);
    return () => clearInterval(stockTimerRef.current);
  }, [roundIdx, stockRevealed]);

  useEffect(() => {
    setChartData(generateHistory(round.basePrice, TF_POINTS[timeframe]));
  }, [roundIdx, timeframe]);

  useEffect(() => {
    if (stockRevealed || timeframe !== "1D") return;
    const id = setInterval(() => {
      setChartData(prev => {
        const last = prev[prev.length - 1];
        const next = Math.max(10, last + (Math.random() - 0.5) * round.basePrice * 0.003);
        return [...prev.slice(1), Math.round(next * 100) / 100];
      });
    }, 900);
    return () => clearInterval(id);
  }, [roundIdx, stockRevealed, timeframe]);

  useEffect(() => {
    if (stockRevealed) return;
    setOpponentPick(null);
    clearTimeout(opponentRef.current);
    opponentRef.current = setTimeout(() => {
      setOpponentPick(Math.random() > 0.5 ? "grow" : "crash");
    }, (3 + Math.random() * 7) * 1000);
    return () => clearTimeout(opponentRef.current);
  }, [roundIdx, stockRevealed]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await window.storage?.get("play-chat", true);
        if (r?.value) setChatMessages(JSON.parse(r.value));
      } catch {}
    };
    load();
    const id = setInterval(load, 2000);
    return () => clearInterval(id);
  }, []);

  const resolveStock = useCallback((myChoice) => {
    clearInterval(stockTimerRef.current);
    clearTimeout(opponentRef.current);
    const actual = Math.random() > 0.5 ? "grow" : "crash";
    setStockResult(actual);
    setStockRevealed(true);
    setPortfolioMe(p  => (myChoice === actual)    ? p + 150 : Math.max(0, p - 150));
    setPortfolioOpp(p => (opponentPick === actual) ? p + 150 : Math.max(0, p - 150));
    setChartData(generateHistory(round.basePrice * (actual === "grow" ? 1.1 : 0.9), TF_POINTS[timeframe]));
  }, [opponentPick, timeframe, round.basePrice]);

  const nextRound = () => {
    const next = (roundIdx + 1) % ROUNDS.length;
    setRoundIdx(next);
    setSeconds(60);
    setSelected(null);
    setRevealed(false);
    setStockPick(null);
    setOpponentPick(null);
    setStockRevealed(false);
    setStockResult(null);
    setStockSecs(30);
    setTimeframe("1D");
  };

  const handleHeadlineSelect = (choice) => {
    if (revealed || selected) return;
    setSelected(choice);
    clearInterval(timerRef.current);
    setRevealed(true);
    if (choice === round.correct) setMyScore(s => s + 1);
  };

  const handleStockPick = (choice) => {
    if (stockRevealed || stockPick) return;
    setStockPick(choice);
    resolveStock(choice);
  };

  const sendMessage = async () => {
    if (!chatInput.trim()) return;
    const msg = {
      id: Date.now(), user: username, text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };
    const updated = [...chatMessages, msg].slice(-50);
    setChatMessages(updated);
    setChatInput("");
    try { await window.storage?.set("play-chat", JSON.stringify(updated), true); } catch {}
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-transparent pt-22" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      <div className="h-full px-4 pt-5 pb-4 gap-3" style={{ maxWidth: 1160, margin: "0 auto" }}>

        {/* TOP BAR */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-[11px] font-bold tracking-widest" style={{ color: C.textMuted }}>
            ROUND {roundIdx + 1}/{ROUNDS.length}
          </span>
          <span className="text-[11px] font-bold tracking-widest" style={{ color: C.textMuted }}>
            SCORE: <span style={{ color: C.green }}>{myScore}</span>
          </span>
          <div
            className="ml-auto flex items-center gap-1.5 rounded-full px-3.5 py-1 transition-all duration-500"
            style={{ border: `2px solid ${timerStyle.border}`, background: timerStyle.bg }}
          >
            <span className="text-xl font-extrabold leading-none tabular-nums" style={{ color: timerStyle.color }}>{seconds}</span>
            <span className="text-[9px] font-bold tracking-widest opacity-70" style={{ color: timerStyle.color }}>SEC</span>
          </div>
        </div>

        {/* MAIN BOX — both columns */}
        <div className="flex-1 grid gap-4 min-h-0" style={{ gridTemplateColumns: "1fr 320px" }}>

          {/* LEFT column */}
          <div className="flex flex-col gap-3 overflow-y-auto min-h-0" style={{ scrollbarWidth: "none" }}>

            {/* Headline card */}
            <div
              className="rounded-2xl px-[22px] pt-[22px] pb-4 flex-shrink-0"
              style={{ background: C.cardBg, border: `1.5px solid ${C.cardBorder}`, boxShadow: "0 4px 24px rgba(0,0,0,0.4)" }}
            >
              <div className="flex justify-between mb-3">
                <span className="text-[11px] font-medium" style={{ color: C.textMuted }}>{round.source}</span>
                <span className="text-[11px] font-medium" style={{ color: C.textMuted }}>{round.time}</span>
              </div>
              <h2 className="text-[clamp(17px,2.2vw,22px)] font-extrabold leading-snug mb-[18px]" style={{ color: C.textLight }}>
                {round.text}
              </h2>
              <div className="flex items-center justify-center gap-2 pt-3" style={{ borderTop: "1px solid rgba(106,217,114,0.2)" }}>
                <span className="text-[10px] font-bold tracking-[0.16em]" style={{ color: C.textMuted }}>HOW WILL</span>
                <span className="text-[11px] font-extrabold tracking-[0.08em]" style={{ color: C.green }}>{round.ticker}</span>
                <span className="text-[10px] font-bold tracking-[0.16em]" style={{ color: C.textMuted }}>REACT?</span>
              </div>
            </div>

            {/* Stock chart card */}
            <div
              className="rounded-2xl p-4 flex-shrink-0"
              style={{ background: C.cardBg, border: `1.5px solid ${C.cardBorder}`, boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}
            >
              {/* Ticker + price */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-[22px] font-extrabold leading-none" style={{ color: C.textLight }}>{round.ticker}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: C.textMuted }}>{round.company}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold" style={{ color: C.textLight }}>${Number(displayPrice).toLocaleString()}</div>
                  <div className="text-[11px] font-bold" style={{ color: parseFloat(pricePct) >= 0 ? C.green : C.red }}>
                    {parseFloat(pricePct) >= 0 ? "▲" : "▼"} {Math.abs(pricePct)}%
                  </div>
                </div>
              </div>

              {/* Timeframe tabs */}
              <div className="flex gap-1 mb-2.5">
                {TIMEFRAMES.map(tf => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className="px-2.5 py-0.5 rounded-md text-[10px] font-bold cursor-pointer border-none transition-all duration-200"
                    style={{ background: timeframe === tf ? C.green : C.innerBg, color: timeframe === tf ? "#000" : C.textMuted }}
                  >
                    {tf}
                  </button>
                ))}
              </div>

              {/* Chart OR Result — same space */}
              {!stockRevealed ? (
                <>
                  {/* Chart */}
                  <div className="rounded-lg overflow-hidden h-[140px] mb-2">
                    <StockChart data={chartData} color={chartColor} height={140} />
                  </div>

                  {/* Axis labels */}
                  <div className="flex justify-between mb-2.5">
                    <span className="text-[9px]" style={{ color: C.textMuted }}>
                      {timeframe === "1D" ? "24h ago" : timeframe === "5D" ? "5d ago" : timeframe === "1M" ? "1mo ago" : "3mo ago"}
                    </span>
                    <span className="text-[9px]" style={{ color: C.textMuted }}>Now</span>
                  </div>

                  {/* Opponent row */}
                  <div className="flex justify-between items-center mb-2.5">
                    <div className="text-[10px]" style={{ color: C.textMuted }}>
                      Opp:&nbsp;{opponentPick
                        ? <span className="font-bold" style={{ color: opponentPick === "grow" ? C.green : C.red }}>{opponentPick.toUpperCase()} ✓</span>
                        : <span>thinking…</span>}
                    </div>
                    <div className="text-[10px]" style={{ color: C.textMuted }}>
                      GUESS IN&nbsp;
                      <span className="font-extrabold text-sm tabular-nums" style={{ color: stockSecs > 15 ? C.green : stockSecs > 7 ? C.yellow : C.red }}>
                        {stockSecs}s
                      </span>
                    </div>
                  </div>

                  {/* Crash / Grow buttons */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { key: "crash", icon: <TrendingDown size={16} />, label: "CRASH" },
                      { key: "grow",  icon: <TrendingUp   size={16} />, label: "GROW"  },
                    ].map(({ key, icon, label }) => (
                      <button
                        key={key}
                        onClick={() => handleStockPick(key)}
                        disabled={!!stockPick}
                        className="flex items-center justify-center gap-1.5 rounded-[10px] py-2.5 px-2 text-[13px] font-extrabold transition-all duration-200"
                        style={{
                          background: stockPick === key ? (key === "grow" ? "rgba(106,217,114,0.18)" : "rgba(255,68,85,0.18)") : C.innerBg,
                          border: `1.5px solid ${key === "grow" ? C.green : C.red}`,
                          cursor: stockPick ? "default" : "pointer",
                          color: key === "grow" ? C.green : C.red,
                        }}
                      >
                        {icon} {label}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                /* Result replaces the chart */
                <div className="rounded-[10px] p-5 text-center bg-black/40 flex flex-col items-center justify-center" style={{ minHeight: 240 }}>
                  <div className="text-[10px] mb-2 tracking-[0.1em]" style={{ color: C.textMuted }}>{round.ticker} RESULT</div>
                  <div className="text-2xl font-extrabold mb-4" style={{ color: stockResult === "grow" ? C.green : C.red }}>
                    {stockResult === "grow" ? "📈 GREW" : "📉 CRASHED"}
                  </div>
                  <div className="flex justify-around w-full mb-5">
                    {[{ label: "You", pick: stockPick }, { label: "Opponent", pick: opponentPick }].map(({ label, pick }) => (
                      <div key={label}>
                        <div className="text-[10px] mb-0.5" style={{ color: C.textMuted }}>{label}</div>
                        <div className="font-bold text-sm" style={{ color: pick === stockResult ? C.green : C.red }}>
                          {pick ? (pick === stockResult ? "+$150" : "-$150") : "no pick"}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={nextRound}
                    className="border-none rounded-lg px-6 py-2 font-extrabold text-xs cursor-pointer"
                    style={{ background: C.green, color: "#000" }}
                  >
                    NEXT ROUND →
                  </button>
                </div>
              )}
            </div>

            {/* Headline result banner */}
            {revealed && (
              <div
                className="rounded-xl px-4 py-[11px] flex justify-between items-center flex-shrink-0"
                style={{
                  background: isCorrect ? "rgba(106,217,114,0.1)" : "rgba(255,68,85,0.1)",
                  border: `1.5px solid ${isCorrect ? C.green : C.red}`,
                }}
              >
                <span className="font-bold text-[13px]" style={{ color: isCorrect ? C.green : C.red }}>
                  {selected
                    ? (isCorrect ? `✓ Correct! ${round.ticker} was expected to ${round.correct}.` : `✗ Wrong. ${round.ticker} was expected to ${round.correct}.`)
                    : `⏱ Time's up! ${round.ticker} was expected to ${round.correct}.`}
                </span>
                <button
                  onClick={nextRound}
                  className="border-none rounded-lg px-4 py-1.5 font-extrabold text-[11px] cursor-pointer"
                  style={{ background: C.green, color: "#000" }}
                >
                  NEXT →
                </button>
              </div>
            )}
          </div>

          {/* RIGHT column */}
          <div className="flex flex-col gap-3 min-h-0 justify-items overflow-hidden">

            {/* Portfolio */}
            <div
              className="rounded-2xl px-3.5 py-3 flex-shrink-0"
              style={{ background: C.cardBg, border: `1.5px solid ${C.cardBorder}` }}
            >
              <div className="text-[9px] font-bold tracking-[0.14em] mb-2" style={{ color: C.textMuted }}>PORTFOLIO</div>
              <div className="flex gap-2">
                {[{ label: "You", val: portfolioMe }, { label: "Opponent", val: portfolioOpp }].map(({ label, val }) => (
                  <div key={label} className="flex-1 rounded-[10px] px-2.5 py-2 text-center" style={{ background: C.innerBg }}>
                    <div className="text-[9px] font-semibold mb-0.5" style={{ color: C.textMuted }}>{label}</div>
                    <div className="text-lg font-extrabold" style={{ color: val >= 1000 ? C.green : C.red }}>${val.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Chat */}
            <div
              className="rounded-2xl overflow-hidden flex flex-col flex-1"
              style={{ background: C.cardBg, border: `1.5px solid ${C.cardBorder}` }}
            >
              <div className="px-3.5 py-2.5 flex items-center justify-between flex-shrink-0" style={{ borderBottom: "1px solid rgba(106,217,114,0.2)" }}>
                <div className="flex items-center gap-1.5">
                  <MessageCircle size={13} color={C.green} />
                  <span className="font-bold text-xs" style={{ color: C.textLight }}>Live Chat</span>
                </div>
                <span className="text-[10px]" style={{ color: C.textMuted }}>{chatMessages.length} msgs</span>
              </div>

              <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-1.5 min-h-0">
                {chatMessages.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-xs text-center" style={{ color: C.textMuted }}>
                    No messages yet. Share your thoughts!
                  </div>
                ) : chatMessages.map(msg => (
                  <div key={msg.id}>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-[10px] font-bold" style={{ color: msg.user === username ? C.green : C.textMuted }}>
                        {msg.user === username ? "You" : msg.user}
                      </span>
                      <span className="text-[9px]" style={{ color: C.textMuted }}>{msg.time}</span>
                    </div>
                    <div
                      className="text-[11px] leading-snug rounded-lg px-2 py-1"
                      style={{ color: C.textLight, background: msg.user === username ? "rgba(106,217,114,0.08)" : C.innerBg }}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <div className="px-2.5 py-1.5 flex gap-1.5 items-center flex-shrink-0" style={{ borderTop: "1px solid rgba(106,217,114,0.2)" }}>
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendMessage()}
                  placeholder="Is this legit or trolling?"
                  className="flex-1 border-none rounded-lg px-2.5 py-1.5 text-[11px] outline-none"
                  style={{ background: C.innerBg, color: C.textLight, fontFamily: "inherit" }}
                />
                <button onClick={sendMessage} className="bg-transparent border-none cursor-pointer flex items-center p-0.5" style={{ color: C.green }}>
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>

          <div className="text-center text-[10px] flex-shrink-0 pb-1" style={{ color: C.textMuted }}>
            chatting as <span style={{ color: C.green }}>{username}</span>
          </div>
        </div>
      </div>
    </div>
  );
}