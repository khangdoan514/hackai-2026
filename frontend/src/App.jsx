import NavBar from "./components/Navbar.jsx"
import About from "./pages/About.jsx"
import News from "./pages/News.jsx"
import Finance from "./pages/Finance.jsx"
import Home from "./pages/Home.jsx"
import { Routes, Route, useLocation } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import './App.css'

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.35, ease: "easeInOut" } },
  exit: { opacity: 0, transition: { duration: 0.25, ease: "easeInOut" } },
}

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/news" element={<News />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <div className="min-h-screen relative">
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: 'url("/src/assets/img/background.png")',
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      />
      <div className="absolute inset-0 text-3xl text-center rounded-xl m-4 z-20 overflow-y-auto">
        <div className="relative max-w-4xl mx-auto">
          <div className="relative">
            <div className="relative z-20">
              <NavBar />
            </div>
          </div>
        </div>
        <div className="text-white">
          <AnimatedRoutes />
        </div>
      </div>
    </div>
  )
}