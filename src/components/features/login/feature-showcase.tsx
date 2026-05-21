"use client";

import { useState, useEffect } from "react";
import { TrendingUp, BookOpen, CalendarDays, Library } from "lucide-react";

/** Feature cards shown in the right showcase panel */
const FEATURES = [
  {
    Icon: TrendingUp,
    title: "Dự báo GPA",
    desc: "Tính điểm cần đạt để chạm mục tiêu — biết trước khi thi.",
    color: "#60A5FA",
    bg: "rgba(37,99,235,0.18)",
    glow: "rgba(37,99,235,0.12)",
  },
  {
    Icon: BookOpen,
    title: "Tracker tiến độ",
    desc: "Theo dõi từng chương, duy trì streak học tập hàng ngày.",
    color: "#34D399",
    bg: "rgba(5,150,105,0.18)",
    glow: "rgba(5,150,105,0.12)",
  },
  {
    Icon: CalendarDays,
    title: "Kế hoạch ôn thi",
    desc: "Lịch ôn thi thông minh, tính ngược từ ngày thi thực tế.",
    color: "#FBBF24",
    bg: "rgba(217,119,6,0.18)",
    glow: "rgba(217,119,6,0.12)",
  },
  {
    Icon: Library,
    title: "Tài nguyên học tập",
    desc: "Tài liệu & đề cũ từ cộng đồng UIT — đúng môn, đúng lúc.",
    color: "#C084FC",
    bg: "rgba(124,58,237,0.18)",
    glow: "rgba(124,58,237,0.12)",
  },
];

export default function FeatureShowcase() {
  const [activeIdx, setActiveIdx] = useState(0);

  // Auto-cycle active card every 3.5s
  useEffect(() => {
    const t = setInterval(() => setActiveIdx((i) => (i + 1) % FEATURES.length), 3500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="es-showcase">
      <div className="es-showcase-inner">
        {/* Tagline */}
        <h2 className="es-showcase-h">
          Học thông minh hơn,<br />
          <em>không chỉ chăm hơn.</em>
        </h2>
        <p className="es-showcase-p">
          Công cụ cá nhân hóa lộ trình học tập dành riêng cho sinh viên UIT.
        </p>

        {/* Feature grid — active card cycles automatically */}
        <div className="es-feat-grid">
          {FEATURES.map(({ Icon, title, desc, color, bg, glow }, i) => (
            <button
              key={i}
              className={`es-feat-card${activeIdx === i ? " active" : ""}`}
              style={{ "--fc-glow": glow } as React.CSSProperties}
              onClick={() => setActiveIdx(i)}
              aria-pressed={activeIdx === i}
            >
              <div className="es-feat-ico" style={{ background: bg }}>
                <Icon size={17} color={color} strokeWidth={2} />
              </div>
              <div className="es-feat-name">{title}</div>
              <div className="es-feat-desc">{desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
