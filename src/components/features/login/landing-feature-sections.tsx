/**
 * Four alternating feature sections — mirrors Duolingo's marketing blocks.
 * Each section: illustration + short text. Alternates left/right layout.
 */

// ── Illustration: GPA forecast (floating grade cards) ──
function GpaIllustration() {
  return (
    <div className="lp-illus lp-illus-gpa" aria-hidden="true">
      <div className="lp-illus-phone lp-illus-phone--blue">
        <div className="lp-illus-screen">
          <div className="lp-gi-title">Dự báo cuối kỳ</div>
          <div className="lp-gi-score">A (9.2)</div>
          <div className="lp-gi-bar-group">
            <div className="lp-gi-bar-row"><span>Giữa kỳ</span><div className="lp-gi-bar"><div style={{width:"80%"}}/></div></div>
            <div className="lp-gi-bar-row"><span>BT</span><div className="lp-gi-bar"><div style={{width:"95%"}}/></div></div>
            <div className="lp-gi-bar-row"><span>Cuối kỳ</span><div className="lp-gi-bar lp-gi-bar--dashed"><div style={{width:"70%"}}/></div></div>
          </div>
        </div>
      </div>
      <div className="lp-illus-chip lp-ic-1">🎯 Cần 7.5 cuối kỳ</div>
      <div className="lp-illus-chip lp-ic-2">📊 GPA 3.8</div>
    </div>
  );
}

// ── Illustration: Tracker tiến độ (chapter progress per subject) ──
function TrackerIllustration() {
  const chapters = [
    { name: "Chương 1 — Giới thiệu",        done: true  },
    { name: "Chương 2 — Cấu trúc dữ liệu",  done: true  },
    { name: "Chương 3 — Sắp xếp & tìm kiếm",done: true  },
    { name: "Chương 4 — Đồ thị & BFS/DFS",   done: true  },
    { name: "Chương 5 — Quy hoạch động",      done: false },
    { name: "Chương 6 — Greedy",              done: false },
  ];
  const pct = Math.round((chapters.filter(c => c.done).length / chapters.length) * 100);
  return (
    <div className="lp-illus lp-illus-tracker" aria-hidden="true">
      <div className="lp-tracker-card">
        <div className="lp-tracker-header">
          <span>📖 Thuật toán &amp; Cấu trúc DL</span>
          <span className="lp-tracker-pct">{pct}%</span>
        </div>
        <div className="lp-tracker-bar-track">
          <div className="lp-tracker-bar" style={{ width: `${pct}%` }} />
        </div>
        <div className="lp-tracker-rows">
          {chapters.map((c) => (
            <div key={c.name} className={`lp-tracker-row${c.done ? " done" : ""}`}>
              <span className="lp-tracker-check">{c.done ? "✅" : "⬜"}</span>
              <span className="lp-tracker-name">{c.name}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="lp-illus-chip lp-ic-3">📊 4 / 6 chương hoàn thành</div>
    </div>
  );
}

// ── Illustration: Personalized study plan (calendar) ──
function PlanIllustration() {
  return (
    <div className="lp-illus lp-illus-plan" aria-hidden="true">
      <div className="lp-plan-card">
        <div className="lp-plan-header">📅 Lịch ôn thi — Thuật toán</div>
        <div className="lp-plan-rows">
          {[
            { d: "Thứ 2", t: "Sorting algorithms", done: true },
            { d: "Thứ 3", t: "Graph & BFS/DFS", done: true },
            { d: "Thứ 4", t: "Dynamic programming", done: false },
            { d: "Thứ 5", t: "Final review", done: false },
          ].map((r) => (
            <div key={r.d} className={`lp-plan-row${r.done ? " done" : ""}`}>
              <span className="lp-plan-check">{r.done ? "✅" : "⬜"}</span>
              <span className="lp-plan-day">{r.d}</span>
              <span className="lp-plan-task">{r.t}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="lp-illus-chip lp-ic-4">🗓️ Sẵn sàng sớm 7 ngày</div>
    </div>
  );
}

// ── Illustration: Resources (floating doc cards) ──
function ResourcesIllustration() {
  return (
    <div className="lp-illus lp-illus-resources" aria-hidden="true">
      <div className="lp-res-grid">
        {[
          { icon: "📄", label: "Đề thi cũ", count: "120+" },
          { icon: "🎥", label: "Video bài giảng", count: "80+" },
          { icon: "📝", label: "Slide môn học", count: "200+" },
          { icon: "💬", label: "Tài liệu tham khảo", count: "100+" },
        ].map((r) => (
          <div key={r.label} className="lp-res-card">
            <span className="lp-res-icon">{r.icon}</span>
            <span className="lp-res-label">{r.label}</span>
            <span className="lp-res-count">{r.count}</span>
          </div>
        ))}
      </div>
      <div className="lp-illus-chip lp-ic-5">🌟 500+ tài nguyên</div>
    </div>
  );
}

// ── Feature section layout ──
interface FeatureSectionProps {
  tag: string;
  title: string;
  desc: string;
  illustration: React.ReactNode;
  flip?: boolean;     // illustration on LEFT when true
  bg?: string;
}

function FeatureSection({ tag, title, desc, illustration, flip, bg }: FeatureSectionProps) {
  return (
    <section className={`lp-feature${flip ? " lp-feature--flip" : ""}`} style={{ background: bg }}>
      <div className="lp-feature-inner">
        <div className="lp-feature-text">
          <div className="lp-feature-tag">{tag}</div>
          <h2 className="lp-feature-title">{title}</h2>
          <p className="lp-feature-desc">{desc}</p>
        </div>
        <div className="lp-feature-visual">{illustration}</div>
      </div>
    </section>
  );
}

export default function LandingFeatureSections() {
  return (
    <>
      <FeatureSection
        tag="HIỆU QUẢ"
        title="học hiệu quả"
        desc="Nhập điểm thành phần → UIT Hub dự báo GPA cuối kỳ chính xác. Biết chính xác điểm cuối kỳ cần đạt để đạt mục tiêu — không còn lo lắng hay đoán mò."
        illustration={<GpaIllustration />}
        bg="#FFFBF8"
      />
      <FeatureSection
        tag="TIẾN ĐỘ"
        title="theo dõi tiến độ"
        desc="Theo dõi từng chương theo syllabus UIT — biết chính xác đã học đến đâu, còn bao nhiêu chương, và môn nào đang tụt lại phía sau."
        illustration={<TrackerIllustration />}
        flip
        bg="var(--duo-green-lt)"
      />
      <FeatureSection
        tag="CÁ NHÂN HÓA"
        title="lộ trình riêng của bạn"
        desc="Từ ngày thi thực tế, UIT Hub tự động tạo lịch ôn thông minh — ưu tiên môn yếu, tính toán thời lượng hợp lý, sẵn sàng trước kỳ thi 1 tuần."
        illustration={<PlanIllustration />}
        bg="var(--blue-lt)"
      />
      <FeatureSection
        tag="TÀI NGUYÊN"
        title="tìm là có ngay"
        desc="Slide, đề thi cũ, video bài giảng từ cộng đồng sinh viên UIT — tập trung tại một nơi. Đúng môn, đúng lúc, không phải lùng khắp nơi."
        illustration={<ResourcesIllustration />}
        flip
        bg="var(--duo-yellow-lt)"
      />
    </>
  );
}
