import { useState } from "react";
import { useNavigate } from "react-router-dom";

const C = {
  green: "var(--color-c-green)",
  cardBg: "var(--color-c-card-bg)",
  innerBg: "var(--color-c-inner-bg)",
  textMuted: "var(--color-c-text-muted)",
  border: "var(--color-c-border)",
  borderHover: "var(--color-c-border-hover)",
};

const STORY = [
  { 
    title: "The Observation", 
    tag: "Origin", 
    desc: "We noticed a pattern: CEOs say something stupid, stock drops, media frenzy, the market overreacts — every single time.",
    image: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80"
  },
  { 
    title: "The Insight", 
    tag: "Signal", 
    desc: "Controversies aren't just headlines. They create temporary inefficiencies that most investors miss because they're reacting emotionally, not systematically.",
    image: "https://i0.wp.com/freegiftfromgod.com/wp-content/uploads/2023/07/The-trouble-with-controversies.png?ssl=1"
  },
  { 
    title: "The Inspiration", 
    tag: "Papa John", 
    desc: "One afternoon, one hot mic, decades of brand equity gone. Papa John's CEO proved that a single moment of poor judgment could move markets.",
    image: "https://a57.foxnews.com/static.foxbusiness.com/foxbusiness.com/content/uploads/2020/09/1440/810/GettyImages-john-schnatter-.jpg?ve=1&tl=1"
  },
  { 
    title: "The Problem", 
    tag: "Obstacle", 
    desc: "Every major business publication blocked our scrapers. Building a reliable controversy dataset felt impossible — until we found a workaround.",
    image: "https://decodo.com/cdn-cgi/image/width=1280,quality=70,format=auto/https://images.decodo.com/How_to_Scrape_Google_Without_Getting_Blocked_37f12fb1ff/How_to_Scrape_Google_Without_Getting_Blocked_37f12fb1ff.png"
  },
  { 
    title: "The Breakthrough", 
    tag: "Solution", 
    desc: "Routing through the Wayback Machine let us reconstruct article timelines, bypass blocks, and build a real historical dataset for training.",
    image: "https://static0.makeuseofimages.com/wordpress/wp-content/uploads/wm/2024/05/internet-archive-wayback-machine-website-photo.jpg?q=70&fit=crop&w=1600&h=1100&dpr=1"
  },
  { 
    title: "The Result", 
    tag: "Outcome", 
    desc: "PapaQuant transforms messy, emotional news headlines into structured, model-backed trading signals — buy the dip or short before the market catches up.",
    image: "https://i0.wp.com/scheplick.com/wp-content/uploads/2021/03/buy-the-dip-picture-btfd-1.jpeg?resize=2146%2C1370&ssl=1"
  },
];

const PIPELINE = [
  { step: "01", label: "Scrape", desc: "Monitor Forbes, Bloomberg, WSJ, and archived sources via Wayback Machine for CEO controversies and reputational events." },
  { step: "02", label: "Summarize", desc: "GPT pipeline condenses raw, lengthy articles into clean, structured controversy summaries ready for classification." },
  { step: "03", label: "Sentiment", desc: "A dedicated sarcasm and satire filter removes noise, jokes, and opinion pieces — only genuine controversies pass through." },
  { step: "04", label: "Classify", desc: "XGBoost model trained on historical controversy data predicts whether the signal is a long-term buy opportunity or a short." },
];

const STACK = [
  { layer: "Frontend", color: "rgba(74,222,128,0.08)", border: "rgba(74,222,128,0.2)", tools: ["React", "Tailwind CSS", "React-Router"] },
  { layer: "Backend", color: "rgba(74,222,128,0.08)", border: "rgba(74,222,128,0.2)", tools: ["FastAPI", "Python", "Uvicorn"] },
  { layer: "ML", color: "rgba(74,222,128,0.08)", border: "rgba(74,222,128,0.2)", tools: ["XGBoost", "", "OpenAI GPT"] },
  { layer: "Data", color: "rgba(74,222,128,0.08)", border: "rgba(74,222,128,0.2)", tools: ["IDK", "IDK", "IDK"] },
];

const TEAM = [
  { name: "Khang", role: "Something", init: "K", desc: "Something" },
  { name: "Pavan", role: "Something", init: "P", desc: "Something" },
  { name: "Adya", role: "Something", init: "A", desc: "Something" },
  { name: "Taylor", role: "Something", init: "T", desc: "Something" },
];

const TABS = [
  { id: "story", label: "Story" },
  { id: "pipeline", label: "Pipeline" },
  { id: "stack", label: "Stack" },
  { id: "team", label: "Team" },
];

// Story Slider Component
function StorySlider({ stories, currentIndex, onNext, onPrev }) {
  const currentStory = stories[currentIndex];
  
  return (
    <div className="col-span-4 grid grid-cols-2 gap-6 h-full">
      <div 
        className="rounded-xl overflow-hidden relative"
        style={{
          background: C.cardBg,
          border: `1px solid ${C.border}`,
          boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
        }}
      >
        <img 
          src={currentStory.image} 
          alt={currentStory.title}
          className="w-full h-full object-cover"
        />
        
        <button
          onClick={onPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
          style={{
            background: "rgba(0,0,0,0.6)",
            border: `1px solid ${C.borderHover}`,
            color: "#fff",
            backdropFilter: "blur(4px)",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(74,222,128,0.2)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(0,0,0,0.6)"}
        >
          ←
        </button>
        <button
          onClick={onNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
          style={{
            background: "rgba(0,0,0,0.6)",
            border: `1px solid ${C.borderHover}`,
            color: "#fff",
            backdropFilter: "blur(4px)",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(74,222,128,0.2)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(0,0,0,0.6)"}
        >
          →
        </button>
        
        <div 
          className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[11px]"
          style={{
            background: "rgba(0,0,0,0.6)",
            border: `1px solid ${C.borderHover}`,
            color: "#fff",
            backdropFilter: "blur(4px)",
          }}
        >
          {currentIndex + 1} / {stories.length}
        </div>
      </div>

      <div 
        className="rounded-xl p-8 flex flex-col justify-center relative"
        style={{
          background: C.cardBg,
          border: `1px solid ${C.borderHover}`,
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        {/* Tag */}
        <div
          className="text-[11px] px-3 py-1.5 rounded-md w-fit mb-6"
          style={{ 
            background: "rgba(74,222,128,0.1)", 
            color: C.green, 
            border: "1px solid rgba(74,222,128,0.3)" 
          }}
        >
          {currentStory.tag}
        </div>

        {/* Title */}
        <h2 className="text-[32px] font-bold text-white mb-4 leading-tight">
          {currentStory.title}
        </h2>

        {/* Description */}
        <p 
          className="text-[15px] leading-relaxed mb-16"
          style={{ color: "rgba(255,255,255,0.7)" }}
        >
          {currentStory.desc}
        </p>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-[11px]">
            <span style={{ color: C.textMuted }}>Story Progress</span>
            <span style={{ color: C.green }}>{currentIndex + 1}/{stories.length}</span>
          </div>
          <div 
            className="w-full h-1 rounded-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.1)" }}
          >
            <div 
              className="h-full rounded-full transition-all duration-300"
              style={{ 
                width: `${((currentIndex + 1) / stories.length) * 100}%`,
                background: C.green 
              }}
            />
          </div>
        </div>

        {/* Bottom navigation dots */}
        <div className="flex gap-2 mt-6">
          {stories.map((_, i) => (
            <button
              key={i}
              onClick={() => onNext(i)} // You'll need to modify this to handle direct index selection
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === currentIndex ? "24px" : "8px",
                background: i === currentIndex ? C.green : "rgba(255,255,255,0.2)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function About() {
  const [activeTab, setActiveTab] = useState("story");
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [hoveredMember, setHoveredMember] = useState(null);
  const [hoveredStack, setHoveredStack] = useState(null);
  const [expandedPipe, setExpandedPipe] = useState(null);
  const navigate = useNavigate();

  const handleNextStory = () => {
    setCurrentStoryIndex((prev) => (prev + 1) % STORY.length);
  };

  const handlePrevStory = () => {
    setCurrentStoryIndex((prev) => (prev - 1 + STORY.length) % STORY.length);
  };

  const cardHover = (e) => {
    e.currentTarget.style.transform = "translateY(-6px)";
    e.currentTarget.style.borderColor = C.borderHover;
    e.currentTarget.style.boxShadow = "0 16px 40px rgba(0,0,0,0.5)";
  };
  const cardLeave = (e) => {
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.borderColor = C.border;
    e.currentTarget.style.boxShadow = "none";
  };

  return (
    <div
      className="fixed inset-0 flex flex-col px-8 pt-20 pb-6 gap-4 m-15"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div className="flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className="text-[26px] font-bold text-white tracking-tight">About</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] mt-2" style={{ color: C.textMuted }}>PapaQuant</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/news")}
            className="px-4 py-2 text-[12px] font-semibold rounded-lg ml-1"
            style={{ background: C.green, color: "#000" }}
            onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
          >
            Try Analyzer
          </button>
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: `1px solid ${C.border}` }} />

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className="px-4 py-2 text-[14px] rounded-lg transition-all duration-200"
            style={{
              background: activeTab === id ? "rgba(255,255,255,0.08)" : "transparent",
              color: activeTab === id ? "#fff" : C.textMuted,
              border: `1px solid ${activeTab === id ? C.borderHover : "transparent"}`,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 grid grid-cols-4 gap-4">

        {/* STORY - Slider View */}
        {activeTab === "story" && (
          <StorySlider 
            stories={STORY}
            currentIndex={currentStoryIndex}
            onNext={handleNextStory}
            onPrev={handlePrevStory}
          />
        )}

        {/* PIPELINE */}
        {activeTab === "pipeline" && PIPELINE.map((item, i) => {
          const isExpanded = expandedPipe === i;
          return (
            <div
              key={item.step}
              className="rounded-xl p-6 flex flex-col gap-4 transition-all duration-300 cursor-pointer"
              style={{
                background: C.cardBg,
                border: `1px solid ${isExpanded ? C.green : C.border}`,
                transform: isExpanded ? "translateY(-4px)" : "translateY(0)",
                boxShadow: isExpanded ? "0 20px 60px rgba(0,0,0,0.5)" : "none",
              }}
              onClick={() => setExpandedPipe(isExpanded ? null : i)}
              onMouseEnter={e => { if (!isExpanded) cardHover(e); }}
              onMouseLeave={e => { if (!isExpanded) cardLeave(e); }}
            >
              <div className="flex items-center justify-between">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold"
                  style={{
                    background: "rgba(74,222,128,0.15)",
                    border: "1px solid rgba(74,222,128,0.4)",
                    color: C.green,
                  }}
                >
                  {item.step}
                </div>
                <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>
                  {isExpanded ? "—" : "+"}
                </span>
              </div>
              <p className="text-[16px] font-semibold text-white">{item.label}</p>
              <p
                className="text-[12px]"
                style={{
                  color: C.textMuted,
                  maxHeight: isExpanded ? "200px" : "40px",
                  overflow: "hidden",
                  transition: "max-height 0.3s ease",
                }}
              >
                {item.desc}
              </p>
              {i < PIPELINE.length - 1 && (
                <div
                  className="mt-auto pt-3 text-[10px] uppercase tracking-[0.15em]"
                  style={{ color: "rgba(255,255,255,0.15)", borderTop: `1px solid ${C.border}` }}
                >
                  Next: {PIPELINE[i + 1].label}
                </div>
              )}
            </div>
          );
        })}

        {/* STACK */}
        {activeTab === "stack" && STACK.map((item, i) => (
          <div
            key={item.layer}
            className="rounded-xl p-6 flex flex-col gap-4 transition-all duration-300"
            style={{
              background: C.cardBg,
              border: `1px solid ${hoveredStack === i ? item.border : C.border}`,
              transform: hoveredStack === i ? "translateY(-6px)" : "translateY(0)",
              boxShadow: hoveredStack === i ? "0 16px 40px rgba(0,0,0,0.5)" : "none",
            }}
            onMouseEnter={() => setHoveredStack(i)}
            onMouseLeave={() => setHoveredStack(null)}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-[11px] font-bold uppercase tracking-wider"
              style={{
                background: hoveredStack === i ? item.color : "rgba(255,255,255,0.04)",
                border: `1px solid ${hoveredStack === i ? item.border : C.border}`,
                color: hoveredStack === i ? "#fff" : C.textMuted,
              }}
            >
              {item.layer.slice(0, 2)}
            </div>
            <p className="text-[18px] font-bold text-white">{item.layer}</p>
            <div className="flex flex-wrap gap-2">
              {item.tools.map(t => (
                <span
                  key={t}
                  className="text-[11px] px-3 py-1 rounded-md"
                  style={{
                    background: hoveredStack === i ? item.color : C.innerBg,
                    border: `1px solid ${hoveredStack === i ? item.border : C.border}`,
                    color: hoveredStack === i ? "#fff" : "rgba(255,255,255,0.6)",
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}

        {/* TEAM */}
        {activeTab === "team" && TEAM.map((member, i) => (
          <div
            key={member.name}
            className="rounded-xl p-6 flex flex-col gap-4 transition-all duration-300"
            style={{
              background: C.cardBg,
              border: `1px solid ${hoveredMember === i ? C.borderHover : C.border}`,
              transform: hoveredMember === i ? "translateY(-6px)" : "translateY(0)",
              boxShadow: hoveredMember === i ? "0 16px 40px rgba(0,0,0,0.5)" : "none",
            }}
            onMouseEnter={() => setHoveredMember(i)}
            onMouseLeave={() => setHoveredMember(null)}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-[18px] font-bold"
              style={{
                background: hoveredMember === i ? "rgba(74,222,128,0.15)" : "rgba(74,222,128,0.07)",
                border: `1px solid ${hoveredMember === i ? "rgba(74,222,128,0.4)" : "rgba(74,222,128,0.15)"}`,
                color: C.green,
              }}
            >
              {member.init}
            </div>
            <div>
              <p className="text-[16px] font-bold text-white">{member.name}</p>
              <p
                className="text-[12px] mt-1"
                style={{ color: hoveredMember === i ? C.green : C.textMuted }}
              >
                {member.role}
              </p>
            </div>
            <div style={{ borderTop: `1px solid ${C.border}` }} />
            <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.5)" }}>
              {member.desc}
            </p>
            {hoveredMember === i && (
              <div
                className="mt-auto pt-3 text-[9px] uppercase tracking-[0.2em]"
                style={{ color: C.green, borderTop: `1px solid rgba(74,222,128,0.15)` }}
              >
                {member.role}
              </div>
            )}
          </div>
        ))}

      </div>
    </div>
  );
}