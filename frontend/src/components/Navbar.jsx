import { Link, useLocation } from "react-router-dom"

export default function Navbar() {
  const location = useLocation()

  return (
    <nav className="px-15 pt-3 pb-20 text-2xl flex items-center justify-between inset-0 rounded-xl transition-all duration-300">
      {/* ==================== Navigation Links ==================== */}
      <div className="flex items-center space-x-3 flex-1">
        <Link
          to="/"
          className="font-bold hover:opacity-80 transition-opacity"
        >
          <span className="text-white bg-clip-text">PapaQuant</span>
        </Link>
      </div>

      <div className="flex-1 flex justify-end">
        <div className="hidden md:flex items-center space-x-10">
          {[
            { path: '/', label: 'Home' },
            { path: '/news', label: 'News' },
            { path: '/finance', label: 'Finance' },
            { path: '/about', label: 'About' }
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