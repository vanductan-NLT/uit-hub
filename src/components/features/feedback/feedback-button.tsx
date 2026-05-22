"use client";

import { useState } from "react";
import { submitFeedback, type FeedbackType } from "@/lib/supabase/feedback-api";

interface ToastFns {
  success: (m: string) => void;
  error: (m: string) => void;
}

interface Props {
  userId: string;
  onToast?: ToastFns;
}

const TYPES: { value: FeedbackType; icon: string; label: string }[] = [
  { value: "bug",        icon: "🐛", label: "Báo lỗi" },
  { value: "suggestion", icon: "💡", label: "Gợi ý" },
  { value: "praise",     icon: "🎉", label: "Khen ngợi" },
  { value: "other",      icon: "💬", label: "Khác" },
];

export default function FeedbackButton({ userId, onToast }: Props) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("suggestion");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleOpen() { setOpen(true); setError(null); }
  function handleClose() { setOpen(false); setMessage(""); setError(null); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (message.trim().length < 5) { setError("Hãy nhập ít nhất 5 ký tự."); return; }
    setSaving(true);
    setError(null);
    const { error: err } = await submitFeedback(userId, type, message);
    setSaving(false);
    if (err) { setError("Gửi thất bại. Thử lại nhé!"); return; }
    onToast?.success("Cảm ơn bạn đã góp ý! 🙏");
    handleClose();
  }

  return (
    <>
      {/* Trigger button — sits in sidebar */}
      <button
        onClick={handleOpen}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 8,
          padding: "9px 14px", borderRadius: "var(--r)", border: "1px solid var(--es-border)",
          background: "transparent", cursor: "pointer",
          fontSize: 13, fontWeight: 600, color: "var(--es-muted)",
          transition: "background .15s, color .15s",
          fontFamily: "inherit",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,.06)"; e.currentTarget.style.color = "var(--ink)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--es-muted)"; }}
      >
        <span>💬</span> Góp ý cho UIT Hub
      </button>

      {/* Modal */}
      {open && (
        <div className="es-logout-overlay" onClick={handleClose}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--white)", borderRadius: "var(--r-lg)",
              border: "1px solid var(--es-border)",
              width: 460, maxWidth: "calc(100vw - 32px)",
              padding: "24px 24px 20px",
              boxShadow: "var(--shadow-clay)",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>💬 Góp ý &amp; phản hồi</div>
                <div style={{ fontSize: 12, color: "var(--es-muted)", marginTop: 2 }}>
                  Giúp mình cải thiện UIT Hub tốt hơn nhé!
                </div>
              </div>
              <button
                className="es-btn-ghost"
                onClick={handleClose}
                style={{ fontSize: 18, lineHeight: 1, padding: "2px 6px" }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Type chips */}
              <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                {TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    style={{
                      padding: "6px 14px", borderRadius: "var(--r-full)",
                      border: `1.5px solid ${type === t.value ? "var(--blue)" : "var(--es-border)"}`,
                      background: type === t.value ? "var(--blue-lt)" : "transparent",
                      color: type === t.value ? "var(--blue)" : "var(--es-muted)",
                      fontSize: 12, fontWeight: 600, cursor: "pointer",
                      transition: "all .15s", fontFamily: "inherit",
                    }}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>

              {/* Message */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink2)", display: "block", marginBottom: 6 }}>
                  Nội dung *
                </label>
                <textarea
                  rows={4}
                  placeholder="Bạn gặp vấn đề gì, hoặc muốn gợi ý tính năng nào?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  style={{
                    width: "100%", resize: "vertical",
                    padding: "10px 12px", borderRadius: "var(--r-sm)",
                    border: "1.5px solid var(--es-border)",
                    background: "var(--bg)", color: "var(--ink)",
                    fontSize: 13, fontFamily: "inherit",
                    outline: "none", boxSizing: "border-box",
                    transition: "border-color .15s",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--blue)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--es-border)")}
                />
              </div>

              {error && (
                <div style={{
                  fontSize: 12, color: "var(--duo-red)", marginBottom: 12,
                  padding: "8px 12px", background: "var(--red-lt)", borderRadius: "var(--r-sm)",
                }}>
                  {error}
                </div>
              )}

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  className="es-btn es-btn-outline"
                  onClick={handleClose}
                  style={{ flex: 1 }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="es-btn es-btn-primary"
                  disabled={saving}
                  style={{ flex: 1 }}
                >
                  {saving ? "Đang gửi..." : "Gửi góp ý"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
