import NavBar from "./components/Navbar.jsx"
import About from "./pages/About.jsx"
import Home from "./pages/Home.jsx"
import Play from "./pages/Play.jsx"
import { Routes, Route } from "react-router-dom"
import './App.css'

export default function App() {
  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 bg-white z-10 overflow-y-auto"></div>
      <div className="absolute inset-0 bg-black text-3xl text-center rounded-xl m-4 z-20 overflow-y-auto">
        <div className="relative max-w-4xl mx-auto">
          <div className="relative">
            <div className="absolute -top-0 -left-4 w-4 h-4 bg-white"></div>
            <div className="absolute -top-0 -left-4 w-4 h-4 bg-black rounded-tr-full"></div>

            <div className="absolute -top-0 -right-4 w-4 h-4 bg-white"></div>
            <div className="absolute -top-0 -right-4 w-4 h-4 bg-black rounded-tl-full"></div>
            
            <div className="bg-white rounded-b-xl relative z-20">
              <NavBar />
            </div>
          </div>
        </div>
        
        {/* Routes - on black background */}
        <div className="text-white">
          <Routes>
            <Route path="/" element={ <Home /> } />
            <Route path="/about" element={ <About /> } />
            <Route path="/play" element={ <Play /> } />
          </Routes>
        </div>
      </div>
    </div>
  )
}