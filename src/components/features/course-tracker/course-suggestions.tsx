"use client";

import { useState } from "react";
import type { Course } from "@/types/database";

interface CourseSuggestionsProps {
  suggestions: Course[];
}

type Filter = "all" | "required" | "general" | "elective";

const FILTER_LABELS: Record<Filter, string> = {
  all: "Tất cả",
  required: "Bắt buộc",
  general: "Đại cương",
  elective: "Tự chọn",
};

const PAGE_SIZE = 6;

export default function CourseSuggestions({ suggestions }: CourseSuggestionsProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const [showAll, setShowAll] = useState(false);

  const filtered = filter === "all" ? suggestions : suggestions.filter((c) => c.course_type === filter);
  const visible = showAll ? filtered : filtered.slice(0, PAGE_SIZE);
  const overflow = filtered.length - PAGE_SIZE;

  const filters: Filter[] = ["all", "required", "general", "elective"];

  return (
    <div className="es-card">
      <div className="es-section-hdr" style={{ marginBottom: 12 }}>
        <div className="es-section-title">Gợi ý HK tới</div>
        <span style={{ fontSize: 12, color: "var(--es-muted)" }}>
          {filtered.length} môn
        </span>
      </div>

      {/* Type filter tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {filters.map((f) => {
          const count = f === "all" ? suggestions.length : suggestions.filter((c) => c.course_type === f).length;
          if (count === 0 && f !== "all") return null;
          return (
            <button
              key={f}
              className={`es-filter-btn${filter === f ? " active" : ""}`}
              onClick={() => { setFilter(f); setShowAll(false); }}
              style={{ fontSize: 11, padding: "3px 10px" }}
            >
              {FILTER_LABELS[f]}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div style={{ fontSize: 13, color: "var(--es-muted)", textAlign: "center", padding: "12px 0" }}>
          Chưa có môn nào đủ điều kiện
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {visible.map((c) => (
              <div
                key={c.id}
                title={c.name}
                style={{
                  padding: "8px 10px", borderRadius: "var(--r-sm)",
                  border: "1px solid var(--es-border)", background: "var(--bg)",
                  cursor: "default",
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--blue)", fontFamily: "var(--font-mono-var), monospace", marginBottom: 2 }}>
                  {c.id}
                </div>
                <div style={{ fontSize: 12, color: "var(--ink)", lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                  {c.name}
                </div>
                <div style={{ fontSize: 11, color: "var(--es-muted)", marginTop: 4 }}>{c.credits}TC</div>
              </div>
            ))}
          </div>

          {!showAll && overflow > 0 && (
            <button
              className="es-btn-ghost"
              onClick={() => setShowAll(true)}
              style={{ fontSize: 12, width: "100%", justifyContent: "center", marginTop: 10 }}
            >
              +{overflow} môn khác
            </button>
          )}
          {showAll && filtered.length > PAGE_SIZE && (
            <button
              className="es-btn-ghost"
              onClick={() => setShowAll(false)}
              style={{ fontSize: 12, width: "100%", justifyContent: "center", marginTop: 10 }}
            >
              Ẩn bớt
            </button>
          )}
        </>
      )}
    </div>
  );
}
