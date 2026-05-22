"use client";

import { useEffect } from "react";

/**
 * Last-resort error boundary that replaces the root layout (must render its own
 * <html>/<body>). Triggers only when layout.tsx itself throws. Uses inline styles
 * with hardcoded colors because globals.css tokens / data-theme may be unavailable
 * at this level.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error boundary caught:", error);
  }, [error]);

  return (
    <html lang="vi">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, -apple-system, sans-serif",
          background: "#0a0f1e",
          color: "#e5e7eb",
        }}
      >
        <div
          style={{
            minHeight: "100dvh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div
            style={{
              textAlign: "center",
              maxWidth: 420,
              background: "#111827",
              padding: 40,
              borderRadius: 20,
              border: "1px solid #1f2937",
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>😵</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
              Ứng dụng gặp sự cố
            </div>
            <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 24 }}>
              Đã xảy ra lỗi nghiêm trọng. Vui lòng tải lại trang.
            </div>
            <button
              onClick={() => reset()}
              style={{
                background: "#2563EB",
                color: "#fff",
                border: "none",
                padding: "10px 20px",
                borderRadius: 12,
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              🔄 Tải lại
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
