import NavBar from "./components/Navbar.jsx"
import About from "./pages/About.jsx"
import Home from "./pages/Home.jsx"
import Play from "./pages/Play.jsx"
import { Routes, Route } from "react-router-dom"
import './App.css'

export default function App() {
  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 bg-white z-10"></div>
      <div className="absolute inset-0 bg-black text-3xl text-center rounded-xl m-5 z-20">
        <div className="bg-white max-w-4xl mx-auto rounded-b-xl">
          <NavBar />
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