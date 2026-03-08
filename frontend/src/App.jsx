import NavBar from "./components/Navbar.jsx"
import About from "./pages/About.jsx"
import Home from "./pages/Home.jsx"
import Play from "./pages/Play.jsx"
import HeadlineTest from "./pages/HeadlineTest.jsx"
import { Routes, Route } from "react-router-dom"
import './App.css'

export default function App() {
  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 bg-black z-10 overflow-y-auto"></div>
      <div className="absolute inset-0 border-primary-green border-2 text-3xl text-center rounded-xl m-4 z-20 overflow-y-auto">
        <div className="relative max-w-4xl mx-auto">
          <div className="relative">
            <div className="absolute -top-0 -left-4 w-4 h-4 bg-black"></div>
            <div className="absolute -top-0.5 -left-3.5 w-4 h-4 border-primary-green border-t-2 border-t-2 rounded-tr-full"></div>

            <div className="absolute -top-0 -right-4 w-4 h-4 bg-black"></div>
            <div className="absolute -top-0.5 -right-3.5 w-4 h-4 border-primary-green border-t-2 border-l-2 rounded-tl-full"></div>

            <div className="border-primary-green border-2 border-t-0 rounded-b-xl relative z-20">
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
            <Route path="/headlinetest" element={<HeadlineTest />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}