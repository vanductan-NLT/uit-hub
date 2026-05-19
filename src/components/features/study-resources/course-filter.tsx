"use client";

import type { Course } from "@/types/database";

interface Props {
  courses: Course[];
  selected: string | null;
  onChange: (courseId: string | null) => void;
}

export default function CourseFilter({ courses, selected, onChange }: Props) {
  return (
    <select
      value={selected ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      style={{
        padding: "6px 12px",
        borderRadius: "var(--r-sm)",
        border: "1px solid var(--es-border)",
        fontFamily: "inherit",
        fontSize: 13,
        outline: "none",
        background: "var(--white)",
        color: "var(--ink)",
        minWidth: 180,
      }}
    >
      <option value="">Tất cả các môn</option>
      {courses.map((c) => (
        <option key={c.id} value={c.id}>
          {c.id} – {c.name}
        </option>
      ))}
    </select>
  );
}
