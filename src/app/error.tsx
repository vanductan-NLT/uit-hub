"use client";

import { useEffect } from "react";

/**
 * Route-segment error boundary for the whole app. Catches render/runtime errors
 * in any page or panel below the root layout and shows a recoverable screen
 * instead of a white screen. Layout-level errors fall through to global-error.tsx.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error boundary caught:", error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div className="es-card" style={{ textAlign: "center", padding: 40, maxWidth: 420 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>😵</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>
          Có gì đó không ổn
        </div>
        <div style={{ fontSize: 13, color: "var(--es-muted)", marginBottom: 24 }}>
          Trang gặp sự cố ngoài dự kiến. Bạn thử tải lại — dữ liệu của bạn vẫn được lưu an toàn.
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button className="es-btn es-btn-primary" onClick={() => reset()}>
            🔄 Thử lại
          </button>
          <a
            href="/dashboard"
            className="es-btn es-btn-outline"
            style={{ textDecoration: "none" }}
          >
            Về Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
