"use client";

import { useState } from "react";

const filters = ["Tất cả", "📺 Video", "📄 Slide & PDF", "📝 Bài tập", "🔗 Bộ đề thi"];

const forYou = [
  { icon: "📺", badge: <span className="es-badge es-badge-blue">Video</span>, name: "Đồ thị – DFS & BFS (Abdul Bari)", desc: "Giải thích trực quan DFS, BFS với animation. Phù hợp ch.6 CTDL đang học.", meta: "YouTube · 45 phút", tag: <span className="es-badge es-badge-green">Phù hợp nhất</span> },
  { icon: "📄", badge: <span className="es-badge es-badge-gray">Slide UIT</span>, name: "Slide CTDL&GT – Chương 6 (UIT 2024)", desc: "Slide chính thức của khoa, có bài tập mẫu và đề thi các năm trước.", meta: "courses.uit.edu.vn · PDF", tag: <span className="es-badge es-badge-purple">Chính thức</span> },
  { icon: "📝", badge: <span className="es-badge es-badge-amber">Bài tập</span>, name: "50 bài tập Đồ thị có lời giải", desc: "Tổng hợp bài tập từ đề thi cũ UIT, sắp xếp theo độ khó tăng dần.", meta: "GitHub · 2023", tag: <span className="es-badge es-badge-amber">Ôn thi</span> },
  { icon: "🔗", badge: <span className="es-badge es-badge-red">Đề thi cũ</span>, name: "Bộ đề thi CTDL&GT 2019–2023", desc: "12 đề thi chính thức kèm đáp án. Thi ngày 03/06, nên ôn ngay tuần này.", meta: "UIT Drive · 12 đề", tag: <span className="es-badge es-badge-red">Ưu tiên</span> },
];

const weakAreas = [
  { icon: "📺", badge: <span className="es-badge es-badge-blue">Video</span>, name: "3Blue1Brown – Essence of Linear Algebra", desc: "Series 16 video giải thích trực quan về không gian vector, ma trận. Cực kỳ dễ hiểu.", meta: "YouTube · 4–20 phút/video", tag: <span className="es-badge es-badge-green">Được yêu thích</span> },
  { icon: "📄", badge: <span className="es-badge es-badge-gray">Slide UIT</span>, name: "Tóm tắt Đại số tuyến tính – UIT", desc: "Tóm tắt lý thuyết 8 chương, kèm công thức quan trọng và ví dụ minh họa.", meta: "courses.uit.edu.vn · 45 trang", tag: <span className="es-badge es-badge-purple">Chính thức</span> },
];

function ResourceCard({ icon, badge, name, desc, meta, tag }: { icon: string; badge: React.ReactNode; name: string; desc: string; meta: string; tag: React.ReactNode }) {
  return (
    <div className="es-resource-card">
      <div className="es-resource-type-row">
        <span className="es-resource-icon">{icon}</span>
        {badge}
      </div>
      <div className="es-resource-name">{name}</div>
      <div className="es-resource-desc">{desc}</div>
      <div className="es-resource-footer">
        <span className="es-resource-meta">{meta}</span>
        {tag}
      </div>
    </div>
  );
}

export default function ResourcesPanel() {
  const [activeFilter, setActiveFilter] = useState("Tất cả");

  return (
    <>
      <div className="es-topbar">
        <div className="es-topbar-left">
          <div className="es-topbar-title">Tài nguyên học tập</div>
          <div className="es-topbar-sub">Gợi ý theo môn học & chương đang học · Nguồn: UIT + Internet</div>
        </div>
        <div className="es-topbar-right">
          <input
            placeholder="Tìm kiếm tài nguyên..."
            style={{ padding: "6px 12px", borderRadius: "var(--r-sm)", border: "1px solid var(--es-border)", fontFamily: "inherit", fontSize: 13, width: 220, outline: "none" }}
            onFocus={(e) => (e.target.style.borderColor = "var(--blue)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--es-border)")}
          />
        </div>
      </div>

      <div className="es-content">
        <div className="es-alert-strip info" style={{ marginBottom: 16 }}>
          <span>🤖</span>
          <span className="es-alert-text">Gợi ý dựa trên: Bạn đang học <strong>CTDL – Chương 6 (Đồ thị)</strong> và cần cải thiện <strong>Đại số tuyến tính</strong></span>
        </div>

        <div className="es-resource-filters">
          {filters.map((f) => (
            <button key={f} className={`es-filter-btn${activeFilter === f ? " active" : ""}`} onClick={() => setActiveFilter(f)}>{f}</button>
          ))}
        </div>

        <div className="es-section-hdr" style={{ marginBottom: 10 }}>
          <div className="es-section-title">⭐ Gợi ý cho bạn</div>
          <span className="es-badge es-badge-blue">Dựa trên tiến độ học</span>
        </div>
        <div className="es-resource-grid" style={{ marginBottom: 20 }}>
          {forYou.map((r) => <ResourceCard key={r.name} {...r} />)}
        </div>

        <div className="es-section-hdr" style={{ marginBottom: 10 }}>
          <div className="es-section-title">⚠️ Hỗ trợ môn cần cải thiện</div>
          <span className="es-badge es-badge-amber">Đại số tuyến tính</span>
        </div>
        <div className="es-resource-grid">
          {weakAreas.map((r) => <ResourceCard key={r.name} {...r} />)}
        </div>
      </div>
    </>
  );
}
