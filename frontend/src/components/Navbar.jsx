import { Link } from "react-router-dom"

export default function Navbar() {
    return (
        <nav className="bg-[#010102] px-20 py-8 flex items-center justify-between transition-all duration-300">
            
            <div className="flex items-center space-x-3 flex-1">
                <Link
                    to="/"
                    className="text-xl font-bold hover:opacity-80 transition-opacity"
                >
                    <span className="bg-gradient-to-b from-primary-green to-primary-white bg-clip-text text-transparent">Papa</span>
                    <span className="text-primary-red">.Quant</span>
                </Link>
            </div>

            {/* ==================== Navigation Links ==================== */}
            <div className="flex flex-1 justify-end">

            </div>

            
            <Link to="/" className="hover:text-gray-900">Home</Link>
            
            <Link to="/about" className="hover:text-gray-900">About</Link>
        </nav>
    )
}