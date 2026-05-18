"use client";

import { useTheme } from "@/hooks/use-theme";

export default function ThemeToggle() {
  const { theme, toggle, mounted } = useTheme();
  if (!mounted) return <div style={{ width: 28, height: 28 }} />;

  const isDark = theme === "dark";

  return (
    <button
      onClick={(e) => { e.stopPropagation(); toggle(); }}
      aria-label={isDark ? "Chuyển sáng" : "Chuyển tối"}
      title={isDark ? "Chuyển sáng" : "Chuyển tối"}
      style={{
        width: 28, height: 28,
        borderRadius: 7,
        border: "none",
        background: "rgba(255,255,255,0.08)",
        cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 15,
        flexShrink: 0,
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
    >
      <span style={{
        display: "inline-block",
        transition: "transform 0.4s ease, opacity 0.2s",
        transform: isDark ? "rotate(20deg)" : "rotate(0deg)",
      }}>
        {isDark ? "🌙" : "☀️"}
      </span>
    </button>
  );
}
