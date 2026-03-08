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
  { title: "The Observation", tag: "Origin", desc: "We noticed a pattern: CEOs say something stupid, stock drops, media frenzy, the market overreacts — every single time." },
  { title: "The Insight", tag: "Signal", desc: "Controversies aren't just headlines. They create temporary inefficiencies that most investors miss because they're reacting emotionally, not systematically." },
  { title: "The Inspiration", tag: "Papa John", desc: "One afternoon, one hot mic, decades of brand equity gone. Papa John's CEO proved that a single moment of poor judgment could move markets." },
  { title: "The Problem", tag: "Obstacle", desc: "Every major business publication blocked our scrapers. Building a reliable controversy dataset felt impossible — until we found a workaround." },
  { title: "The Breakthrough", tag: "Solution", desc: "Routing through the Wayback Machine let us reconstruct article timelines, bypass blocks, and build a real historical dataset for training." },
  { title: "The Result", tag: "Outcome", desc: "PapaQuant transforms messy, emotional news headlines into structured, model-backed trading signals — buy the dip or short before the market catches up." },
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

const STATS = [
  { value: "1,284", label: "Controversies" },
  { value: "87.3%", label: "Accuracy" },
  { value: "4", label: "Engineers" },
  { value: "24h", label: "Build Time" },
];

export default function About() {
  const [activeTab, setActiveTab] = useState("story");
  const [expandedStory, setExpandedStory] = useState(null);
  const [hoveredMember, setHoveredMember] = useState(null);
  const [hoveredStack, setHoveredStack] = useState(null);
  const [expandedPipe, setExpandedPipe] = useState(null);
  const navigate = useNavigate();

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
            onClick={() => navigate("/play")}
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
            className="px-4 py-2 text-[12px] rounded-lg transition-all duration-200"
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

        {/* STORY */}
        {activeTab === "story" && STORY.map((item, i) => {
          const expanded = expandedStory === i;
          return (
            <div
              key={i}
              className="rounded-xl p-6 flex flex-col justify-between transition-all duration-300 cursor-pointer"
              style={{
                background: C.cardBg,
                border: `1px solid ${expanded ? C.green : C.border}`,
                gridColumn: expanded ? "span 2" : "span 1",
                boxShadow: expanded ? "0 20px 60px rgba(0,0,0,0.5)" : "none",
                transform: expanded ? "translateY(-2px)" : "translateY(0)",
              }}
              onClick={() => setExpandedStory(expanded ? null : i)}
              onMouseEnter={e => { if (!expanded) cardHover(e); }}
              onMouseLeave={e => { if (!expanded) cardLeave(e); }}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="text-[10px] px-2 py-1 rounded-md w-fit"
                    style={{ background: "rgba(74,222,128,0.1)", color: C.green, border: "1px solid rgba(74,222,128,0.3)" }}
                  >
                    {item.tag}
                  </div>
                  <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>
                    {expanded ? "Click to collapse" : "Click to expand"}
                  </span>
                </div>
                <p className="text-[18px] font-bold text-white mb-2">{item.title}</p>
                <p
                  className="text-[12px]"
                  style={{
                    color: "rgba(255,255,255,0.65)",
                    maxHeight: expanded ? "200px" : "60px",
                    overflow: "hidden",
                    transition: "max-height 0.3s ease",
                  }}
                >
                  {item.desc}
                </p>
              </div>
              {expanded && (
                <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${C.border}` }}>
                  <p className="text-[10px] uppercase tracking-[0.15em]" style={{ color: C.green }}>
                    {i + 1} of {STORY.length} — {item.tag}
                  </p>
                </div>
              )}
            </div>
          );
        })}

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