import { useState, useMemo } from "react"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

const STOCKS = [
  { ticker: "NVDA", name: "NVIDIA Corporation",           price: 177.82, change: -5.52,  pct: -3.01, base: 177  },
  { ticker: "ONDS", name: "Ondas Inc.",                   price: 9.83,   change: -0.63,  pct: -6.05, base: 9.8  },
  { ticker: "AAL",  name: "American Airlines",            price: 11.18,  change: -0.61,  pct: -5.17, base: 11.2 },
  { ticker: "MRVL", name: "Marvell Technology",           price: 89.57,  change: +13.89, pct: +18.35,base: 89.5 },
  { ticker: "DAWN", name: "Day One Biopharmaceuticals",   price: 21.20,  change: +8.42,  pct: +65.88,base: 21.2 },
  { ticker: "PLUG", name: "Plug Power Inc.",              price: 2.13,   change: -0.16,  pct: -6.99, base: 2.1  },
  { ticker: "INTC", name: "Intel Corporation",            price: 43.42,  change: -2.53,  pct: -5.51, base: 43.4 },
  { ticker: "SOFI", name: "SoFi Technologies",            price: 18.90,  change: -0.35,  pct: -1.82, base: 18.9 },
  { ticker: "PLTR", name: "Palantir Technologies",        price: 157.16, change: +4.49,  pct: +2.94, base: 157  },
  { ticker: "TSLA", name: "Tesla, Inc.",                  price: 396.73, change: -8.82,  pct: -2.17, base: 396  },
  { ticker: "F",    name: "Ford Motor Company",           price: 12.15,  change: -0.19,  pct: -1.54, base: 12.1 },
  { ticker: "PFE",  name: "Pfizer Inc.",                  price: 27.05,  change: +0.44,  pct: +1.65, base: 27.0 },
  { ticker: "AMZN", name: "Amazon.com, Inc.",             price: 213.21, change: -5.73,  pct: -2.62, base: 213  },
  { ticker: "IOVA", name: "Iovance Biotherapeutics",      price: 5.13,   change: +0.55,  pct: +12.01,base: 5.1  },
  { ticker: "PBR",  name: "Petróleo Brasileiro",          price: 17.60,  change: +0.87,  pct: +5.20, base: 17.6 },
  { ticker: "PATH", name: "UiPath, Inc.",                 price: 11.86,  change: +0.31,  pct: +2.68, base: 11.8 },
  { ticker: "VALE", name: "Vale S.A.",                    price: 14.97,  change: -0.45,  pct: -2.92, base: 15.0 },
  { ticker: "NOK",  name: "Nokia Oyj",                    price: 7.74,   change: -0.11,  pct: -1.40, base: 7.7  },
  { ticker: "RKT",  name: "Rocket Companies",             price: 14.95,  change: -0.71,  pct: -4.53, base: 15.0 },
  { ticker: "RIG",  name: "Transocean Ltd.",              price: 5.93,   change: -0.20,  pct: -3.26, base: 5.9  },
  { ticker: "NU",   name: "Nu Holdings Ltd.",             price: 14.58,  change: -0.24,  pct: -1.62, base: 14.6 },
  { ticker: "DNN",  name: "Denison Mines Corp.",          price: 3.67,   change: -0.21,  pct: -5.41, base: 3.7  },
  { ticker: "OPEN", name: "Opendoor Technologies",        price: 5.00,   change: -0.18,  pct: -3.47, base: 5.0  },
  { ticker: "BBD",  name: "Banco Bradesco S.A.",          price: 3.68,   change: -0.06,  pct: -1.60, base: 3.7  },
]

const RANGES = ["1D", "5D", "1M", "3M", "1Y"]

function generateChartData(base, pct, points = 80) {
  const data = []
  let p = base * (1 - Math.abs(pct) / 100 * 0.7)
  const trend = pct >= 0 ? 1 : -1
  const now = Date.now()
  for (let i = 0; i < points; i++) {
    p += (Math.random() - 0.47) * base * 0.012
    p += trend * base * 0.0015 * (i / points)
    p = Math.max(base * 0.75, p)
    const t = new Date(now - (points - i) * 5 * 60 * 1000)
    data.push({
      time: t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      value: parseFloat(p.toFixed(2)),
    })
  }
  data[data.length - 1].value = base
  return data
}

const CustomTooltip = ({ active, payload, color }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: "rgba(10,10,10,0.95)",
        border: `1px solid ${color}44`,
        borderRadius: 6,
        padding: "8px 12px",
        fontFamily: "'Space Mono', monospace",
        fontSize: 11,
      }}>
        <div style={{ color: "#888", marginBottom: 2 }}>{payload[0].payload.time}</div>
        <div style={{ color, fontWeight: 700, fontSize: 13 }}>${payload[0].value.toFixed(2)}</div>
      </div>
    )
  }
  return null
}

export default function Finance() {
  const [selectedTicker, setSelectedTicker] = useState("NVDA")
  const [range, setRange] = useState("1D")
  const [open, setOpen] = useState(false)

  const stock = STOCKS.find(s => s.ticker === selectedTicker)
  const isUp = stock.pct >= 0
  const color = isUp ? "#6AD972" : "#FF4455"

  const chartData = useMemo(() => generateChartData(stock.base, stock.pct), [selectedTicker, range])

  const minVal = Math.min(...chartData.map(d => d.value))
  const maxVal = Math.max(...chartData.map(d => d.value))
  const padding = (maxVal - minVal) * 0.1

  return (
    <div
      onClick={() => setOpen(false)}
      style={{
        
      }}
    >
      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      {/* Body */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", overflow: "hidden" }}>

        {/* LEFT — Big Chart (3/4) */}
        <div style={{
          flex: 3,
          display: "flex",
          flexDirection: "column",
          padding: "24px 28px",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          minWidth: 0,
          overflow: "hidden",
        }}>
          {/* Stock title + stats */}
          <div style={{ marginBottom: 20, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 6 }}>
              <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em" }}>{stock.ticker}</span>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{stock.name}</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <span style={{ fontSize: 36, fontWeight: 700, letterSpacing: "-0.03em" }}>${stock.price.toFixed(2)}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color }}>
                {isUp ? "▲" : "▼"} {isUp ? "+" : ""}{stock.change.toFixed(2)} ({isUp ? "+" : ""}{stock.pct.toFixed(2)}%)
              </span>
            </div>
          </div>

          {/* Range selector */}
          <div style={{ display: "flex", gap: 4, marginBottom: 16, flexShrink: 0 }}>
            {RANGES.map(r => (
              <button key={r} onClick={() => setRange(r)} style={{
                background: range === r ? color : "transparent",
                color: range === r ? "#000" : "rgba(255,255,255,0.4)",
                border: `1px solid ${range === r ? color : "rgba(255,255,255,0.12)"}`,
                borderRadius: 4,
                padding: "3px 10px",
                fontSize: 10,
                fontFamily: "'Space Mono', monospace",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s",
                letterSpacing: "0.05em",
              }}>
                {r}
              </button>
            ))}
          </div>

          {/* Chart */}
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="time"
                  tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9, fontFamily: "'Space Mono', monospace" }}
                  tickLine={false}
                  axisLine={false}
                  interval={Math.floor(chartData.length / 6)}
                />
                <YAxis
                  domain={[minVal - padding, maxVal + padding]}
                  tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9, fontFamily: "'Space Mono', monospace" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => `$${v.toFixed(0)}`}
                  width={48}
                />
                <Tooltip content={<CustomTooltip color={color} />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2}
                  fill="url(#chartGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: color, stroke: "#000", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RIGHT — Stock Picker (1/4) */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "24px 20px",
          minWidth: 0,
          gap: 16,
          overflow: "hidden",
        }}>

          {/* Dropdown */}
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: "0.15em", marginBottom: 10 }}>
              SELECT STOCK
            </div>
            <div style={{ position: "relative" }}>
              <div
                onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${open ? color : "rgba(255,255,255,0.12)"}`,
                  borderRadius: 6,
                  padding: "10px 14px",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  transition: "border-color 0.15s",
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{stock.ticker}</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{stock.name.slice(0, 22)}</div>
                </div>
                <span style={{
                  color: "rgba(255,255,255,0.35)",
                  fontSize: 10,
                  display: "inline-block",
                  transform: open ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                }}>▼</span>
              </div>

              {open && (
                <div
                  onClick={e => e.stopPropagation()}
                  style={{
                    position: "absolute",
                    top: "calc(100% + 4px)",
                    left: 0,
                    right: 0,
                    background: "#111",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 6,
                    zIndex: 100,
                    maxHeight: 280,
                    overflowY: "auto",
                    boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
                  }}
                >
                  {STOCKS.map(s => {
                    const up = s.pct >= 0
                    const c = up ? "#6AD972" : "#FF4455"
                    const active = s.ticker === selectedTicker
                    return (
                      <div
                        key={s.ticker}
                        onClick={() => { setSelectedTicker(s.ticker); setOpen(false) }}
                        style={{
                          padding: "9px 14px",
                          cursor: "pointer",
                          background: active ? "rgba(255,255,255,0.06)" : "transparent",
                          borderLeft: active ? `2px solid ${c}` : "2px solid transparent",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                        onMouseLeave={e => e.currentTarget.style.background = active ? "rgba(255,255,255,0.06)" : "transparent"}
                      >
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>{s.ticker}</div>
                          <div style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>{s.name.slice(0, 20)}</div>
                        </div>
                        <span style={{ fontSize: 9, fontWeight: 700, color: c }}>
                          {up ? "▲" : "▼"}{Math.abs(s.pct).toFixed(1)}%
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Stats panel */}
          <div style={{
            flexShrink: 0,
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 8,
            padding: "14px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}>
            {[
              ["PRICE",    `$${stock.price.toFixed(2)}`,                         "#fff"],
              ["CHANGE",   `${isUp ? "+" : ""}${stock.change.toFixed(2)}`,       color],
              ["CHANGE %", `${isUp ? "+" : ""}${stock.pct.toFixed(2)}%`,         color],
            ].map(([label, val, c]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", letterSpacing: "0.12em" }}>{label}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: c }}>{val}</span>
              </div>
            ))}
          </div>

          {/* ALL STOCKS list — takes remaining space, scrolls internally only */}
          <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: "0.15em", marginBottom: 8, flexShrink: 0 }}>
              ALL STOCKS
            </div>
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
              {STOCKS.map(s => {
                const up = s.pct >= 0
                const c = up ? "#6AD972" : "#FF4455"
                const active = s.ticker === selectedTicker
                return (
                  <div
                    key={s.ticker}
                    onClick={() => setSelectedTicker(s.ticker)}
                    style={{
                      padding: "6px 8px",
                      cursor: "pointer",
                      borderRadius: 5,
                      background: active ? "rgba(255,255,255,0.05)" : "transparent",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 2,
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                    onMouseLeave={e => e.currentTarget.style.background = active ? "rgba(255,255,255,0.05)" : "transparent"}
                  >
                    <span style={{ fontSize: 10, fontWeight: 700, color: active ? "#fff" : "rgba(255,255,255,0.6)" }}>{s.ticker}</span>
                    <span style={{ fontSize: 9, color: c }}>{up ? "▲" : "▼"}{Math.abs(s.pct).toFixed(2)}%</span>
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
