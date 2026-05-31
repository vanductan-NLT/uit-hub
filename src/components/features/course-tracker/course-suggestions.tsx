"use client";

import { useState } from "react";
import type { Course } from "@/types/database";
import type { SuggestionReason } from "@/lib/course-utils";

interface CourseSuggestionsProps {
  suggestions: Course[];
  reason?: SuggestionReason;
  onImport?: () => void;
}

type Filter = "all" | "required" | "general" | "elective";

const FILTER_LABELS: Record<Filter, string> = {
  all: "Tất cả",
  required: "Bắt buộc",
  general: "Đại cương",
  elective: "Tự chọn",
};

const PAGE_SIZE = 6;

export default function CourseSuggestions({ suggestions, reason, onImport }: CourseSuggestionsProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const [showAll, setShowAll] = useState(false);

  if (reason === "no_curriculum") {
    return (
      <div className="es-card">
        <div className="es-section-hdr" style={{ marginBottom: 12 }}>
          <div className="es-section-title">Gợi ý HK tới</div>
        </div>
        <div style={{ fontSize: 13, color: "var(--es-muted)", textAlign: "center", padding: "16px 8px", lineHeight: 1.6 }}>
          Chưa có chương trình đào tạo (CTĐT).
          <br />
          Nhập CTĐT để hệ thống gợi ý các môn của ngành và học kỳ kế tiếp.
        </div>
        {onImport && (
          <button
            className="es-btn es-btn-primary es-btn-sm"
            onClick={onImport}
            style={{ width: "100%", marginTop: 4 }}
          >
            Nhập CTĐT
          </button>
        )}
      </div>
    );
  }

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
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {visible.map((c) => {
              const typeLabel = c.course_type === "required" ? "Bắt buộc" : c.course_type === "general" ? "Đại cương" : "Tự chọn";
              return (
                <div
                  key={c.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 10px", borderRadius: "var(--r-sm)",
                    border: "1px solid var(--es-border)", background: "var(--bg)",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.name}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--es-muted)", marginTop: 2, fontFamily: "var(--font-mono-var), monospace" }}>
                      {c.id} · {c.credits}TC
                    </div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 99, background: "var(--es-border)", color: "var(--ink2)", flexShrink: 0, whiteSpace: "nowrap" }}>
                    {typeLabel}
                  </span>
                </div>
              );
            })}
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
