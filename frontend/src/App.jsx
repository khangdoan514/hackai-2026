import About from "./pages/About.jsx"
import NavBar from "./components/Navbar.jsx"
import Home from "./pages/Home.jsx"
import { Routes, Route } from "react-router-dom"
import './App.css'

export default function App() {
  return (
    <div className="bg-light-pink text-3xl text-center">
      <NavBar />
      <Routes>
        <Route path="/" element={ <Home /> } />
        <Route path="/about" element={ <About /> } />
      </Routes>
    </div>
  )
}