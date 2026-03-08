import { Link, useLocation } from "react-router-dom"

export default function Navbar() {
  const location = useLocation()

  return (
    <nav className="px-10 pt-2 pb-20 text-2xl flex items-center justify-between inset-0 rounded-xl transition-all duration-300">
      {/* ==================== Navigation Links ==================== */}
      <div className="flex items-center space-x-3 flex-1">
        <Link to="/" className="flex items-center gap-2.5 group">
          <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&display=swap" rel="stylesheet" />

          {/* Candlestick icon */}
          <div className="flex items-end gap-[3px] h-6" style={{ transition: "transform 0.3s ease" }}>
            <div className="flex flex-col items-center gap-[2px]">
              <div className="w-[2px] h-[4px] rounded-full" style={{ background: "#6AD972" }} />
              <div className="w-[6px] h-[8px] rounded-[2px]" style={{ background: "#6AD972" }} />
              <div className="w-[2px] h-[3px] rounded-full" style={{ background: "#6AD972" }} />
            </div>
            <div className="flex flex-col items-center gap-[2px]">
              <div className="w-[2px] h-[3px] rounded-full" style={{ background: "rgba(106,217,114,0.4)" }} />
              <div className="w-[6px] h-[14px] rounded-[2px]" style={{ background: "rgba(106,217,114,0.4)" }} />
              <div className="w-[2px] h-[4px] rounded-full" style={{ background: "rgba(106,217,114,0.4)" }} />
            </div>
            <div className="flex flex-col items-center gap-[2px]">
              <div className="w-[2px] h-[5px] rounded-full" style={{ background: "#6AD972" }} />
              <div className="w-[6px] h-[10px] rounded-[2px]" style={{ background: "#6AD972" }} />
              <div className="w-[2px] h-[2px] rounded-full" style={{ background: "#6AD972" }} />
            </div>
          </div>

          {/* Wordmark */}
          <span
            className="font-black uppercase tracking-[0.15em] text-[15px]"
            style={{
              fontFamily: "'Orbitron', sans-serif",
              background: "linear-gradient(90deg, #ffffff 0%, #6AD972 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textShadow: "none",
              filter: "drop-shadow(0 0 8px rgba(106,217,114,0.4))",
              transition: "filter 0.3s ease",
            }}
          >
            PapaQuant
          </span>
        </Link>
      </div>

      <div className="flex-1 flex justify-end">
        <div className="hidden md:flex items-center space-x-8">
          {[
            { path: '/', label: 'Home' },
            { path: '/news', label: 'News' },
            { path: '/finance', label: 'Finance' },
            { path: '/about', label: 'About' },
            { path: '/slider', label: 'Slider' }
          ].map((item) => {
            const isActive = location.pathname === item.path || (item.path === '/' && location.pathname === '/home')
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`${isActive ? 'text-white' : 'text-white/50'
                } hover:text-white font-bold transition-colors duration-200 text-base relative group px-1 py-2`}
              >
                {item.label}

                {/* Effect */}
                <span className={`absolute bottom-0 left-1/2 h-0.5 bg-primary-green transition-all duration-300 transform -translate-x-1/2 ${
                isActive 
                  ? 'w-full' 
                  : 'w-0 group-hover:w-full'
                }`}></span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}