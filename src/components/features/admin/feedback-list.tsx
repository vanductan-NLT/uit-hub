"use client";

import { useState, useEffect, useMemo } from "react";
import { getFeedback, type FeedbackRow } from "@/lib/supabase/admin-api";

const TYPE_META: Record<string, { icon: string; label: string; color: string; bg: string }> = {
  bug:        { icon: "🐛", label: "Báo lỗi",   color: "var(--duo-red)",    bg: "var(--red-lt)" },
  suggestion: { icon: "💡", label: "Gợi ý",     color: "var(--blue)",       bg: "var(--blue-lt)" },
  praise:     { icon: "🎉", label: "Khen ngợi", color: "var(--duo-green)",  bg: "var(--duo-green-lt)" },
  other:      { icon: "💬", label: "Khác",      color: "var(--es-muted)",   bg: "var(--es-bg-alt)" },
};

const FILTERS = ["all", "bug", "suggestion", "praise", "other"] as const;
type Filter = (typeof FILTERS)[number];

export default function FeedbackList() {
  const [rows, setRows] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    getFeedback()
      .then(setRows)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => (filter === "all" ? rows : rows.filter((r) => r.type === filter)),
    [rows, filter]
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length };
    for (const r of rows) c[r.type] = (c[r.type] ?? 0) + 1;
    return c;
  }, [rows]);

  if (loading) return <div style={{ textAlign: "center", padding: 40, color: "var(--es-muted)" }}>Đang tải...</div>;
  if (error) return <div style={{ textAlign: "center", padding: 40, color: "var(--duo-red)" }}>Lỗi: {error}</div>;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: "var(--es-muted)" }}>
          {rows.length} góp ý tổng cộng
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {FILTERS.map((f) => {
          const meta = f === "all" ? null : TYPE_META[f];
          const active = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "6px 14px", borderRadius: "var(--r-full)",
                border: `1.5px solid ${active ? (meta?.color ?? "var(--blue)") : "var(--es-border)"}`,
                background: active ? (meta?.bg ?? "var(--blue-lt)") : "transparent",
                color: active ? (meta?.color ?? "var(--blue)") : "var(--es-muted)",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                transition: "all .15s", fontFamily: "inherit",
              }}
            >
              {meta ? `${meta.icon} ${meta.label}` : "🗂️ Tất cả"}{" "}
              <span style={{ opacity: 0.7 }}>({counts[f] ?? 0})</span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--es-muted)" }}>
          Không có góp ý nào.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((row) => {
            const meta = TYPE_META[row.type] ?? TYPE_META.other;
            const date = new Date(row.created_at);
            const dateStr = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
            return (
              <div
                key={row.id}
                className="es-card"
                style={{ padding: "14px 16px", display: "flex", gap: 14, alignItems: "flex-start" }}
              >
                {/* Type badge */}
                <div style={{
                  padding: "4px 10px", borderRadius: "var(--r-full)", flexShrink: 0,
                  background: meta.bg, color: meta.color,
                  fontSize: 11, fontWeight: 700, marginTop: 2,
                  border: `1px solid ${meta.color}33`,
                }}>
                  {meta.icon} {meta.label}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.5, marginBottom: 6 }}>
                    {row.message}
                  </div>
                  <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--es-muted)", flexWrap: "wrap" }}>
                    {row.user_name && <span>👤 {row.user_name}</span>}
                    {row.page && <span>📍 {row.page}</span>}
                    <span>🕐 {dateStr}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
