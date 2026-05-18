"use client";

import type { Course, UserCourseWithCourse } from "@/types/database";
import { parseSemester } from "@/lib/course-utils";

interface CourseTimelineProps {
  userCourses: UserCourseWithCourse[];
  suggestions: Course[];
}

const CHIP_MAX = 8;

function chipStyle(status: UserCourseWithCourse["status"], score: number | null): React.CSSProperties {
  const passed = score !== null && score >= 5;
  if (status === "exempted") return { background: "var(--bg)", color: "var(--es-muted)", border: "1px solid var(--es-border)" };
  if (status === "in_progress") return { background: "var(--blue-lt)", color: "var(--blue)", border: "1px solid var(--blue-mid, var(--blue))" };
  if (status === "failed" || (!passed && score !== null)) return { background: "var(--red-lt)", color: "var(--red)", border: "1px solid var(--red)" };
  if (passed) return { background: "var(--green-lt)", color: "var(--green)", border: "1px solid var(--green)" };
  return { background: "var(--bg)", color: "var(--es-muted)", border: "1px solid var(--es-border)" };
}

function Chip({ label, title, style }: { label: string; title: string; style: React.CSSProperties }) {
  return (
    <span
      title={title}
      style={{
        display: "inline-block", padding: "2px 8px", borderRadius: 99,
        fontSize: 11, fontWeight: 600, fontFamily: "var(--font-mono-var), monospace",
        whiteSpace: "nowrap", cursor: "default", ...style,
      }}
    >
      {label}
    </span>
  );
}

function SemesterRow({ label, chips, extra }: { label: string; chips: React.ReactNode; extra?: string }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", paddingBottom: 14, marginBottom: 14, borderBottom: "1px solid var(--es-border)" }}>
      <div style={{ width: 120, flexShrink: 0, fontSize: 12, fontWeight: 600, color: "var(--ink2)", paddingTop: 3 }}>{label}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, flex: 1 }}>
        {chips}
        {extra && <span style={{ fontSize: 11, color: "var(--es-muted)", alignSelf: "center" }}>{extra}</span>}
      </div>
    </div>
  );
}

export default function CourseTimeline({ userCourses, suggestions }: CourseTimelineProps) {
  // Group by semester
  const semMap = new Map<string, UserCourseWithCourse[]>();
  const unassigned: UserCourseWithCourse[] = [];

  for (const uc of userCourses) {
    if (!uc.semester) { unassigned.push(uc); continue; }
    const list = semMap.get(uc.semester) ?? [];
    list.push(uc);
    semMap.set(uc.semester, list);
  }

  // Sort semesters chronologically
  const sortedSems = [...semMap.entries()].sort(([a], [b]) => {
    const pa = parseSemester(a)?.index ?? 0;
    const pb = parseSemester(b)?.index ?? 0;
    return pa - pb;
  });

  if (sortedSems.length === 0 && unassigned.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "48px 0", color: "var(--es-muted)", fontSize: 14 }}>
        Chưa có dữ liệu — import hoặc thêm môn để xem lộ trình.
      </div>
    );
  }

  return (
    <div style={{ padding: "4px 0" }}>
      {sortedSems.map(([sem, courses]) => {
        const label = parseSemester(sem)?.label ?? sem;
        const shown = courses.slice(0, CHIP_MAX);
        const overflow = courses.length - CHIP_MAX;
        return (
          <SemesterRow
            key={sem}
            label={label}
            chips={shown.map((uc) => (
              <Chip
                key={uc.course_id}
                label={uc.course_id}
                title={`${uc.course.name} · ${uc.score ?? "—"}`}
                style={chipStyle(uc.status, uc.score)}
              />
            ))}
            extra={overflow > 0 ? `+${overflow} môn` : undefined}
          />
        );
      })}

      {unassigned.length > 0 && (
        <SemesterRow
          label="Chưa xác định"
          chips={unassigned.slice(0, CHIP_MAX).map((uc) => (
            <Chip
              key={uc.course_id}
              label={uc.course_id}
              title={uc.course.name}
              style={chipStyle(uc.status, uc.score)}
            />
          ))}
          extra={unassigned.length > CHIP_MAX ? `+${unassigned.length - CHIP_MAX} môn` : undefined}
        />
      )}

      {/* Future row: top suggestions */}
      {suggestions.length > 0 && (
        <SemesterRow
          label="HK tới (dự kiến)"
          chips={suggestions.slice(0, CHIP_MAX).map((c) => (
            <Chip
              key={c.id}
              label={c.id}
              title={c.name}
              style={{ background: "var(--bg)", color: "var(--es-muted)", border: "1px dashed var(--es-border)" }}
            />
          ))}
          extra={suggestions.length > CHIP_MAX ? `+${suggestions.length - CHIP_MAX} môn đủ ĐK` : undefined}
        />
      )}

      {/* Legend */}
      <div style={{ display: "flex", gap: 14, marginTop: 8, flexWrap: "wrap" }}>
        {[
          { label: "Đạt", s: { background: "var(--green-lt)", color: "var(--green)", border: "1px solid var(--green)" } },
          { label: "Rớt", s: { background: "var(--red-lt)", color: "var(--red)", border: "1px solid var(--red)" } },
          { label: "Đang học", s: { background: "var(--blue-lt)", color: "var(--blue)", border: "1px solid var(--blue)" } },
          { label: "Miễn", s: { background: "var(--bg)", color: "var(--es-muted)", border: "1px solid var(--es-border)" } },
          { label: "Dự kiến", s: { background: "var(--bg)", color: "var(--es-muted)", border: "1px dashed var(--es-border)" } },
        ].map(({ label, s }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 99, ...s }} />
            <span style={{ fontSize: 11, color: "var(--es-muted)" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
