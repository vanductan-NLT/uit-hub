"use client";

interface ErrorStateProps {
  message?: string;
  /** When provided, shows a retry button that re-runs the failed action. */
  onRetry?: () => void;
  /** "card" = full centered card (empty panel); "inline" = compact alert strip. */
  variant?: "inline" | "card";
}

/**
 * Reusable error-state UI. Replaces ad-hoc `es-alert-strip` blocks scattered
 * across panels so every fetch failure shows a meaningful message + retry,
 * never a silent blank or raw error string.
 */
export default function ErrorState({
  message = "Đã có lỗi xảy ra khi tải dữ liệu.",
  onRetry,
  variant = "card",
}: ErrorStateProps) {
  if (variant === "inline") {
    return (
      <div className="es-alert-strip warn">
        <span>⚠️</span>
        <span>{message}</span>
        {onRetry && (
          <button
            className="es-btn-ghost"
            onClick={onRetry}
            style={{ marginLeft: "auto", fontSize: 12 }}
          >
            Thử lại
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="es-card" style={{ textAlign: "center", padding: 40 }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
      <div style={{ fontWeight: 600, marginBottom: 4, color: "var(--ink)" }}>
        Không tải được dữ liệu
      </div>
      <div style={{ fontSize: 13, marginBottom: onRetry ? 20 : 0, color: "var(--es-muted)" }}>
        {message}
      </div>
      {onRetry && (
        <button className="es-btn es-btn-primary" onClick={onRetry} style={{ margin: "0 auto" }}>
          🔄 Thử lại
        </button>
      )}
    </div>
  );
}
