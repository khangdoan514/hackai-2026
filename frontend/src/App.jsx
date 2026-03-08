import NavBar from "./components/Navbar.jsx"
import About from "./pages/About.jsx"
import News from "./pages/News.jsx"
import Finance from "./pages/Finance.jsx"
import Home from "./pages/Home.jsx"
import { Routes, Route } from "react-router-dom"
import './App.css'

export default function App() {
  return (
    <div className="min-h-screen relative">
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: 'url("/src/assets/img/background.png")',
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
      </div>

      <div className="absolute inset-0 text-3xl text-center rounded-xl m-4 z-20 overflow-y-auto">
        <div className="relative max-w-4xl mx-auto">
          <div className="relative">
            <div className="relative z-20">
              <NavBar />
            </div>
          </div>
        </div>

        {/* Routes - on black background */}
        <div className="text-white">
          <Routes>
            <Route path="/" element={ <Home /> } />
            <Route path="/news" element={ <News /> } />
            <Route path="/finance" element={ <Finance /> } />
            <Route path="/about" element={ <About /> } />
          </Routes>
        </div>
      </div>
    </div>
  )
}