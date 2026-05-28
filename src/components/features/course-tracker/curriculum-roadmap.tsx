"use client";

import type { CurriculumWithDetails } from "@/lib/data/curriculum-registry";
import type { Course, UserCourseWithCourse } from "@/types/database";

type CourseStatus = "passed" | "in_progress" | "available" | "locked";

interface Props {
  curriculum: CurriculumWithDetails;
  userCourses: UserCourseWithCourse[];
  allCourses: Course[];
  passedIds: Set<string>;
  takenIds: Set<string>;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function getStatus(
  courseId: string,
  course: Course | undefined,
  passedIds: Set<string>,
  takenIds: Set<string>
): CourseStatus {
  if (passedIds.has(courseId)) return "passed";
  if (takenIds.has(courseId)) return "in_progress";
  if (!course) return "locked";
  if (course.prerequisites.every((pid) => passedIds.has(pid))) return "available";
  return "locked";
}

const STATUS_CFG: Record<CourseStatus, { dot: string; leftBorder: string; bg: string; idColor: string }> = {
  passed:      { dot: "✅", leftBorder: "var(--green)",     bg: "var(--green-lt)",  idColor: "var(--green)" },
  in_progress: { dot: "🔄", leftBorder: "var(--amber)",     bg: "var(--amber-lt)",  idColor: "var(--amber)" },
  available:   { dot: "📗", leftBorder: "var(--blue)",      bg: "var(--blue-lt)",   idColor: "var(--blue)" },
  locked:      { dot: "🔒", leftBorder: "var(--es-border)", bg: "var(--bg)",        idColor: "var(--es-muted)" },
};

const STATUS_LABELS: Record<CourseStatus, string> = {
  passed:      "Đã qua",
  in_progress: "Đang học",
  available:   "Có thể đăng ký",
  locked:      "Chưa đủ ĐK",
};

const REQ_TYPE_BADGE: Record<string, string> = {
  general:    "ĐC",
  foundation: "CS",
  required:   "BB",
  elective:   "TC",
};

// ── Component ──────────────────────────────────────────────────────────────────

export default function CurriculumRoadmap({ curriculum, allCourses, passedIds, takenIds }: Props) {
  const courseMap = new Map(allCourses.map((c) => [c.id, c]));

  // Group by suggested_semester, unsorted → semester 0 = "Chưa xếp"
  const bySemester = curriculum.courses.reduce<Record<number, typeof curriculum.courses>>((acc, c) => {
    const sem = c.suggested_semester ?? 0;
    (acc[sem] ??= []).push(c);
    return acc;
  }, {});

  const semesters = Object.keys(bySemester).map(Number).sort((a, b) => a - b);

  return (
    <div>
      {/* Legend */}
      <div style={{ display: "flex", gap: 14, marginBottom: 16, flexWrap: "wrap" }}>
        {(Object.keys(STATUS_LABELS) as CourseStatus[]).map((s) => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--es-muted)" }}>
            <span>{STATUS_CFG[s].dot}</span>
            <span>{STATUS_LABELS[s]}</span>
          </div>
        ))}
      </div>

      {/* Semester grid — 2 cols on small screens, 3-4 on wide */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
        {semesters.map((sem) => {
          const rows = bySemester[sem];
          const passedCount = rows.filter((r) => passedIds.has(r.course_id)).length;
          const semCredits = rows.reduce((s, r) => s + (courseMap.get(r.course_id)?.credits ?? 0), 0);

          return (
            <div key={sem} className="es-card" style={{ padding: "12px 14px" }}>
              {/* Semester header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "var(--ink)" }}>
                  {sem === 0 ? "Chưa xếp" : `HK ${sem}`}
                </div>
                <div style={{ fontSize: 10, color: "var(--es-muted)" }}>
                  {semCredits}TC · {passedCount}/{rows.length}
                </div>
              </div>

              {/* Progress bar */}
              <div className="es-prog-wrap" style={{ marginBottom: 10, height: 4 }}>
                <div
                  className="es-prog-fill green"
                  style={{ width: rows.length > 0 ? `${Math.round((passedCount / rows.length) * 100)}%` : "0%" }}
                />
              </div>

              {/* Course cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {rows.map((cc) => {
                  const course = courseMap.get(cc.course_id);
                  const status = getStatus(cc.course_id, course, passedIds, takenIds);
                  const cfg = STATUS_CFG[status];
                  const missingPrereqs = status === "locked" && course
                    ? course.prerequisites.filter((pid) => !passedIds.has(pid))
                    : [];
                  const reqBadge = REQ_TYPE_BADGE[cc.requirement_type] ?? cc.requirement_type;

                  return (
                    <div
                      key={cc.course_id}
                      style={{
                        padding: "5px 8px", borderRadius: "var(--r-sm)",
                        background: cfg.bg, borderLeft: `3px solid ${cfg.leftBorder}`,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 4 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: cfg.idColor, fontFamily: "monospace", letterSpacing: "0.03em" }}>
                            {cc.course_id}
                            <span style={{ marginLeft: 5, fontSize: 10, fontWeight: 600, padding: "1px 5px", borderRadius: 99, background: "var(--es-border)", color: "var(--ink2)", fontFamily: "inherit" }}>
                              {reqBadge}
                            </span>
                          </div>
                          <div style={{
                            fontSize: 12, color: "var(--ink)", marginTop: 2, lineHeight: 1.4,
                            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}>
                            {course?.name ?? "—"}
                          </div>
                        </div>
                        <div style={{ fontSize: 11, color: "var(--es-muted)", flexShrink: 0, fontWeight: 600 }}>
                          {course?.credits ?? "?"}TC
                        </div>
                      </div>
                      {missingPrereqs.length > 0 && (
                        <div style={{ fontSize: 9, color: "var(--es-muted)", marginTop: 3 }}>
                          Cần: {missingPrereqs.slice(0, 3).join(", ")}{missingPrereqs.length > 3 ? ` +${missingPrereqs.length - 3}` : ""}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
