"use client";

import { useState } from "react";
import type { Course } from "@/types/database";

interface CourseSuggestionsProps {
  suggestions: Course[];
}

const TYPE_LABEL: Record<string, string> = {
  general: "Đại cương",
  required: "Cơ sở ngành",
  elective: "Tự chọn",
};

const SHOW_PER_TYPE = 4;
const TOTAL_CAP = 12;

export default function CourseSuggestions({ suggestions }: CourseSuggestionsProps) {
  const [expanded, setExpanded] = useState(false);

  const visible = expanded ? suggestions : suggestions.slice(0, TOTAL_CAP);

  const grouped = visible.reduce<Record<string, Course[]>>((acc, c) => {
    (acc[c.course_type] ??= []).push(c);
    return acc;
  }, {});

  const typeOrder = ["general", "required", "elective"];

  if (suggestions.length === 0) {
    return (
      <div className="es-card">
        <div className="es-section-hdr">
          <div className="es-section-title">Gợi ý môn HK tới</div>
        </div>
        <div style={{ fontSize: 13, color: "var(--es-muted)", textAlign: "center", padding: "16px 0" }}>
          Chưa có môn nào đủ điều kiện
        </div>
      </div>
    );
  }

  return (
    <div className="es-card">
      <div className="es-section-hdr">
        <div className="es-section-title">Gợi ý môn HK tới</div>
        <span style={{ fontSize: 12, color: "var(--es-muted)" }}>{suggestions.length} môn đủ ĐK</span>
      </div>

      {typeOrder.map((type) => {
        const group = grouped[type];
        if (!group?.length) return null;
        const shown = expanded ? group : group.slice(0, SHOW_PER_TYPE);
        return (
          <div key={type} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--es-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {TYPE_LABEL[type] ?? type}
            </div>
            {shown.map((c) => (
              <div key={c.id} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "7px 0", borderBottom: "1px solid var(--es-border)",
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {c.name}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--es-muted)", fontFamily: "var(--font-mono-var), monospace", marginTop: 1 }}>
                    {c.id} · {c.credits}TC
                  </div>
                </div>
                <span className="es-badge es-badge-green" style={{ flexShrink: 0, fontSize: 10 }}>Đủ ĐK</span>
              </div>
            ))}
          </div>
        );
      })}

      {suggestions.length > TOTAL_CAP && (
        <button
          className="es-btn-ghost"
          onClick={() => setExpanded((v) => !v)}
          style={{ fontSize: 12, width: "100%", justifyContent: "center", marginTop: 4 }}
        >
          {expanded ? "Ẩn bớt" : `Xem thêm ${suggestions.length - TOTAL_CAP} môn`}
        </button>
      )}
    </div>
  );
}
