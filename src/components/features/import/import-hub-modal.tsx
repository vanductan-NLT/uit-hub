"use client";

/**
 * ImportHubModal — global entry point for all 3 import flows.
 * Acts as a dispatcher: closes itself then fires the appropriate callback
 * so the parent can mount the relevant sub-modal.
 */

interface Props {
  onSelectDkhp: () => void;     // Lịch học kỳ → ImportFromDkhp
  onSelectHtml: () => void;     // Bảng điểm   → ImportFromHtml
  onSelectExam: () => void;     // Lịch thi     → ImportExamHtml
  // Admin-only flows
  onSelectCatalog?: () => void; // Danh mục môn học → ImportCatalogModal
  onSelectCtdt?: () => void;    // CTĐT khoá       → ImportCtdtModal
  isAdmin?: boolean;
  onClose: () => void;
}

const OPTIONS = [
  {
    id: "html" as const,
    icon: "📊",
    title: "Bảng điểm lịch sử",
    desc: "Import toàn bộ kết quả học tập — tốt nhất để nạp đầy dữ liệu từ đầu.",
    source: "daa.uit.edu.vn › Kết quả học tập",
    badge: "Nạp đầy một lần",
    badgeCls: "es-badge-blue",
  },
  {
    id: "dkhp" as const,
    icon: "📋",
    title: "Lịch học kỳ này",
    desc: "Import môn đang đăng ký để dự báo GPA và xếp lịch ôn.",
    source: "student.uit.edu.vn › Đăng ký học phần",
    badge: "Hay dùng nhất",
    badgeCls: "es-badge-green",
  },
  {
    id: "exam" as const,
    icon: "📅",
    title: "Lịch thi",
    desc: "Import lịch thi để tự động tạo kế hoạch ôn tập ngược từ ngày thi.",
    source: "student.uit.edu.vn › Lịch thi",
    badge: null,
    badgeCls: "",
  },
] as const;

type OptionId = (typeof OPTIONS)[number]["id"] | "catalog" | "ctdt";

export default function ImportHubModal({
  onSelectDkhp, onSelectHtml, onSelectExam,
  onSelectCatalog, onSelectCtdt,
  isAdmin = false,
  onClose,
}: Props) {
  function dispatch(id: OptionId) {
    onClose();
    // Small delay so hub unmounts cleanly before sub-modal mounts
    setTimeout(() => {
      if (id === "dkhp")    onSelectDkhp();
      else if (id === "html")    onSelectHtml();
      else if (id === "exam")    onSelectExam();
      else if (id === "catalog") onSelectCatalog?.();
      else if (id === "ctdt")    onSelectCtdt?.();
    }, 60);
  }

  return (
    <div className="es-logout-overlay" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--white)",
          borderRadius: "var(--r-2xl)",
          padding: 28,
          width: "min(480px, calc(100vw - 32px))",
          boxShadow: "var(--shadow-clay)",
          animation: "duo-bounce-in 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, color: "var(--ink)" }}>📥 Import dữ liệu</div>
            <div style={{ fontSize: 12, color: "var(--es-muted)", marginTop: 3 }}>
              Chọn nguồn để nhập vào UIT Hub
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", fontSize: 22,
              cursor: "pointer", color: "var(--es-muted)", lineHeight: 1,
              padding: "0 4px", marginLeft: 8,
            }}
            aria-label="Đóng"
          >
            ×
          </button>
        </div>

        {/* Option cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {OPTIONS.map((opt) => (
            <OptionCard key={opt.id} opt={opt} onSelect={() => dispatch(opt.id)} />
          ))}
        </div>

        {/* Admin-only data import */}
        {isAdmin && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--es-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
              🛡️ Admin · Dữ liệu hệ thống
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => dispatch("catalog")}
                style={{
                  flex: 1, padding: "10px 14px", borderRadius: "var(--r-xl)",
                  border: "1.5px solid var(--es-border)", background: "var(--white)",
                  cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 13, color: "var(--ink)" }}>📚 Danh mục môn học</div>
                <div style={{ fontSize: 11, color: "var(--es-muted)" }}>daa.uit.edu.vn · tiên quyết + tương đương</div>
              </button>
              <button
                onClick={() => dispatch("ctdt")}
                style={{
                  flex: 1, padding: "10px 14px", borderRadius: "var(--r-xl)",
                  border: "1.5px solid var(--es-border)", background: "var(--white)",
                  cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 13, color: "var(--ink)" }}>🎓 CTĐT theo khoá</div>
                <div style={{ fontSize: 11, color: "var(--es-muted)" }}>student.uit.edu.vn · lộ trình 8 kỳ</div>
              </button>
            </div>
          </div>
        )}

        {/* Tip */}
        <div
          style={{
            marginTop: 16, padding: "10px 14px",
            background: "var(--blue-lt)", borderRadius: "var(--r)",
            fontSize: 12, color: "var(--ink2)", lineHeight: 1.5,
          }}
        >
          💡 Nếu lần đầu: bắt đầu bằng <strong>Bảng điểm</strong> để nạp toàn bộ lịch sử, rồi import <strong>Lịch HK này</strong> để dự báo GPA.
        </div>
      </div>
    </div>
  );
}

// ── Sub-component ──────────────────────────────────────────────────────────────

function OptionCard({
  opt,
  onSelect,
}: {
  opt: (typeof OPTIONS)[number];
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "14px 16px", borderRadius: "var(--r-xl)",
        border: "1.5px solid var(--es-border)",
        background: "var(--white)", cursor: "pointer",
        textAlign: "left", fontFamily: "inherit", width: "100%",
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--blue)";
        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--es-border)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <span style={{ fontSize: 28, flexShrink: 0, lineHeight: 1 }}>{opt.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>{opt.title}</span>
          {opt.badge && <span className={`es-badge ${opt.badgeCls}`}>{opt.badge}</span>}
        </div>
        <div style={{ fontSize: 12, color: "var(--es-muted)" }}>{opt.desc}</div>
        <div
          style={{
            fontSize: 11, color: "var(--ink2)", marginTop: 3,
            fontFamily: "var(--font-mono-var), 'JetBrains Mono', monospace",
          }}
        >
          {opt.source}
        </div>
      </div>
      <span style={{ color: "var(--es-muted)", fontSize: 18, flexShrink: 0 }}>›</span>
    </button>
  );
}
