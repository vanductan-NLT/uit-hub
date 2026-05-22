"use client";

import type { Toast, ToastType } from "@/hooks/use-toast";

const TOAST_STYLES: Record<ToastType, { bg: string; color: string; icon: string }> = {
  success: { bg: "var(--duo-green-lt, #f0fdf4)", color: "var(--duo-green)", icon: "✅" },
  error:   { bg: "var(--red-lt, #fff1f0)",       color: "var(--duo-red)",   icon: "❌" },
  warning: { bg: "var(--amber-lt)",              color: "var(--amber)",     icon: "⚠️" },
  info:    { bg: "var(--blue-lt)",               color: "var(--blue)",      icon: "ℹ️" },
};

interface Props {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export default function ToastContainer({ toasts, onRemove }: Props) {
  if (toasts.length === 0) return null;
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      display: "flex", flexDirection: "column", gap: 8, pointerEvents: "none",
    }}>
      {toasts.map((t) => {
        const s = TOAST_STYLES[t.type];
        return (
          <div
            key={t.id}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "12px 16px", borderRadius: "var(--r-sm)",
              background: s.bg, color: s.color,
              border: `1px solid ${s.color}33`,
              boxShadow: "var(--shadow-clay)",
              fontSize: 13, fontWeight: 600,
              pointerEvents: "all",
              animation: "duo-bounce-in 0.3s cubic-bezier(0.34,1.56,0.64,1)",
              minWidth: 240, maxWidth: 360,
            }}
          >
            <span style={{ flexShrink: 0 }}>{s.icon}</span>
            <span style={{ flex: 1 }}>{t.message}</span>
            <button
              onClick={() => onRemove(t.id)}
              style={{ background: "none", border: "none", cursor: "pointer", color: s.color, fontSize: 16, padding: 0, lineHeight: 1 }}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
