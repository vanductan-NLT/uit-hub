"use client";

import { useState, useEffect } from "react";

/**
 * Feature data — thêm feature mới chỉ cần append vào đây.
 * emoji, badge, title, punchline, desc, color, shadowColor, bg, activeBorder, statVal, statLabel, floatEmoji
 */
const FEATURES = [
  {
    emoji: "📈",
    badge: "GPA",
    title: "Dự báo GPA",
    punchline: "Biết điểm cần đạt trước khi thi",
    desc: "Nhập điểm thành phần → dự báo GPA cuối kỳ chính xác, không đoán mò.",
    color: "#60A5FA",
    shadowColor: "rgba(37,99,235,0.55)",
    bg: "rgba(37,99,235,0.18)",
    activeBorder: "#3B82F6",
    statVal: "+0.35",
    statLabel: "GPA trung bình tăng",
    floatEmoji: "🎯",
  },
  {
    emoji: "🔥",
    badge: "STREAK",
    title: "Tracker tiến độ",
    punchline: "Streak học tập mỗi ngày",
    desc: "Theo dõi từng chương theo syllabus UIT — giữ lửa học không tắt.",
    color: "#34D399",
    shadowColor: "rgba(5,150,105,0.55)",
    bg: "rgba(5,150,105,0.18)",
    activeBorder: "#10B981",
    statVal: "12 ngày",
    statLabel: "Streak kỷ lục trung bình",
    floatEmoji: "⚡",
  },
  {
    emoji: "📅",
    badge: "EXAM",
    title: "Kế hoạch ôn thi",
    punchline: "Lịch ngược từ ngày thi",
    desc: "Tự tạo lịch ôn thông minh từ ngày thi thực tế — ưu tiên môn yếu nhất.",
    color: "#FBBF24",
    shadowColor: "rgba(217,119,6,0.55)",
    bg: "rgba(217,119,6,0.18)",
    activeBorder: "#F59E0B",
    statVal: "7 ngày",
    statLabel: "Sẵn sàng sớm hơn",
    floatEmoji: "🗓️",
  },
  {
    emoji: "📚",
    badge: "LEARN",
    title: "Tài nguyên UIT",
    punchline: "Đúng môn, đúng lúc",
    desc: "Slide, đề thi cũ, video từ cộng đồng sinh viên UIT — tìm là có ngay.",
    color: "#C084FC",
    shadowColor: "rgba(124,58,237,0.55)",
    bg: "rgba(124,58,237,0.18)",
    activeBorder: "#A855F7",
    statVal: "500+",
    statLabel: "Tài nguyên sẵn có",
    floatEmoji: "🌟",
  },
  // ← Thêm feature mới tại đây
];

/** Achievement badges nổi lên theo từng cột */
const FLOAT_BADGES = [
  { text: "🔥 8 ngày streak",   delay: "0s",   left: "6%",  duration: "10s" },
  { text: "⭐ GPA 3.8 → 3.9",  delay: "2.8s", left: "52%", duration: "12s" },
  { text: "🏆 +0.4 GPA",        delay: "5.2s", left: "74%", duration: "9s"  },
  { text: "📈 Xuất sắc!",        delay: "7.5s", left: "26%", duration: "11s" },
  { text: "✅ Ôn xong hôm nay",  delay: "3.8s", left: "84%", duration: "13s" },
];

export default function FeatureShowcase() {
  const [activeIdx, setActiveIdx]   = useState(0);
  const [userCount, setUserCount]   = useState(1_248);
  const [isHovered, setIsHovered]   = useState(false);
  const [descKey, setDescKey]       = useState(0); // force re-mount for animation

  // Auto-cycle khi không hover
  useEffect(() => {
    if (isHovered) return;
    const t = setInterval(() => {
      setActiveIdx((i) => (i + 1) % FEATURES.length);
      setDescKey((k) => k + 1);
    }, 3800);
    return () => clearInterval(t);
  }, [isHovered]);

  // Live user count animation
  useEffect(() => {
    const t = setInterval(() => {
      if (Math.random() > 0.65) setUserCount((c) => c + Math.floor(Math.random() * 3 + 1));
    }, 5200);
    return () => clearInterval(t);
  }, []);

  const active = FEATURES[activeIdx];

  function handleSelect(i: number) {
    setActiveIdx(i);
    setDescKey((k) => k + 1);
  }

  return (
    <div className="es-showcase">
      {/* Floating ambient gradient orbs */}
      <div className="es-showcase-orbs" aria-hidden="true">
        <div className="es-orb es-orb-1" />
        <div className="es-orb es-orb-2" />
        <div className="es-orb es-orb-3" />
      </div>

      {/* Floating achievement badges */}
      <div className="es-float-badges" aria-hidden="true">
        {FLOAT_BADGES.map((b, i) => (
          <div
            key={i}
            className="es-float-badge"
            style={{ left: b.left, animationDelay: b.delay, animationDuration: b.duration }}
          >
            {b.text}
          </div>
        ))}
      </div>

      <div className="es-showcase-inner">
        {/* Mascot + Social proof */}
        <div className="es-showcase-top">
          <div className="es-mascot" aria-hidden="true">🎓</div>
          <div className="es-social-proof">
            <div className="es-social-avatars" aria-hidden="true">
              {["🧑‍💻", "👩‍🎓", "👨‍💻", "👩‍💻", "🧑‍🎓"].map((a, i) => (
                <div key={i} className="es-avatar-chip" style={{ marginLeft: i === 0 ? 0 : -9, zIndex: 5 - i }}>
                  {a}
                </div>
              ))}
            </div>
            <div className="es-social-text">
              <span className="es-social-count">{userCount.toLocaleString()}</span>
              {" sinh viên UIT đang dùng"}
            </div>
          </div>
        </div>

        {/* Tagline */}
        <h2 className="es-showcase-h">
          Học thông minh hơn,<br />
          <em>không chỉ chăm hơn.</em>
        </h2>

        {/* Feature cards grid */}
        <div
          className="es-feat-grid"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {FEATURES.map((f, i) => {
            const isActive = activeIdx === i;
            return (
              <button
                key={i}
                className={`es-feat-card${isActive ? " active" : ""}`}
                style={{
                  "--fc-color":  f.color,
                  "--fc-bg":     f.bg,
                  "--fc-shadow": f.shadowColor,
                  "--fc-border": f.activeBorder,
                  animationDelay: `${0.28 + i * 0.08}s`,
                } as React.CSSProperties}
                onClick={() => handleSelect(i)}
                aria-pressed={isActive}
                aria-label={f.title}
              >
                {/* Badge pill — top label */}
                <div className="es-feat-badge-row">
                  <span className="es-feat-badge-pill">{f.badge}</span>
                </div>

                {/* Big emoji icon */}
                <div className="es-feat-emoji" aria-hidden="true">{f.emoji}</div>

                <div className="es-feat-name">{f.title}</div>
                <div className="es-feat-punchline">{f.punchline}</div>

                {/* Stat row — animate in on active */}
                {isActive && (
                  <div className="es-feat-stat animate-spring-in">
                    <span className="es-feat-stat-val">{f.statVal}</span>
                    <span className="es-feat-stat-label">{f.statLabel}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Active feature description */}
        <div key={descKey} className="es-feat-desc-bar animate-card-enter">
          <span className="es-feat-desc-icon" aria-hidden="true">{active.floatEmoji}</span>
          <span className="es-feat-desc-text">{active.desc}</span>
        </div>

        {/* Progress dot indicators */}
        <div className="es-feat-dots" role="tablist" aria-label="Tính năng">
          {FEATURES.map((f, i) => (
            <button
              key={i}
              className={`es-feat-dot${activeIdx === i ? " active" : ""}`}
              style={{ "--fc-color": f.color } as React.CSSProperties}
              onClick={() => handleSelect(i)}
              role="tab"
              aria-selected={activeIdx === i}
              aria-label={f.title}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
