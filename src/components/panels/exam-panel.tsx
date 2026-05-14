"use client";

export default function ExamPanel() {
  const exams = [
    {
      day: "03", month: "Tháng 6", icon: "⚡",
      subject: "Cấu trúc DL & Giải thuật", meta: "📍 B4.01 · 7:30–9:30 · 4TC",
      pct: 50, pctColor: "var(--amber)", barCls: "amber",
      urgency: "red",
      days: [
        { label: "15/5", cls: "done" }, { label: "16/5", cls: "done" }, { label: "17/5", cls: "today" },
        { label: "18/5", cls: "scheduled" }, { label: "20/5", cls: "scheduled" }, { label: "22/5", cls: "scheduled" },
        { label: "24/5", cls: "scheduled" }, { label: "27/5", cls: "scheduled" }, { label: "01/6", cls: "scheduled" },
      ],
    },
    {
      day: "07", month: "Tháng 6", icon: "📘",
      subject: "Lập trình Web", meta: "📍 B2.03 · 13:00–15:00 · 3TC",
      pct: 70, pctColor: "var(--green)", barCls: "green",
      urgency: "normal",
      days: [
        { label: "14/5", cls: "done" }, { label: "16/5", cls: "done" }, { label: "17/5", cls: "today" },
        { label: "19/5", cls: "scheduled" }, { label: "04/6", cls: "scheduled" }, { label: "06/6", cls: "scheduled" },
      ],
    },
    {
      day: "10", month: "Tháng 6", icon: "⚠️",
      subject: "Đại số tuyến tính", meta: "📍 B3.05 · 7:30–9:30 · 3TC",
      pct: 25, pctColor: "var(--red)", barCls: "",
      urgency: "amber",
      days: [
        { label: "18/5", cls: "scheduled" }, { label: "21/5", cls: "scheduled" }, { label: "23/5", cls: "scheduled" },
        { label: "25/5", cls: "scheduled" }, { label: "28/5", cls: "scheduled" }, { label: "01/6", cls: "scheduled" },
        { label: "05/6", cls: "scheduled" }, { label: "08/6", cls: "scheduled" },
      ],
    },
  ];

  return (
    <>
      <div className="es-topbar">
        <div className="es-topbar-left">
          <div className="es-topbar-title">Kế hoạch ôn thi</div>
          <div className="es-topbar-sub">Lịch ngược từ ngày thi · Ưu tiên môn yếu</div>
        </div>
        <div className="es-topbar-right">
          <span className="es-badge es-badge-red">Gần nhất: 19 ngày</span>
          <button className="es-btn es-btn-primary es-btn-sm">+ Thêm lịch thi</button>
        </div>
      </div>

      <div className="es-content">
        <div className="es-grid-2" style={{ alignItems: "start" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 99, background: "var(--red-lt)", fontSize: 12, fontWeight: 700, color: "var(--red)", marginBottom: 14 }}>
              🚨 Thi gần nhất: 03/06 · Còn 19 ngày
            </div>

            {exams.map((e) => (
              <div
                key={e.day}
                className="es-exam-item"
                style={e.urgency === "red" ? { borderColor: "var(--red)", borderWidth: 1.5 } : e.urgency === "amber" ? { borderColor: "var(--amber)", borderWidth: 1.5 } : {}}
              >
                <div className="es-exam-date-col">
                  <div className="es-exam-day">{e.day}</div>
                  <div className="es-exam-month">{e.month}</div>
                  <div className="es-exam-vline" />
                  <span style={{ fontSize: 16 }}>{e.icon}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="es-exam-subject">{e.subject}</div>
                  <div className="es-exam-meta">{e.meta}</div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: "var(--ink2)", fontWeight: 500 }}>Tiến độ ôn</span>
                      <span className="es-mono" style={{ fontWeight: 700, color: e.pctColor }}>{e.pct}%</span>
                    </div>
                    <div className="es-prog-wrap">
                      <div className={`es-prog-fill ${e.barCls}`} style={{ width: `${e.pct}%`, background: e.barCls ? undefined : "var(--red)" }} />
                    </div>
                  </div>
                  <div className="es-study-days">
                    {e.days.map((d, i) => (
                      <span key={i} className={`es-day-chip ${d.cls}`}>{d.label}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <div className="es-card" style={{ marginBottom: 14 }}>
              <div className="es-section-hdr"><div className="es-section-title">Thứ tự ưu tiên hôm nay</div></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div className="es-card-sm" style={{ display: "flex", alignItems: "center", gap: 12, borderColor: "var(--red)", background: "var(--red-lt)" }}>
                  <span style={{ fontSize: 20 }}>1️⃣</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#991B1B" }}>CTDL – Đồ thị (Ch.6)</div>
                    <div style={{ fontSize: 11, color: "#B91C1C" }}>Thi còn 19 ngày · Ôn 50%</div>
                  </div>
                </div>
                <div className="es-card-sm" style={{ display: "flex", alignItems: "center", gap: 12, borderColor: "var(--amber)", background: "var(--amber-lt)" }}>
                  <span style={{ fontSize: 20 }}>2️⃣</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#92400E" }}>Đại số – Chương 1–2</div>
                    <div style={{ fontSize: 11, color: "#B45309" }}>Mới ôn 25% · Cần tăng tốc</div>
                  </div>
                </div>
                <div className="es-card-sm" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 20 }}>3️⃣</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>Web – React Hooks</div>
                    <div style={{ fontSize: 11, color: "var(--es-muted)" }}>Đang đúng tiến độ</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="es-card">
              <div className="es-section-hdr"><div className="es-section-title">Thống kê ôn tập</div></div>
              <div className="es-grid-2" style={{ gap: 10 }}>
                <div className="es-stat-card">
                  <div className="es-stat-label">Ngày ôn đã lên lịch</div>
                  <div className="es-stat-value">23</div>
                  <div className="es-stat-delta" style={{ color: "var(--es-muted)" }}>đến kỳ thi cuối</div>
                </div>
                <div className="es-stat-card">
                  <div className="es-stat-label">Ngày đã hoàn thành</div>
                  <div className="es-stat-value">5</div>
                  <div className="es-stat-delta delta-up">↑ đúng kế hoạch</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
