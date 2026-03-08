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