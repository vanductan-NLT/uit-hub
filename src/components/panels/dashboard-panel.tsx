"use client";

type Props = { onNav: (panel: string) => void };

export default function DashboardPanel({ onNav }: Props) {
  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Chào buổi sáng" : hour < 18 ? "Chào buổi chiều" : "Chào buổi tối";

  const dayNames = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
  const dateStr = `${dayNames[now.getDay()]}, ${now.getDate()} tháng ${now.getMonth() + 1} · HK2 2024–2025`;

  return (
    <>
      <div className="es-topbar">
        <div className="es-topbar-left">
          <div className="es-topbar-title">{greeting}, Thanh 👋</div>
          <div className="es-topbar-sub">{dateStr}</div>
        </div>
        <div className="es-topbar-right">
          <button className="es-btn es-btn-outline es-btn-sm">⚙️ Cài đặt</button>
        </div>
      </div>

      <div className="es-content">
        <div className="es-welcome-banner">
          <div className="es-welcome-text">
            <h2>3 tuần nữa là thi cuối kỳ</h2>
            <p>Bạn đang ôn 2/5 môn đúng tiến độ. CTDL&GT cần chú ý thêm.</p>
          </div>
          <div className="es-welcome-actions">
            <button className="es-btn-white" onClick={() => onNav("exam")}>Xem lịch ôn thi</button>
            <button className="es-btn-dark" onClick={() => onNav("tracker")}>Cập nhật tiến độ</button>
          </div>
        </div>

        <div className="es-alert-strip warn">
          <span>⚠️</span>
          <span className="es-alert-text"><strong>CTDL&GT:</strong> Cần ít nhất 7.0 cuối kỳ để đạt B. Còn 19 ngày.</span>
          <button className="es-alert-cta" onClick={() => onNav("gpa")}>Xem dự báo →</button>
        </div>
        <div className="es-alert-strip info">
          <span>📌</span>
          <span className="es-alert-text"><strong>Lập trình Web:</strong> Chưa tick chương 8, 9. Bạn đang đi sau 2 tuần.</span>
          <button className="es-alert-cta" onClick={() => onNav("tracker")}>Cập nhật →</button>
        </div>

        <div className="es-grid-4" style={{ margin: "20px 0 0" }}>
          <div className="es-stat-card">
            <div className="es-stat-label">GPA tích lũy</div>
            <div className="es-stat-value">3.28</div>
            <div className="es-stat-delta delta-up">↑ +0.12 so với HK1</div>
          </div>
          <div className="es-stat-card">
            <div className="es-stat-label">Tín chỉ tích lũy</div>
            <div className="es-stat-value">67<span style={{ fontSize: 16, color: "var(--es-muted)" }}>/131</span></div>
            <div className="es-stat-delta" style={{ color: "var(--es-muted)" }}>51% chương trình</div>
          </div>
          <div className="es-stat-card">
            <div className="es-stat-label">Streak học tập</div>
            <div className="es-stat-value">🔥 8</div>
            <div className="es-stat-delta" style={{ color: "var(--amber)" }}>ngày liên tiếp</div>
          </div>
          <div className="es-stat-card">
            <div className="es-stat-label">Môn HK này</div>
            <div className="es-stat-value">5</div>
            <div className="es-stat-delta delta-up">3 đúng tiến độ</div>
          </div>
        </div>

        <div className="es-section-hdr" style={{ marginTop: 20 }}>
          <div className="es-section-title">Hành động nhanh</div>
        </div>
        <div className="es-quick-actions">
          <div className="es-quick-action" onClick={() => onNav("tracker")}>
            <div className="es-quick-action-icon">✅</div>
            <div className="es-quick-action-name">Tick chương hôm nay</div>
            <div className="es-quick-action-desc">CTDL – Chương 5 đang chờ</div>
          </div>
          <div className="es-quick-action" onClick={() => onNav("gpa")}>
            <div className="es-quick-action-icon">🔮</div>
            <div className="es-quick-action-name">Kiểm tra dự báo</div>
            <div className="es-quick-action-desc">2 môn cần chú ý</div>
          </div>
          <div className="es-quick-action" onClick={() => onNav("exam")}>
            <div className="es-quick-action-icon">📅</div>
            <div className="es-quick-action-name">Lịch ôn thi</div>
            <div className="es-quick-action-desc">Thi gần nhất: 03/06</div>
          </div>
          <div className="es-quick-action" onClick={() => onNav("roadmap")}>
            <div className="es-quick-action-icon">🗺️</div>
            <div className="es-quick-action-name">Lộ trình HK sau</div>
            <div className="es-quick-action-desc">3 môn nên đăng ký</div>
          </div>
        </div>
      </div>
    </>
  );
}
