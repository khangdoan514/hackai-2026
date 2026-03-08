import { useNavigate } from "react-router-dom"

export default function Home() {
  const navigate = useNavigate()

  return (
    <div style={{
      fontFamily: "'Space Mono', monospace",
      minHeight: "calc(100vh - 61px)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 24px",
      textAlign: "center",
      position: "relative",
      overflow: "hidden",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Orbitron:wght@400;600;700;800;900&display=swap" rel="stylesheet" />

      {/* Subtle grid background */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(106,217,114,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(106,217,114,0.04) 1px, transparent 1px)
        `,
        backgroundSize: "48px 48px",
        pointerEvents: "none",
      }} />

      {/* Glow behind title */}
      <div style={{
        position: "absolute",
        width: "600px",
        height: "300px",
        background: "radial-gradient(ellipse, rgba(106,217,114,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Ticker label */}
      <div style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.3em",
        color: "#6AD972",
        marginBottom: 20,
        textTransform: "uppercase",
      }}>
        ▶ MARKET_SIM_v2.0 // LIVE
      </div>

      {/* Big name */}
      <h1 style={{
        fontFamily: "'Orbitron', sans-serif",
        fontSize: "clamp(44px, 9vw, 110px)",
        fontWeight: 900,
        color: "#ffffff",
        letterSpacing: "0.08em",
        lineHeight: 1,
        margin: "0 0 4px",
        textTransform: "uppercase",
        textShadow: "0 0 40px rgba(106,217,114,0.3), 0 0 80px rgba(106,217,114,0.1)",
      }}>
        PapaQuant
      </h1>

      {/* Green underline accent */}
      <div style={{
        width: "clamp(200px, 40vw, 480px)",
        height: "2px",
        background: "linear-gradient(90deg, transparent, #6AD972, transparent)",
        margin: "16px auto 28px",
      }} />

      {/* Tagline */}
      <p style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: "clamp(13px, 2vw, 17px)",
        fontWeight: 400,
        color: "rgba(255,255,255,0.45)",
        letterSpacing: "0.18em",
        margin: "0 0 56px",
        textTransform: "uppercase",
      }}>
        Decide_Before_the_Dip<span style={{ color: "#6AD972" }}>.</span>
      </p>

      {/* Buttons */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>

        {/* About button */}
        <button
          onClick={() => navigate("/about")}
          style={{
            fontFamily: "'Space Mono', monospace",
            background: "rgba(255,255,255,0.04)",
            border: "1.5px solid #6AD972",
            borderRadius: 8,
            padding: "14px 36px",
            color: "#ffffff",
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: "0.14em",
            cursor: "pointer",
            transition: "all 0.2s",
            textTransform: "uppercase",
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
          style={{
            fontFamily: "'Space Mono', monospace",
            background: "#6AD972",
            border: "1.5px solid #6AD972",
            borderRadius: 8,
            padding: "14px 36px",
            color: "#000",
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: "0.14em",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 12,
            transition: "all 0.2s",
            textTransform: "uppercase",
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
      <div style={{
        position: "absolute",
        bottom: 24,
        fontFamily: "'Space Mono', monospace",
        fontSize: 10,
        color: "rgba(106,217,114,0.4)",
        letterSpacing: "0.2em",
        textTransform: "uppercase",
      }}>
        SYS::READY // NYSE_FEED // CRYPTO_FEED
      </div>

    </div>
  )
}