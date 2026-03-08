import { useState, useEffect } from "react";

const images = [
  { id: 1, src: "https://picsum.photos/seed/slide1/800/400", alt: "Slide 1" },
  { id: 2, src: "https://picsum.photos/seed/slide2/800/400", alt: "Slide 2" },
  { id: 3, src: "https://picsum.photos/seed/slide3/800/400", alt: "Slide 3" },
  { id: 4, src: "https://picsum.photos/seed/slide4/800/400", alt: "Slide 4" },
];

export default function ImageSlider() {
  const [current, setCurrent] = useState(0);

  // Auto-advance every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const prev = () => setCurrent((c) => (c - 1 + images.length) % images.length);
  const next = () => setCurrent((c) => (c + 1) % images.length);

  return (
    <div className="relative w-full max-w-2xl mx-auto overflow-hidden rounded-xl shadow-lg">
      {/* Slides */}
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {images.map((img) => (
          <img
            key={img.id}
            src={img.src}
            alt={img.alt}
            className="w-full flex-shrink-0 object-cover h-64"
          />
        ))}
      </div>

      {/* Prev Button */}
      <button
        onClick={prev}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-9 h-9 flex items-center justify-center hover:bg-black/80"
      >
        ‹
      </button>

      {/* Next Button */}
      <button
        onClick={next}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-9 h-9 flex items-center justify-center hover:bg-black/80"
      >
        ›
      </button>

      {/* Dots */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              i === current ? "bg-white" : "bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}