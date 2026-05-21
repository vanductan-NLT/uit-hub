interface Props {
  onLogin: () => void;
  loading?: boolean;
}

const SUBJECTS = [
  { icon: "🧮", label: "Toán" },
  { icon: "⚙️", label: "Lập trình" },
  { icon: "🗄️", label: "CSDL" },
  { icon: "🌐", label: "Mạng máy tính" },
  { icon: "🔐", label: "Bảo mật" },
  { icon: "🤖", label: "AI / ML" },
  { icon: "📱", label: "Thiết kế UI" },
  { icon: "📊", label: "Thống kê" },
  { icon: "🏗️", label: "Kiến trúc PM" },
  { icon: "🧪", label: "Kiểm thử" },
];

/** Hero — phone mockup right, text + CTAs left, subject strip bottom */
export default function LandingHero({ onLogin, loading }: Props) {
  return (
    <section className="lp-hero">
      {/* Text side */}
      <div className="lp-hero-text">
        <div className="lp-hero-badge">🎓 Dành cho sinh viên UIT</div>
        <h1 className="lp-hero-heading">
          Cá nhân hóa<br />hành trình học tập<br />của bạn tại UIT
        </h1>
        <p className="lp-hero-sub">
          Dự báo GPA, theo dõi tiến độ học tập, lên kế hoạch ôn thi
          và tổng hợp tài nguyên UIT — tất cả trong một nơi.
        </p>

        <div className="lp-hero-btns">
          <button className="lp-btn-primary lp-btn-lg" onClick={onLogin} disabled={loading}>
            {loading ? "Đang chuyển hướng…" : "BẮT ĐẦU MIỄN PHÍ"}
          </button>
          <button className="lp-btn-outline lp-btn-lg" onClick={onLogin} disabled={loading}>
            ĐÃ CÓ TÀI KHOẢN
          </button>
        </div>

        <p className="lp-hero-hint">
          Chỉ chấp nhận email <strong>@gm.uit.edu.vn</strong>
        </p>
      </div>

      {/* Illustration side — CSS 3D phone */}
      <div className="lp-hero-visual" aria-hidden="true">
        <div className="lp-phone-scene">
          {/* Phone body */}
          <div className="lp-phone">
            <div className="lp-phone-notch" />
            <div className="lp-phone-screen">
              {/* Mock app UI */}
              <div className="lp-app-ui">
                <div className="lp-app-row">
                  <span className="lp-app-label">GPA hiện tại</span>
                  <span className="lp-app-val lp-app-val--blue">3.65</span>
                </div>
                <div className="lp-app-bar-track">
                  <div className="lp-app-bar" style={{ width: "73%" }} />
                </div>
                <div className="lp-app-row" style={{ marginTop: 10 }}>
                  <span className="lp-app-label">Tín chỉ tích lũy</span>
                  <span className="lp-app-val lp-app-val--green">87 / 130</span>
                </div>
                <div className="lp-app-bar-track">
                  <div className="lp-app-bar lp-app-bar--green" style={{ width: "67%" }} />
                </div>
                <div className="lp-app-streak">
                  <span>📖</span>
                  <span className="lp-app-streak-label">5 / 8 chương hoàn thành</span>
                </div>
              </div>
            </div>
          </div>

          {/* Floating achievement chips */}
          <div className="lp-float-chip lp-fc-1">📈 GPA dự báo: 3.8</div>
          <div className="lp-float-chip lp-fc-2">🗓️ Lịch ôn sẵn sàng</div>
          <div className="lp-float-chip lp-fc-3">✅ Ôn xong hôm nay</div>
          <div className="lp-float-chip lp-fc-4">📚 500+ tài nguyên</div>
        </div>
      </div>

      {/* Subject selector strip (like Duolingo language strip) */}
      <div className="lp-subjects-strip" aria-label="Các môn học tại UIT">
        <button className="lp-subjects-arrow lp-subjects-arrow--left" aria-hidden="true">‹</button>
        <div className="lp-subjects-scroll">
          {[...SUBJECTS, ...SUBJECTS].map((s, i) => (
            <button key={i} className="lp-subject-chip" onClick={onLogin}>
              <span className="lp-subject-icon">{s.icon}</span>
              <span className="lp-subject-label">{s.label}</span>
            </button>
          ))}
        </div>
        <button className="lp-subjects-arrow lp-subjects-arrow--right" aria-hidden="true">›</button>
      </div>
    </section>
  );
}
