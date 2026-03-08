import { useEffect, useMemo, useRef, useState } from "react";
import { createChart, AreaSeries } from "lightweight-charts";

const WATCHLIST = [
  { ticker: "AAPL", name: "Apple Inc." },
  { ticker: "NVDA", name: "NVIDIA Corporation" },
  { ticker: "TSLA", name: "Tesla, Inc." },
  { ticker: "AMZN", name: "Amazon.com, Inc." },
  { ticker: "MSFT", name: "Microsoft Corporation" },
  { ticker: "META", name: "Meta Platforms, Inc." },
  { ticker: "AMD", name: "Advanced Micro Devices" },
  { ticker: "PLTR", name: "Palantir Technologies" },
];

const RANGES = ["1D", "5D", "1M", "3M", "1Y", "5Y"];
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
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const intervalRef = useRef(null);

  const [symbol, setSymbol] = useState("AAPL");
  const [range, setRange] = useState("1D");
  const [open, setOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [historyData, setHistoryData] = useState([]);
  const [latestData, setLatestData] = useState(null);

  const selectedStock =
    WATCHLIST.find((stock) => stock.ticker === symbol) || WATCHLIST[0];

  const firstValue = historyData.length ? Number(historyData[0].value) : null;
  const latestValue =
    latestData?.value ??
    (historyData.length
      ? Number(historyData[historyData.length - 1].value)
      : null);

  const change = useMemo(() => {
    if (firstValue == null || latestValue == null) return 0;
    return latestValue - firstValue;
  }, [firstValue, latestValue]);

  const pct = useMemo(() => {
    if (firstValue == null || latestValue == null || firstValue === 0) return 0;
    return (change / firstValue) * 100;
  }, [change, firstValue, latestValue]);

  const isUp = pct >= 0;
  const color = isUp ? "#6AD972" : "#FF4455";

  const minVal = historyData.length
    ? Math.min(...historyData.map((d) => Number(d.value)))
    : 0;

  const maxVal = historyData.length
    ? Math.max(...historyData.map((d) => Number(d.value)))
    : 0;

  const dayRange = historyData.length
    ? `${minVal.toFixed(2)} - ${maxVal.toFixed(2)}`
    : "—";

  const mockVolume = "24.8M";
  const mockMarketCap = "3.1T";
  const mockPE = "31.4";

  const yearRange =
    latestValue != null
      ? `${(latestValue * 0.72).toFixed(2)} - ${(latestValue * 1.18).toFixed(2)}`
      : "—";

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 380,
      layout: {
        background: { color: "#000000" },
        textColor: "rgba(255,255,255,0.45)",
        fontFamily: "'Space Mono', monospace",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.04)" },
        horzLines: { color: "rgba(255,255,255,0.06)" },
      },
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        vertLine: {
          color: "rgba(255,255,255,0.14)",
          width: 1,
        },
        horzLine: {
          color: "rgba(255,255,255,0.14)",
          width: 1,
        },
      },
    });

    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: color,
      lineWidth: 2.5,
      topColor: `${color}55`,
      bottomColor: `${color}00`,
      priceLineVisible: false,
      lastValueVisible: true,
      crosshairMarkerVisible: true,
      relativeGradient: true,
    });

    chartRef.current = chart;
    seriesRef.current = areaSeries;

    const handleResize = () => {
      if (!chartContainerRef.current || !chartRef.current) return;
      chartRef.current.applyOptions({
        width: chartContainerRef.current.clientWidth,
      });
      chartRef.current.timeScale().fitContent();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (intervalRef.current) clearInterval(intervalRef.current);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current) return;

    seriesRef.current.applyOptions({
      lineColor: color,
      topColor: `${color}55`,
      bottomColor: `${color}00`,
    });
  }, [color]);

  useEffect(() => {
    if (!seriesRef.current || !chartRef.current) return;

    async function loadHistory() {
      setLoading(true);
      setError("");
      setLatestData(null);

      try {
        const res = await fetch(
          `http://127.0.0.1:8000/stocks/history?symbol=${symbol}&range=${range}`
        );

        const text = await res.text();

        if (!res.ok) {
          throw new Error(text);
        }

        const data = JSON.parse(text);

        const formatted = data.map((point) => ({
          time: point.time,
          value: Number(point.value),
        }));

        setHistoryData(formatted);
        seriesRef.current.setData(formatted);
        chartRef.current.timeScale().fitContent();
      } catch (err) {
        console.error("History fetch failed:", err);
        setError(
          `Could not load stock history: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
        setHistoryData([]);
        seriesRef.current.setData([]);
      } finally {
        setLoading(false);
      }
    }

    async function loadLatest() {
      try {
        const res = await fetch(
          `http://127.0.0.1:8000/stocks/latest?symbol=${symbol}`
        );

        const text = await res.text();

        if (!res.ok) {
          throw new Error(text);
        }

        const point = JSON.parse(text);

        const formattedPoint = {
          time: point.time,
          value: Number(point.value),
        };

        setLatestData(formattedPoint);
        seriesRef.current.update(formattedPoint);
      } catch (err) {
        console.error("Latest fetch failed:", err);
      }
    }

    loadHistory();

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(loadLatest, 15000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [symbol, range]);

  const dayRange = `${Math.min(stock.price, stock.price - stock.change).toFixed(2)} - ${Math.max(stock.price, stock.price - stock.change).toFixed(2)}`
  const yearRange = `${(stock.price * 0.7).toFixed(2)} - ${(stock.price * 1.5).toFixed(2)}`

  return (
    <div
      onClick={() => setOpen(false)}
      className="h-200 text-white font-mono overflow-hidden"
    >
      {/* Header */}
      <div className="px-[50px] py-5 border-b border-white/10 flex justify-between items-center">
        <div className="flex items-center gap-10">
          <div className="flex gap-6">
            <div>
              <span className="text-white/40 text-xs">DJI</span>
              <span className="text-sm font-bold ml-2">38,942.15</span>
              <span className="text-[#FF4455] text-xs ml-1.5">▼ 0.8%</span>
            </div>
            <div>
              <span className="text-white/40 text-xs">SPX</span>
              <span className="text-sm font-bold ml-2">5,234.80</span>
              <span className="text-[#FF4455] text-xs ml-1.5">▼ 0.5%</span>
            </div>
            <div>
              <span className="text-white/40 text-xs">COMP</span>
              <span className="text-sm font-bold ml-2">16,428.92</span>
              <span className="text-[#6AD972] text-xs ml-1.5">▲ 0.3%</span>
            </div>
          </div>
        </div>
        <div className="text-xs text-white/40">
          LAST UPDATED: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Body */}
      <div className="min-h-0 flex overflow-hidden">
        {/* LEFT */}
        <div className="flex-[3] flex flex-col px-[70px] py-6 border-r border-white/8 min-w-0 overflow-hidden">
          <div className="mb-5 flex-shrink-0">
            <div className="flex items-baseline gap-4 mb-2">
              <span className="text-4xl font-bold tracking-tight">{symbol}</span>
              <span className="text-lg text-white/50">{selectedStock.name}</span>
            </div>

            <div className="flex items-baseline gap-4">
              <span className="text-5xl font-bold tracking-tight">
                {latestValue != null ? `$${latestValue.toFixed(2)}` : "—"}
              </span>
              <span className="text-xl font-bold" style={{ color }}>
                {isUp ? "▲" : "▼"} {isUp ? "+" : ""}
                {change.toFixed(2)} ({isUp ? "+" : ""}
                {pct.toFixed(2)}%)
              </span>
            </div>
          </div>

          <div className="flex gap-1.5 mb-5 flex-shrink-0">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className="px-3.5 py-1.5 text-xs font-mono font-bold rounded-md transition-all duration-150 tracking-wider"
                style={{
                  background: range === r ? color : "transparent",
                  color: range === r ? "#000" : "rgba(255,255,255,0.6)",
                  border: `1px solid ${
                    range === r ? color : "rgba(255,255,255,0.2)"
                  }`,
                }}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="relative h-[35vh] overflow-hidden rounded-xl border border-white/6 bg-white/[0.02]">
            <div
              ref={chartContainerRef}
              style={{ width: "100%", height: "100%" }}
            />

            {loading && (
              <div className="absolute inset-0 flex items-center justify-center text-white/50 text-sm bg-black/20">
                Loading chart...
              </div>
            )}
          </div>

          {error && (
            <div className="mt-3 text-sm text-red-400 border border-red-500/20 rounded-lg px-3 py-2 bg-red-500/5">
              {error}
            </div>
          )}

          <div className="mt-5 grid grid-cols-4 gap-4 bg-white/2 rounded-xl p-4 border border-white/6">
            {[
              ["VOLUME", mockVolume],
              ["MARKET CAP", mockMarketCap],
              ["P/E RATIO", mockPE],
              ["DAY RANGE", dayRange],
              ["52W RANGE", yearRange],
              ["OPEN", firstValue != null ? `$${firstValue.toFixed(2)}` : "—"],
              ["HIGH", maxVal ? `$${maxVal.toFixed(2)}` : "—"],
              ["LOW", minVal ? `$${minVal.toFixed(2)}` : "—"],
            ].map(([label, value]) => (
              <div key={label}>
                <div className="text-[10px] text-white/35 mb-1.5 tracking-wider">
                  {label}
                </div>
                <div className="text-base font-bold text-white">{value}</div>
              </div>
            ))}
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

        {/* RIGHT */}
        <div className="w-[320px] flex flex-col px-6 py-6 gap-4 overflow-hidden">
          <div className="flex-shrink-0">
            <div className="text-[10px] text-white/45 tracking-wider mb-2">
              CURRENT SELECTION
            </div>

            <div className="relative">
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen((o) => !o);
                }}
                className="bg-white/6 border rounded-lg px-3 py-3 cursor-pointer flex justify-between items-center transition-colors duration-150"
                style={{ borderColor: open ? color : "rgba(255,255,255,0.2)" }}
              >
                <div>
                  <div className="text-base font-bold text-white text-left mb-0.5">
                    {symbol}
                  </div>
                  <div className="text-[11px] text-white/50">
                    {selectedStock.name.slice(0, 24)}
                  </div>
                </div>
                <span
                  className={`text-white/60 text-xs transition-transform duration-200 ${
                    open ? "rotate-180" : ""
                  }`}
                >
                  ▼
                </span>
              </div>

              {open && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-full left-0 right-0 mt-1.5 bg-[#111] border border-white/15 rounded-lg z-[100] max-h-72 overflow-y-auto shadow-2xl"
                >
                  {WATCHLIST.map((s) => {
                    const active = s.ticker === symbol;
                    return (
                      <div
                        key={s.ticker}
                        onClick={() => {
                          setSymbol(s.ticker);
                          setOpen(false);
                        }}
                        className="p-3 cursor-pointer hover:bg-white/6 transition-colors"
                        style={{
                          background: active
                            ? "rgba(255,255,255,0.08)"
                            : "transparent",
                          borderLeft: `3px solid ${
                            active ? color : "transparent"
                          }`,
                        }}
                      >
                        <div className="text-sm font-bold text-white">
                          {s.ticker}
                        </div>
                        <div className="text-[10px] text-white/40 mt-0.5">
                          {s.name.slice(0, 22)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="text-[10px] text-white/45 tracking-wider mb-2">
              WATCHLIST ({WATCHLIST.length})
            </div>

            <div className="flex flex-col gap-1">
              {WATCHLIST.map((s, i) => {
                const active = s.ticker === symbol;
                const fakePct = (
                  (i % 2 === 0 ? 1 : -1) *
                  (1.2 + i * 0.4)
                ).toFixed(1);
                const up = Number(fakePct) >= 0;
                const rowColor = up ? "#6AD972" : "#FF4455";

                return (
                  <div
                    key={s.ticker}
                    onClick={() => {
                      setSymbol(s.ticker);
                    }}
                    className="px-2.5 py-2 cursor-pointer rounded-md flex justify-between items-center hover:bg-white/5 transition-colors border"
                    style={{
                      background: active ? "rgba(255,255,255,0.07)" : "transparent",
                      borderColor: active ? `${rowColor}40` : "transparent",
                    }}
                  >
                    <div className="min-w-0">
                      <span
                        className="text-xs font-bold"
                        style={{
                          color: active ? "#fff" : "rgba(255,255,255,0.7)",
                        }}
                      >
                        {s.ticker}
                      </span>
                      <span className="text-[9px] text-white/30 ml-1.5">
                        {s.name.slice(0, 14)}
                      </span>
                    </div>
                    <span
                      className="text-[11px] font-bold shrink-0"
                      style={{ color: rowColor }}
                    >
                      {up ? "▲" : "▼"}
                      {Math.abs(Number(fakePct)).toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}