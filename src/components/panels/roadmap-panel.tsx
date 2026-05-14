"use client";

export default function RoadmapPanel() {
  return (
    <>
      <div className="es-topbar">
        <div className="es-topbar-left">
          <div className="es-topbar-title">Lộ trình môn học</div>
          <div className="es-topbar-sub">Theo ngành CNTT – Chuyên ngành Kỹ thuật phần mềm</div>
        </div>
        <div className="es-topbar-right">
          <span className="es-badge es-badge-green">✓ 67/131 TC</span>
          <button className="es-btn es-btn-outline es-btn-sm">Đổi chuyên ngành</button>
        </div>
      </div>

      <div className="es-content">
        <div className="es-grid-2" style={{ alignItems: "start" }}>
          <div>
            <div className="es-prereq-alert">
              <span style={{ fontSize: 18 }}>⚠️</span>
              <div className="es-prereq-text">
                <strong>Kiến trúc máy tính</strong> là tiên quyết của <strong>Hệ điều hành</strong>. Bạn chưa học môn này — nên ưu tiên HK3.
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div className="es-semester-label">HK1 · 2023–2024</div>
              {[
                { name: "Toán cao cấp A1", credits: "4TC · Toán – Cơ sở", grade: "A", dot: "dot-done" },
                { name: "Lập trình hướng đối tượng", credits: "4TC · Lập trình – Cơ sở", grade: "B+", dot: "dot-done" },
                { name: "Nhập môn CNPM", credits: "4TC · SE – Cơ sở", grade: "B", dot: "dot-done" },
              ].map((c) => (
                <div className="es-course-row" key={c.name}>
                  <div className={`es-course-dot ${c.dot}`} />
                  <div style={{ flex: 1 }}>
                    <div className="es-course-name">{c.name}</div>
                    <div className="es-course-credits">{c.credits}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div className={`es-grade-pill ${c.grade.startsWith("A") ? "grade-a" : "grade-b"}`}>{c.grade}</div>
                    <span className="es-badge es-badge-green">Đạt</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 20 }}>
              <div className="es-semester-label">HK2 · 2024–2025 · Hiện tại</div>
              {[
                { name: "Cấu trúc dữ liệu & Giải thuật", credits: "4TC · Lập trình – Core", dot: "dot-current", badge: <span className="es-badge es-badge-blue">Đang học</span> },
                { name: "Lập trình Web", credits: "3TC · Web – Core", dot: "dot-current", badge: <span className="es-badge es-badge-blue">Đang học</span> },
                { name: "Kiến trúc máy tính", credits: "3TC · Hệ thống – Tiên quyết", dot: "dot-warn", badge: <span className="es-badge es-badge-amber">Nên học HK này</span> },
              ].map((c) => (
                <div className="es-course-row" key={c.name} style={c.dot === "dot-current" ? { borderColor: "var(--blue)", boxShadow: "0 0 0 3px rgba(37,99,235,.06)" } : {}}>
                  <div className={`es-course-dot ${c.dot}`} />
                  <div style={{ flex: 1 }}>
                    <div className="es-course-name">{c.name}</div>
                    <div className="es-course-credits">{c.credits}</div>
                  </div>
                  <div>{c.badge}</div>
                </div>
              ))}
            </div>

            <div>
              <div className="es-semester-label">HK3 · Gợi ý</div>
              <div className="es-course-row">
                <div className="es-course-dot dot-locked" />
                <div style={{ flex: 1 }}>
                  <div className="es-course-name">Hệ điều hành</div>
                  <div className="es-course-credits">3TC · Hệ thống – Tiên quyết: Kiến trúc MT</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14 }}>🔒</span>
                  <span className="es-badge es-badge-gray">Chưa đủ TQ</span>
                </div>
              </div>
              {[
                { name: "Cơ sở dữ liệu", credits: "4TC · Database – Core", badge: <span className="es-badge es-badge-blue">Có thể học</span> },
                { name: "Mạng máy tính", credits: "3TC · Hệ thống – Core", badge: <span className="es-badge es-badge-blue">Có thể học</span> },
              ].map((c) => (
                <div className="es-course-row" key={c.name}>
                  <div className="es-course-dot" style={{ background: "var(--blue-mid)" }} />
                  <div style={{ flex: 1 }}>
                    <div className="es-course-name">{c.name}</div>
                    <div className="es-course-credits">{c.credits}</div>
                  </div>
                  {c.badge}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="es-card" style={{ marginBottom: 14 }}>
              <div className="es-section-hdr"><div className="es-section-title">Tiến độ chương trình</div></div>
              {[
                { label: "Tín chỉ tích lũy", value: "67/131", pct: 51, cls: "" },
                { label: "Môn đại cương", value: "18/28TC", pct: 64, cls: "green" },
                { label: "Môn chuyên ngành", value: "22/75TC", pct: 29, cls: "amber" },
              ].map((p) => (
                <div key={p.label} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 13, color: "var(--ink2)" }}>{p.label}</span>
                    <span className="es-mono" style={{ fontSize: 13, fontWeight: 700 }}>{p.value}</span>
                  </div>
                  <div className="es-prog-wrap"><div className={`es-prog-fill ${p.cls}`} style={{ width: `${p.pct}%` }} /></div>
                </div>
              ))}
            </div>

            <div className="es-card">
              <div className="es-section-hdr"><div className="es-section-title">HK sau nên đăng ký</div></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div className="es-card-sm" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 18 }}>⭐</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>Cơ sở dữ liệu</div>
                    <div style={{ fontSize: 11, color: "var(--es-muted)" }}>4TC · Cao nhất trong lộ trình còn lại</div>
                  </div>
                </div>
                <div className="es-card-sm" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 18 }}>📡</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>Mạng máy tính</div>
                    <div style={{ fontSize: 11, color: "var(--es-muted)" }}>3TC · Không cần tiên quyết</div>
                  </div>
                </div>
                <div className="es-card-sm" style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--amber-lt)", borderColor: "var(--amber-mid)" }}>
                  <span style={{ fontSize: 18 }}>⚡</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#92400E" }}>Kiến trúc máy tính</div>
                    <div style={{ fontSize: 11, color: "#B45309" }}>Học sớm để mở khoá Hệ điều hành</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
