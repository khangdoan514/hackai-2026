import { useState, useMemo } from "react"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

const STOCKS = [
  { ticker: "NVDA", name: "NVIDIA Corporation",           price: 177.82, change: -5.52,  pct: -3.01, base: 177, volume: "45.2M", marketCap: "438B", pe: 54.3 },
  { ticker: "ONDS", name: "Ondas Inc.",                   price: 9.83,   change: -0.63,  pct: -6.05, base: 9.8,  volume: "1.2M", marketCap: "89M", pe: null },
  { ticker: "AAL",  name: "American Airlines",            price: 11.18,  change: -0.61,  pct: -5.17, base: 11.2, volume: "32.1M", marketCap: "7.3B", pe: 11.2 },
  { ticker: "MRVL", name: "Marvell Technology",           price: 89.57,  change: +13.89, pct: +18.35,base: 89.5, volume: "28.4M", marketCap: "77.4B", pe: 42.8 },
  { ticker: "DAWN", name: "Day One Biopharmaceuticals",   price: 21.20,  change: +8.42,  pct: +65.88,base: 21.2, volume: "15.6M", marketCap: "2.1B", pe: null },
  { ticker: "PLUG", name: "Plug Power Inc.",              price: 2.13,   change: -0.16,  pct: -6.99, base: 2.1,  volume: "18.3M", marketCap: "1.4B", pe: null },
  { ticker: "INTC", name: "Intel Corporation",            price: 43.42,  change: -2.53,  pct: -5.51, base: 43.4, volume: "52.1M", marketCap: "184B", pe: 32.1 },
  { ticker: "SOFI", name: "SoFi Technologies",            price: 18.90,  change: -0.35,  pct: -1.82, base: 18.9, volume: "22.7M", marketCap: "20.1B", pe: null },
  { ticker: "PLTR", name: "Palantir Technologies",        price: 157.16, change: +4.49,  pct: +2.94, base: 157,  volume: "41.3M", marketCap: "356B", pe: 312.4 },
  { ticker: "TSLA", name: "Tesla, Inc.",                  price: 396.73, change: -8.82,  pct: -2.17, base: 396,  volume: "38.9M", marketCap: "1.27T", pe: 112.8 },
  { ticker: "F",    name: "Ford Motor Company",           price: 12.15,  change: -0.19,  pct: -1.54, base: 12.1, volume: "33.2M", marketCap: "48.2B", pe: 11.5 },
  { ticker: "PFE",  name: "Pfizer Inc.",                  price: 27.05,  change: +0.44,  pct: +1.65, base: 27.0, volume: "19.8M", marketCap: "153B", pe: 17.8 },
  { ticker: "AMZN", name: "Amazon.com, Inc.",             price: 213.21, change: -5.73,  pct: -2.62, base: 213,  volume: "29.4M", marketCap: "2.24T", pe: 41.2 },
  { ticker: "IOVA", name: "Iovance Biotherapeutics",      price: 5.13,   change: +0.55,  pct: +12.01,base: 5.1,  volume: "8.7M", marketCap: "1.5B", pe: null },
  { ticker: "PBR",  name: "Petróleo Brasileiro",          price: 17.60,  change: +0.87,  pct: +5.20, base: 17.6, volume: "15.3M", marketCap: "114B", pe: 5.2 },
  { ticker: "PATH", name: "UiPath, Inc.",                 price: 11.86,  change: +0.31,  pct: +2.68, base: 11.8, volume: "4.2M", marketCap: "6.7B", pe: null },
  { ticker: "VALE", name: "Vale S.A.",                    price: 14.97,  change: -0.45,  pct: -2.92, base: 15.0, volume: "12.5M", marketCap: "64.2B", pe: 5.8 },
  { ticker: "NOK",  name: "Nokia Oyj",                    price: 7.74,   change: -0.11,  pct: -1.40, base: 7.7,  volume: "8.9M", marketCap: "42.8B", pe: 24.6 },
  { ticker: "RKT",  name: "Rocket Companies",             price: 14.95,  change: -0.71,  pct: -4.53, base: 15.0, volume: "3.1M", marketCap: "29.4B", pe: 18.2 },
  { ticker: "RIG",  name: "Transocean Ltd.",              price: 5.93,   change: -0.20,  pct: -3.26, base: 5.9,  volume: "6.7M", marketCap: "5.2B", pe: null },
  { ticker: "NU",   name: "Nu Holdings Ltd.",             price: 14.58,  change: -0.24,  pct: -1.62, base: 14.6, volume: "11.2M", marketCap: "69.8B", pe: 45.3 },
  { ticker: "DNN",  name: "Denison Mines Corp.",          price: 3.67,   change: -0.21,  pct: -5.41, base: 3.7,  volume: "4.3M", marketCap: "3.3B", pe: null },
  { ticker: "OPEN", name: "Opendoor Technologies",        price: 5.00,   change: -0.18,  pct: -3.47, base: 5.0,  volume: "5.8M", marketCap: "3.5B", pe: null },
  { ticker: "BBD",  name: "Banco Bradesco S.A.",          price: 3.68,   change: -0.06,  pct: -1.60, base: 3.7,  volume: "9.1M", marketCap: "39.2B", pe: 8.4 },
]

const RANGES = ["1D", "5D", "1M", "3M", "1Y", "5Y"]

function generateChartData(base, pct, points = 100) {
  const data = []
  let p = base * (1 - Math.abs(pct) / 100 * 0.7)
  const trend = pct >= 0 ? 1 : -1
  const now = Date.now()
  for (let i = 0; i < points; i++) {
    p += (Math.random() - 0.47) * base * 0.015
    p += trend * base * 0.002 * (i / points)
    p = Math.max(base * 0.7, p)
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
      <div className="bg-[#0a0a0a]/98 border rounded-lg p-3 shadow-xl font-mono text-xs"
           style={{ borderColor: `${color}66` }}>
        <div className="text-gray-400 mb-1 text-[11px]">{payload[0].payload.time}</div>
        <div className="font-bold text-base" style={{ color }}>${payload[0].value.toFixed(2)}</div>
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

  const dayRange = `${Math.min(stock.price, stock.price - stock.change).toFixed(2)} - ${Math.max(stock.price, stock.price - stock.change).toFixed(2)}`
  const yearRange = `${(stock.price * 0.7).toFixed(2)} - ${(stock.price * 1.5).toFixed(2)}`

  return (
    <div
      onClick={() => setOpen(false)}
      className="h-screen text-white font-mono overflow-hidden"
    >
      {/* Header with market summary */}
      <div className="px-[70px] py-5 border-b border-white/10 flex justify-between items-center">
        <div className="flex items-center gap-10">
          <div className="flex gap-6">
            <div><span className="text-white/40 text-xs">DJI</span> <span className="text-sm font-bold ml-2">38,942.15</span> <span className="text-[#FF4455] text-xs ml-1.5">▼ 0.8%</span></div>
            <div><span className="text-white/40 text-xs">SPX</span> <span className="text-sm font-bold ml-2">5,234.80</span> <span className="text-[#FF4455] text-xs ml-1.5">▼ 0.5%</span></div>
            <div><span className="text-white/40 text-xs">COMP</span> <span className="text-sm font-bold ml-2">16,428.92</span> <span className="text-[#6AD972] text-xs ml-1.5">▲ 0.3%</span></div>
          </div>
        </div>
        <div className="text-xs text-white/40">LAST UPDATED: {new Date().toLocaleTimeString()}</div>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 flex overflow-hidden">

        {/* LEFT — Big Chart (3/4) */}
        <div className="flex-[3] flex flex-col px-[70px] py-6 border-r border-white/8 min-w-0 overflow-hidden">
          {/* Stock title + stats */}
          <div className="mb-5 flex-shrink-0">
            <div className="flex items-baseline gap-4 mb-2">
              <span className="text-4xl font-bold tracking-tight">{stock.ticker}</span>
              <span className="text-lg text-white/50">{stock.name}</span>
            </div>
            <div className="flex items-baseline gap-4">
              <span className="text-5xl font-bold tracking-tight">${stock.price.toFixed(2)}</span>
              <span className="text-xl font-bold" style={{ color }}>
                {isUp ? "▲" : "▼"} {isUp ? "+" : ""}{stock.change.toFixed(2)} ({isUp ? "+" : ""}{stock.pct.toFixed(2)}%)
              </span>
            </div>
          </div>

          {/* Range selector */}
          <div className="flex gap-1.5 mb-5 flex-shrink-0">
            {RANGES.map(r => (
              <button 
                key={r} 
                onClick={() => setRange(r)} 
                className="px-3.5 py-1.5 text-xs font-mono font-bold rounded-md transition-all duration-150 tracking-wider"
                style={{
                  background: range === r ? color : "transparent",
                  color: range === r ? "#000" : "rgba(255,255,255,0.6)",
                  border: `1px solid ${range === r ? color : "rgba(255,255,255,0.2)"}`,
                }}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Chart */}
          <div className="h-[35vh] overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 16, right: 16, bottom: 8, left: 8 }}>
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="time"
                  tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11, fontFamily: "'Space Mono', monospace" }}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  interval={Math.floor(chartData.length / 8)}
                />
                <YAxis
                  domain={[minVal - padding, maxVal + padding]}
                  tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11, fontFamily: "'Space Mono', monospace" }}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  tickFormatter={v => `$${v.toFixed(2)}`}
                  width={60}
                />
                <Tooltip content={<CustomTooltip color={color} />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2.5}
                  fill="url(#chartGrad)"
                  dot={false}
                  activeDot={{ r: 6, fill: color, stroke: "#000", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Key metrics */}
          <div className="mt-5 grid grid-cols-4 gap-4 bg-white/2 rounded-xl p-4 border border-white/6">
            {[
              ["VOLUME", stock.volume, "#fff"],
              ["MARKET CAP", stock.marketCap, "#fff"],
              ["P/E RATIO", stock.pe ? stock.pe.toFixed(1) : "—", "#fff"],
              ["DAY RANGE", dayRange, "rgba(255,255,255,0.9)"],
            ].map(([label, val, c]) => (
              <div key={label}>
                <div className="text-[10px] text-white/35 mb-1.5 tracking-wider">{label}</div>
                <div className="text-base font-bold" style={{ color: c }}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Stock Picker (1/4) */}
        <div className="flex-1 flex flex-col px-[70px] py-6 min-w-0 gap-5 overflow-hidden">

          {/* Dropdown */}
          <div className="flex-shrink-0">
            <div className="text-xs text-white/45 tracking-wider mb-3">CURRENT SELECTION</div>
            <div className="relative">
              <div
                onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
                className="bg-white/6 border rounded-lg p-3.5 cursor-pointer flex justify-between items-center transition-colors duration-150"
                style={{ borderColor: open ? color : "rgba(255,255,255,0.2)" }}
              >
                <div>
                  <div className="text-lg font-bold text-white text-left mb-1">{stock.ticker}</div>
                  <div className="text-xs text-white/50">{stock.name.slice(0, 28)}</div>
                </div>
                <span className={`text-white/60 text-xs transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▼</span>
              </div>

              {open && (
                <div
                  onClick={e => e.stopPropagation()}
                  className="absolute top-full left-0 right-0 mt-1.5 bg-[#111] border border-white/15 rounded-lg z-[100] max-h-72 overflow-y-auto shadow-2xl"
                >
                  {STOCKS.map(s => {
                    const up = s.pct >= 0
                    const c = up ? "#6AD972" : "#FF4455"
                    const active = s.ticker === selectedTicker
                    return (
                      <div
                        key={s.ticker}
                        onClick={() => { setSelectedTicker(s.ticker); setOpen(false) }}
                        className="p-3 cursor-pointer flex justify-start items-center hover:bg-white/6 transition-colors"
                        style={{
                          background: active ? "rgba(255,255,255,0.08)" : "transparent",
                          borderLeft: `3px solid ${active ? c : "transparent"}`,
                        }}
                      >
                        <div>
                          <div className="text-sm font-bold text-white">{s.ticker}</div>
                          <div className="text-[10px] text-white/40 mt-0.5">{s.name.slice(0, 22)}</div>
                        </div>
                        <span className="text-xs font-bold" style={{ color: c }}>
                          {up ? "▲" : "▼"}{Math.abs(s.pct).toFixed(1)}%
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ALL STOCKS list */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <div className="text-xs text-white/45 tracking-wider mb-3">
              WATCHLIST ({STOCKS.length})
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto justify-start pr-1">
              {STOCKS.map(s => {
                const up = s.pct >= 0
                const c = up ? "#6AD972" : "#FF4455"
                const active = s.ticker === selectedTicker
                return (
                  <div
                    key={s.ticker}
                    onClick={() => setSelectedTicker(s.ticker)}
                    className="p-2 cursor-pointer rounded-md flex justify-between items-center hover:bg-white/5 transition-colors border"
                    style={{
                      background: active ? "rgba(255,255,255,0.07)" : "transparent",
                      borderColor: active ? `${c}40` : "transparent",
                    }}
                  >
                    <div>
                      <span className="text-sm font-bold" style={{ color: active ? "#fff" : "rgba(255,255,255,0.7)" }}>{s.ticker}</span>
                      <span className="text-[10px] text-white/30 ml-2">${s.price.toFixed(2)}</span>
                    </div>
                    <span className="text-xs font-bold" style={{ color: c }}>{up ? "▲" : "▼"}{Math.abs(s.pct).toFixed(1)}%</span>
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