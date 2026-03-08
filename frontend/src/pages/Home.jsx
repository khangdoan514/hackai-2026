import { useNavigate } from "react-router-dom"

export default function Home() {
  const navigate = useNavigate()

  return (
    <div
      className="relative flex flex-col items-center justify-center text-center overflow-hidden px-6 py-25"
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
        className="absolute pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(106,217,114,0.08) 0%, transparent 70%)" }}
      />

      {/* Ticker label */}
      <div
        className="text-[13px] font-bold tracking-[0.3em] uppercase mb-8"
        style={{ color: "#6AD972", fontFamily: "'Space Mono', monospace" }}
      >
        ▶ FINANCIAL_INTELLIGENCE_v2.0 // LIVE
      </div>

      {/* Big name */}
      <h1
        className="text-[clamp(44px,9vw,110px)] font-black uppercase tracking-[0.08em] leading-none m-0 mb-1"
        style={{
          fontFamily: "'Orbitron', sans-serif",
          color: "#ffffff",
          textShadow: "0 0 25px rgba(106,217,114,0.7), 0 0 80px rgba(106,217,114,0.35)",
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
        className="text-[clamp(13px,2vw,17px)] font-normal tracking-[0.18em] uppercase mb-10 mt-5"
        style={{ color: "rgba(255,255,255,0.45)", fontFamily: "'Space Mono', monospace" }}
      >
        Decide_Before_the_Dip<span style={{ color: "#6AD972" }}>.</span>
      </p>

      {/* Buttons */}
      <div className="flex gap-4 flex-wrap justify-center">
        {/* FINANCE button — now solid green */}
        <button
          onClick={() => navigate("/finance")}
          className="uppercase font-bold text-[13px] tracking-[0.14em] px-9 py-3.5 rounded-lg cursor-pointer flex items-center gap-3 text-black"
          style={{
            fontFamily: "'Space Mono', monospace",
            background: "#6AD972",
            border: "1.5px solid #6AD972",
            boxShadow: "0 0 20px rgba(106,217,114,0.3)",
            transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "#7ee886"
            e.currentTarget.style.boxShadow = "0 0 40px rgba(106,217,114,0.6), inset 0 0 12px rgba(255,255,255,0.1)"
            e.currentTarget.style.transform = "scale(1.05) translateY(-2px)"
            e.currentTarget.style.letterSpacing = "0.2em"
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "#6AD972"
            e.currentTarget.style.boxShadow = "0 0 20px rgba(106,217,114,0.3)"
            e.currentTarget.style.transform = "scale(1) translateY(0)"
            e.currentTarget.style.letterSpacing = "0.14em"
          }}
        >
          [ FINANCE ]
        </button>

        {/* NEWS button — now transparent */}
        <button
          onClick={() => navigate("/news")}
          className="uppercase font-bold text-[13px] tracking-[0.14em] px-9 py-3.5 rounded-lg cursor-pointer flex items-center gap-3 text-white"
          style={{
            fontFamily: "'Space Mono', monospace",
            background: "rgba(255,255,255,0.04)",
            border: "1.5px solid #6AD972",
            transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "rgba(106,217,114,0.12)"
            e.currentTarget.style.boxShadow = "0 0 24px rgba(106,217,114,0.3), inset 0 0 12px rgba(106,217,114,0.05)"
            e.currentTarget.style.transform = "scale(1.05) translateY(-2px)"
            e.currentTarget.style.borderColor = "#6AD972"
            e.currentTarget.style.letterSpacing = "0.2em"
            e.currentTarget.querySelector(".arrow").style.transform = "translateX(6px)"
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "rgba(255,255,255,0.04)"
            e.currentTarget.style.boxShadow = "none"
            e.currentTarget.style.transform = "scale(1) translateY(0)"
            e.currentTarget.style.borderColor = "#6AD972"
            e.currentTarget.style.letterSpacing = "0.14em"
            e.currentTarget.querySelector(".arrow").style.transform = "translateX(0)"
          }}
        >
          [ NEWS ]
          <span
            className="arrow"
            style={{ display: "inline-block", transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
          >
            →
          </span>
        </button>
      </div>

      {/* Bottom status bar */}
      <div
        className="absolute bottom-6 text-[10px] tracking-[0.2em] uppercase pointer-events-none"
        style={{ color: "rgba(106,217,114,0.6)", fontFamily: "'Space Mono', monospace" }}
      >
        SYS::READY // NYSE_FEED // CRYPTO_FEED
      </div>

    </div>
  )
}