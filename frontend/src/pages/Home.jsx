import { useNavigate } from "react-router-dom"

export default function Home() {
  const navigate = useNavigate()

  return (
    <div
      className="relative flex flex-col items-center justify-center text-center overflow-hidden px-6 py-20"
      style={{ fontFamily: "'Space Mono', monospace" }}
    >
      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Orbitron:wght@400;600;700;800;900&display=swap" rel="stylesheet" />

      {/* Grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(106,217,114,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(106,217,114,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      {/* Glow behind title */}
      <div
        className="absolute pointer-events-none w-[600px] h-[300px]"
        style={{ background: "radial-gradient(ellipse, rgba(106,217,114,0.08) 0%, transparent 70%)" }}
      />

      {/* Ticker label */}
      <div
        className="text-[11px] font-bold tracking-[0.3em] uppercase mb-5"
        style={{ color: "#6AD972", fontFamily: "'Space Mono', monospace" }}
      >
        ▶ MARKET_SIM_v2.0 // LIVE
      </div>

      {/* Big name */}
      <h1
        className="text-[clamp(44px,9vw,110px)] font-black uppercase tracking-[0.08em] leading-none m-0 mb-1"
        style={{
          fontFamily: "'Orbitron', sans-serif",
          color: "#ffffff",
          textShadow: "0 0 40px rgba(106,217,114,0.3), 0 0 80px rgba(106,217,114,0.1)",
        }}
      >
        PapaQuant
      </h1>

      {/* Green underline accent */}
      <div
        className="w-[clamp(200px,40vw,480px)] h-[2px] my-4"
        style={{ background: "linear-gradient(90deg, transparent, #6AD972, transparent)" }}
      />

      {/* Tagline */}
      <p
        className="text-[clamp(13px,2vw,17px)] font-normal tracking-[0.18em] uppercase mb-14"
        style={{ color: "rgba(255,255,255,0.45)", fontFamily: "'Space Mono', monospace" }}
      >
        Decide_Before_the_Dip<span style={{ color: "#6AD972" }}>.</span>
      </p>

      {/* Buttons */}
      <div className="flex gap-4 flex-wrap justify-center">

        {/* About button */}
        <button
          onClick={() => navigate("/about")}
          className="uppercase font-bold text-[13px] tracking-[0.14em] px-9 py-3.5 rounded-lg cursor-pointer transition-all duration-200 text-white"
          style={{
            fontFamily: "'Space Mono', monospace",
            background: "rgba(255,255,255,0.04)",
            border: "1.5px solid #6AD972",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "rgba(106,217,114,0.1)"
            e.currentTarget.style.boxShadow = "0 0 16px rgba(106,217,114,0.2)"
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "rgba(255,255,255,0.04)"
            e.currentTarget.style.boxShadow = "none"
          }}
        >
          [ ABOUT ]
        </button>

        {/* Play button */}
        <button
          onClick={() => navigate("/play")}
          className="uppercase font-bold text-[13px] tracking-[0.14em] px-9 py-3.5 rounded-lg cursor-pointer transition-all duration-200 flex items-center gap-3 text-black"
          style={{
            fontFamily: "'Space Mono', monospace",
            background: "#6AD972",
            border: "1.5px solid #6AD972",
            boxShadow: "0 0 20px rgba(106,217,114,0.3)",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "#7ee886"
            e.currentTarget.style.boxShadow = "0 0 32px rgba(106,217,114,0.5)"
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "#6AD972"
            e.currentTarget.style.boxShadow = "0 0 20px rgba(106,217,114,0.3)"
          }}
        >
          PLAY →
        </button>

      </div>

      {/* Bottom status bar */}
      <div
        className="absolute bottom-6 text-[10px] tracking-[0.2em] uppercase pointer-events-none"
        style={{ color: "rgba(106,217,114,0.4)", fontFamily: "'Space Mono', monospace" }}
      >
        SYS::READY // NYSE_FEED // CRYPTO_FEED
      </div>

    </div>
  )
}