"use client";

import { useTheme } from "@/hooks/use-theme";

export default function ThemeToggle() {
  const { theme, toggle, mounted } = useTheme();

  // Avoid hydration mismatch — render placeholder until mounted
  if (!mounted) return <div style={{ width: 44, height: 24 }} />;

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Chuyển sang sáng" : "Chuyển sang tối"}
      style={{
        position: "relative",
        width: 44,
        height: 24,
        borderRadius: 99,
        border: "none",
        cursor: "pointer",
        padding: 0,
        background: isDark ? "#8AB4F8" : "rgba(255,255,255,0.15)",
        transition: "background 0.3s ease",
        flexShrink: 0,
      }}
    >
      {/* Track icons */}
      <span style={{
        position: "absolute",
        left: 5,
        top: "50%",
        transform: "translateY(-50%)",
        fontSize: 11,
        opacity: isDark ? 0 : 1,
        transition: "opacity 0.2s",
        userSelect: "none",
      }}>☀️</span>
      <span style={{
        position: "absolute",
        right: 5,
        top: "50%",
        transform: "translateY(-50%)",
        fontSize: 11,
        opacity: isDark ? 1 : 0,
        transition: "opacity 0.2s",
        userSelect: "none",
      }}>🌙</span>

      {/* Sliding thumb */}
      <span style={{
        position: "absolute",
        top: 3,
        left: isDark ? "calc(100% - 21px)" : 3,
        width: 18,
        height: 18,
        borderRadius: "50%",
        background: "#fff",
        boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
        transition: "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }} />
    </button>
  );
}
