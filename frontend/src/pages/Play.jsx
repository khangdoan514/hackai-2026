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

// Each round ties a headline to its stock — same company, same question
const ROUNDS = [
  {
    source: "Business Insider", time: "1 hour ago",
    text: "Papa John's CEO Caught on Hot Mic Calling Customers 'Idiots' – Brand Backlash Erupts on Social Media",
    correct: "crash",
    ticker: "PZZA", company: "Papa John's", basePrice: 58,
  },
  {
    source: "Reuters", time: "30 mins ago",
    text: "Apple Reports Record-Breaking Q4 Earnings, Beats Wall Street Estimates by 18% – iPhone Demand Surges",
    correct: "grow",
    ticker: "AAPL", company: "Apple", basePrice: 213,
  },
  {
    source: "TechCrunch", time: "2 hours ago",
    text: "Tesla Recalls 500,000 Vehicles Over Autopilot Software Defect – NHTSA Launches Formal Investigation",
    correct: "crash",
    ticker: "TSLA", company: "Tesla", basePrice: 248,
  },
  {
    source: "CNBC", time: "45 mins ago",
    text: "NVIDIA Announces Next-Gen Blackwell Chip — AI Demand 'Far Exceeds' Production Capacity, CEO Says",
    correct: "grow",
    ticker: "NVDA", company: "NVIDIA", basePrice: 875,
  },
  {
    source: "Wall Street Journal", time: "3 hours ago",
    text: "McDonald's E. Coli Outbreak Linked to Quarter Pounder — 75 Cases Across 13 States, FDA Investigating",
    correct: "crash",
    ticker: "MCD", company: "McDonald's", basePrice: 294,
  },
  {
    source: "Bloomberg", time: "20 mins ago",
    text: "Amazon Wins $10 Billion Pentagon Cloud Contract, Beating Microsoft in Final Round of JEDI Rebid",
    correct: "grow",
    ticker: "AMZN", company: "Amazon", basePrice: 185,
  },
  {
    source: "MarketWatch", time: "1 hour ago",
    text: "Meta CEO Mark Zuckerberg Sued by 33 States Over Addictive Features Targeting Minors on Instagram",
    correct: "crash",
    ticker: "META", company: "Meta", basePrice: 512,
  },
  {
    source: "Forbes", time: "15 mins ago",
    text: "Netflix Smashes Q3 Subscriber Forecasts, Adding 9 Million New Users — Ad-Supported Tier Driving Growth",
    correct: "grow",
    ticker: "NFLX", company: "Netflix", basePrice: 680,
  },
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
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: "block" }}>
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
  // Single round index drives both headline and stock
  const [roundIdx,      setRoundIdx]      = useState(0);
  const [seconds,       setSeconds]       = useState(60);
  const [selected,      setSelected]      = useState(null);
  const [revealed,      setRevealed]      = useState(false);
  const [myScore,       setMyScore]       = useState(0);
  const timerRef = useRef(null);

  // Chat
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput,    setChatInput]    = useState("");
  const [username]                      = useState(() => "User" + Math.floor(Math.random() * 9000 + 1000));
  const chatEndRef = useRef(null);

  // Stock
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

  // Headline countdown
  useEffect(() => {
    if (revealed) return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSeconds(s => { if (s <= 1) { clearInterval(timerRef.current); setRevealed(true); return 0; } return s - 1; });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [roundIdx, revealed]);

  // Stock countdown
  useEffect(() => {
    if (stockRevealed) return;
    clearInterval(stockTimerRef.current);
    setStockSecs(30);
    stockTimerRef.current = setInterval(() => {
      setStockSecs(s => { if (s <= 1) { clearInterval(stockTimerRef.current); return 0; } return s - 1; });
    }, 1000);
    return () => clearInterval(stockTimerRef.current);
  }, [roundIdx, stockRevealed]);

  // Regenerate chart when round or timeframe changes
  useEffect(() => {
    setChartData(generateHistory(round.basePrice, TF_POINTS[timeframe]));
  }, [roundIdx, timeframe]);

  // Animate live chart on 1D
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

  // Opponent pick
  useEffect(() => {
    if (stockRevealed) return;
    setOpponentPick(null);
    clearTimeout(opponentRef.current);
    opponentRef.current = setTimeout(() => {
      setOpponentPick(Math.random() > 0.5 ? "grow" : "crash");
    }, (3 + Math.random() * 7) * 1000);
    return () => clearTimeout(opponentRef.current);
  }, [roundIdx, stockRevealed]);

  // Chat scroll
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  // Poll chat
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
    // reset headline
    setSeconds(60);
    setSelected(null);
    setRevealed(false);
    // reset stock
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
    const msg = { id: Date.now(), user: username, text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    const updated = [...chatMessages, msg].slice(-50);
    setChatMessages(updated);
    setChatInput("");
    try { await window.storage?.set("play-chat", JSON.stringify(updated), true); } catch {}
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: C.bg, minHeight: "100vh", padding: "20px 16px" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      <div style={{ maxWidth: 1160, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}>

        {/* ══════════════════════════════
            LEFT — Headline + Stock chart
            ══════════════════════════════ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Round / Score / Timer */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 700, letterSpacing: "0.1em" }}>
              ROUND {roundIdx + 1}/{ROUNDS.length}
            </span>
            <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 700, letterSpacing: "0.1em" }}>
              SCORE: <span style={{ color: C.green }}>{myScore}</span>
            </span>
            <div style={{ marginLeft: "auto", border: `2px solid ${timerStyle.border}`, borderRadius: 20, padding: "4px 14px", background: timerStyle.bg, transition: "all 0.5s", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: timerStyle.color, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{seconds}</span>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: timerStyle.color, opacity: 0.7 }}>SEC</span>
            </div>
          </div>

          {/* Headline card */}
          <div style={{ background: C.cardBg, border: `1.5px solid ${C.cardBorder}`, borderRadius: 16, padding: "22px 22px 16px", boxShadow: "0 4px 24px rgba(0,0,0,0.4)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 500 }}>{round.source}</span>
              <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 500 }}>{round.time}</span>
            </div>
            <h2 style={{ fontSize: "clamp(17px, 2.2vw, 22px)", fontWeight: 800, lineHeight: 1.3, color: C.textLight, margin: "0 0 18px" }}>
              {round.text}
            </h2>
            <div style={{ borderTop: "1px solid rgba(106,217,114,0.2)", paddingTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", color: C.textMuted }}>HOW WILL</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: C.green, letterSpacing: "0.08em" }}>{round.ticker}</span>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", color: C.textMuted }}>REACT?</span>
            </div>
          </div>

          {/* Stock chart card — same company as headline */}
          <div style={{ background: C.cardBg, border: `1.5px solid ${C.cardBorder}`, borderRadius: 16, padding: "16px", boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}>

            {/* Ticker + price */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.textLight, lineHeight: 1 }}>{round.ticker}</div>
                <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>{round.company}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.textLight }}>${Number(displayPrice).toLocaleString()}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: parseFloat(pricePct) >= 0 ? C.green : C.red }}>
                  {parseFloat(pricePct) >= 0 ? "▲" : "▼"} {Math.abs(pricePct)}%
                </div>
              </div>
            </div>

            {/* Timeframe tabs only — no stock switcher */}
            <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
              {TIMEFRAMES.map(tf => (
                <button key={tf} onClick={() => setTimeframe(tf)}
                  style={{ padding: "3px 10px", borderRadius: 6, border: "none", fontSize: 10, fontWeight: 700, cursor: "pointer",
                    background: timeframe === tf ? C.green : C.innerBg,
                    color:      timeframe === tf ? "#000"  : C.textMuted, transition: "all 0.2s" }}>
                  {tf}
                </button>
              ))}
            </div>

            {/* Chart */}
            <div style={{ borderRadius: 8, overflow: "hidden", height: 140, marginBottom: 8 }}>
              <StockChart data={chartData} color={chartColor} height={140} />
            </div>

            {/* Axis labels */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 9, color: C.textMuted }}>
                {timeframe === "1D" ? "24h ago" : timeframe === "5D" ? "5d ago" : timeframe === "1M" ? "1mo ago" : "3mo ago"}
              </span>
              <span style={{ fontSize: 9, color: C.textMuted }}>Now</span>
            </div>

            {/* Timer + opponent row */}
            {!stockRevealed && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: C.textMuted }}>
                  Opp:&nbsp;{opponentPick
                    ? <span style={{ color: opponentPick === "grow" ? C.green : C.red, fontWeight: 700 }}>{opponentPick.toUpperCase()} ✓</span>
                    : <span>thinking…</span>}
                </div>
                <div style={{ fontSize: 10, color: C.textMuted }}>
                  GUESS IN&nbsp;
                  <span style={{ fontWeight: 800, fontSize: 14, color: stockSecs > 15 ? C.green : stockSecs > 7 ? C.yellow : C.red, fontVariantNumeric: "tabular-nums" }}>
                    {stockSecs}s
                  </span>
                </div>
              </div>
            )}

            {/* Crash / Grow picks or result */}
            {!stockRevealed ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { key: "crash", icon: <TrendingDown size={16} />, label: "CRASH" },
                  { key: "grow",  icon: <TrendingUp   size={16} />, label: "GROW"  },
                ].map(({ key, icon, label }) => (
                  <button key={key} onClick={() => handleStockPick(key)} disabled={!!stockPick}
                    style={{
                      background: stockPick === key ? (key === "grow" ? "rgba(106,217,114,0.18)" : "rgba(255,68,85,0.18)") : C.innerBg,
                      border: `1.5px solid ${key === "grow" ? C.green : C.red}`,
                      borderRadius: 10, padding: "10px 8px", cursor: stockPick ? "default" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                      color: key === "grow" ? C.green : C.red, fontWeight: 800, fontSize: 13, transition: "all 0.2s",
                    }}>
                    {icon} {label}
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ background: "rgba(0,0,0,0.4)", borderRadius: 10, padding: "14px", textAlign: "center" }}>
                <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 6, letterSpacing: "0.1em" }}>
                  {round.ticker} RESULT
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: stockResult === "grow" ? C.green : C.red, marginBottom: 10 }}>
                  {stockResult === "grow" ? "📈 GREW" : "📉 CRASHED"}
                </div>
                <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 12 }}>
                  {[{ label: "You", pick: stockPick }, { label: "Opponent", pick: opponentPick }].map(({ label, pick }) => (
                    <div key={label}>
                      <div style={{ color: C.textMuted, fontSize: 10, marginBottom: 3 }}>{label}</div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: pick === stockResult ? C.green : C.red }}>
                        {pick ? (pick === stockResult ? "+$150" : "-$150") : "no pick"}
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={nextRound} style={{ background: C.green, color: "#000", border: "none", borderRadius: 8, padding: "8px 22px", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>
                  NEXT ROUND →
                </button>
              </div>
            )}
          </div>

          {/* Headline result banner */}
          {revealed && (
            <div style={{ background: isCorrect ? "rgba(106,217,114,0.1)" : "rgba(255,68,85,0.1)", border: `1.5px solid ${isCorrect ? C.green : C.red}`, borderRadius: 12, padding: "11px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, color: isCorrect ? C.green : C.red, fontSize: 13 }}>
                {selected
                  ? (isCorrect ? `✓ Correct! ${round.ticker} was expected to ${round.correct}.` : `✗ Wrong. ${round.ticker} was expected to ${round.correct}.`)
                  : `⏱ Time's up! ${round.ticker} was expected to ${round.correct}.`}
              </span>
              <button onClick={nextRound} style={{ background: C.green, color: "#000", border: "none", borderRadius: 8, padding: "7px 16px", fontWeight: 800, fontSize: 11, cursor: "pointer" }}>
                NEXT →
              </button>
            </div>
          )}

          <div style={{ textAlign: "center", fontSize: 10, color: C.textMuted }}>
            chatting as <span style={{ color: C.green }}>{username}</span>
          </div>
        </div>

        {/* ══════════════════════════════
            RIGHT — Portfolio + Live Chat
            ══════════════════════════════ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Portfolio */}
          <div style={{ background: C.cardBg, border: `1.5px solid ${C.cardBorder}`, borderRadius: 16, padding: "12px 14px" }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", color: C.textMuted, marginBottom: 8 }}>PORTFOLIO</div>
            <div style={{ display: "flex", gap: 8 }}>
              {[{ label: "You", val: portfolioMe }, { label: "Opponent", val: portfolioOpp }].map(({ label, val }) => (
                <div key={label} style={{ flex: 1, background: C.innerBg, borderRadius: 10, padding: "8px 10px", textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: C.textMuted, fontWeight: 600, marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: val >= 1000 ? C.green : C.red }}>${val.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Chat */}
          <div style={{ background: C.cardBg, border: `1.5px solid ${C.cardBorder}`, borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column", flex: 1, minHeight: 320 }}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(106,217,114,0.2)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <MessageCircle size={13} color={C.green} />
                <span style={{ fontWeight: 700, fontSize: 12, color: C.textLight }}>Live Chat</span>
              </div>
              <span style={{ fontSize: 10, color: C.textMuted }}>{chatMessages.length} msgs</span>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
              {chatMessages.length === 0 ? (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: C.textMuted, fontSize: 12, textAlign: "center" }}>
                  No messages yet. Share your thoughts!
                </div>
              ) : chatMessages.map(msg => (
                <div key={msg.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 1 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: msg.user === username ? C.green : C.textMuted }}>
                      {msg.user === username ? "You" : msg.user}
                    </span>
                    <span style={{ fontSize: 9, color: C.textMuted }}>{msg.time}</span>
                  </div>
                  <div style={{ fontSize: 11, color: C.textLight, lineHeight: 1.4, background: msg.user === username ? "rgba(106,217,114,0.08)" : C.innerBg, borderRadius: 7, padding: "4px 8px" }}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div style={{ padding: "7px 10px", borderTop: "1px solid rgba(106,217,114,0.2)", display: "flex", gap: 6, alignItems: "center" }}>
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()}
                placeholder="Is this legit or trolling?"
                style={{ flex: 1, border: "none", background: C.innerBg, borderRadius: 7, padding: "6px 10px", fontSize: 11, color: C.textLight, outline: "none", fontFamily: "inherit" }} />
              <button onClick={sendMessage} style={{ background: "none", border: "none", cursor: "pointer", color: C.green, padding: 2, display: "flex", alignItems: "center" }}>
                <Send size={14} />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}