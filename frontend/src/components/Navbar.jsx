import { Link, useLocation } from "react-router-dom"

export default function Navbar() {
  const location = useLocation()

  return (
    <nav className="px-20 py-8 flex items-center justify-between transition-all duration-300">
      {/* ==================== Navigation Links ==================== */}
      <div className="hidden md:flex justify-start space-x-10">
        <div className="flex items-center space-x-3 flex-1 justify-start">
          <Link
            to="/"
            className="text-2xl font-bold hover:opacity-80 transition-opacity"
          >
            <span className="bg-gradient-to-b from-primary-white to-primary-white bg-clip-text text-transparent">Papa</span>
            <span className="bg-gradient-to-b from-primary-white to-primary-white bg-clip-text text-transparent">Quant</span>
          </Link>
        </div>

        {[
          { path: '/', label: 'Home' },
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
              <span className={`absolute bottom-0 left-1/2 h-0.5 bg-white transition-all duration-300 transform -translate-x-1/2 ${
              isActive 
                ? 'w-full' 
                : 'w-0 group-hover:w-full'
              }`}></span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}