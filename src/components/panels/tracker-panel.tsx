"use client";

import { useState } from "react";

type Chapter = { text: string; week: string; done: boolean; highlight?: "blue" | "amber" };

const initialCtdl: Chapter[] = [
  { text: "Ch.1 – Giới thiệu CTDL&GT", week: "Tuần 1", done: true },
  { text: "Ch.2 – Độ phức tạp thuật toán", week: "Tuần 2", done: true },
  { text: "Ch.3 – Danh sách liên kết", week: "Tuần 3–4", done: true },
  { text: "Ch.4 – Stack & Queue", week: "Tuần 5", done: true },
  { text: "Ch.5 – Cây nhị phân", week: "Tuần 6–7", done: true },
  { text: "Ch.6 – Đồ thị ← Hôm nay", week: "Tuần 8", done: false, highlight: "blue" },
  { text: "Ch.7 – Sắp xếp & Tìm kiếm", week: "Tuần 9–10", done: false },
  { text: "Ch.8 – Quy hoạch động", week: "Tuần 11", done: false },
];

const initialWeb: Chapter[] = [
  { text: "Ch.1 – HTML5 Fundamentals", week: "Tuần 1", done: true },
  { text: "Ch.2 – CSS3 & Flexbox", week: "Tuần 2", done: true },
  { text: "Ch.3 – JavaScript ES6+", week: "Tuần 3–4", done: true },
  { text: "Ch.4 – DOM Manipulation", week: "Tuần 5", done: true },
  { text: "Ch.5 – Fetch API & AJAX", week: "Tuần 6", done: true },
  { text: "Ch.6 – React Fundamentals", week: "Tuần 7", done: true },
  { text: "Ch.7 – React Hooks ← Trễ 1 tuần", week: "Tuần 8", done: false, highlight: "amber" },
  { text: "Ch.8 – Node.js & Express", week: "Tuần 9", done: false },
];

function ChapterList({ chapters, onToggle }: { chapters: Chapter[]; onToggle: (i: number) => void }) {
  return (
    <div>
      {chapters.map((ch, i) => (
        <div
          key={i}
          className={`es-chapter-row${ch.done ? " done" : ""}`}
          style={!ch.done && ch.highlight === "blue" ? { borderColor: "var(--blue)", background: "var(--blue-lt)" } : !ch.done && ch.highlight === "amber" ? { borderColor: "var(--amber)", background: "var(--amber-lt)" } : {}}
          onClick={() => onToggle(i)}
        >
          <div className="es-chapter-check">{ch.done ? "✓" : ""}</div>
          <div
            className="es-chapter-text"
            style={!ch.done && ch.highlight === "blue" ? { color: "var(--blue)", fontWeight: 700 } : !ch.done && ch.highlight === "amber" ? { color: "var(--amber)", fontWeight: 700 } : {}}
          >
            {ch.text}
          </div>
          <div className="es-chapter-week">{ch.week}</div>
        </div>
      ))}
    </div>
  );
}

export default function TrackerPanel() {
  const [ctdl, setCtdl] = useState(initialCtdl);
  const [web, setWeb] = useState(initialWeb);

  const toggle = (list: Chapter[], set: (l: Chapter[]) => void, i: number) => {
    const next = [...list];
    next[i] = { ...next[i], done: !next[i].done };
    set(next);
  };

  const ctdlDone = ctdl.filter((c) => c.done).length;
  const webDone = web.filter((c) => c.done).length;

  return (
    <>
      <div className="es-topbar">
        <div className="es-topbar-left">
          <div className="es-topbar-title">Tracker tiến độ tự học</div>
          <div className="es-topbar-sub">Tick chương đã học · Import từ syllabus UIT</div>
        </div>
        <div className="es-topbar-right">
          <span className="es-badge es-badge-blue">🔥 8 ngày streak</span>
          <button className="es-btn es-btn-primary es-btn-sm">+ Thêm môn</button>
        </div>
      </div>

      <div className="es-content">
        <div className="es-streak-banner">
          <span style={{ fontSize: 36 }}>🔥</span>
          <div style={{ flex: 1 }}>
            <div className="es-streak-count">8 ngày streak</div>
            <div className="es-streak-label">Bạn đang on track — đừng bỏ lỡ hôm nay</div>
            <div className="es-streak-dots">
              {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => (
                <div key={d} className="es-streak-dot done">{d}</div>
              ))}
              <div className="es-streak-dot today">Hôm nay</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#fff" }}>42%</div>
            <div style={{ fontSize: 12, color: "#93C5FD" }}>Tiến độ HK</div>
          </div>
        </div>

        <div className="es-grid-2">
          <div className="es-card">
            <div className="es-tracker-hdr">
              <div className="es-tracker-name">CTDL & Giải thuật</div>
              <div className="es-tracker-pct">{ctdlDone}/{ctdl.length} chương</div>
            </div>
            <div className="es-prog-wrap" style={{ marginBottom: 12 }}>
              <div className="es-prog-fill" style={{ width: `${(ctdlDone / ctdl.length) * 100}%` }} />
            </div>
            <ChapterList chapters={ctdl} onToggle={(i) => toggle(ctdl, setCtdl, i)} />
          </div>

          <div className="es-card">
            <div className="es-tracker-hdr">
              <div className="es-tracker-name">Lập trình Web</div>
              <div className="es-tracker-pct" style={{ color: "var(--amber)" }}>{webDone}/{web.length} chương</div>
            </div>
            <div className="es-prog-wrap" style={{ marginBottom: 12 }}>
              <div className="es-prog-fill amber" style={{ width: `${(webDone / web.length) * 100}%` }} />
            </div>
            <ChapterList chapters={web} onToggle={(i) => toggle(web, setWeb, i)} />
          </div>
        </div>
      </div>
    </>
  );
}
