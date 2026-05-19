"use client";

import { useState } from "react";
import type { UserCourseWithCourse } from "@/types/database";

interface CourseListProps {
  userCourses: UserCourseWithCourse[];
  onEdit: (id: string, score: number, semester: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAddClick: () => void;
}

function getGradePillClass(score: number | null): string {
  if (score === null) return "";
  if (score >= 8.5) return "grade-a";
  if (score >= 7.0) return "grade-b";
  return "grade-c";
}

function getDotClass(course: UserCourseWithCourse): string {
  if (course.status === "in_progress") return "dot-current";
  if (course.score !== null && course.score >= 4.0 && course.status === "completed") return "dot-done";
  return "dot-warn";
}

function formatScore(score: number | null): string {
  if (score === null) return "—";
  return score % 1 === 0 ? `${score}.0` : `${score}`;
}

// Group courses by semester, unsorted semester goes last
function groupBySemester(courses: UserCourseWithCourse[]): [string, UserCourseWithCourse[]][] {
  const map = new Map<string, UserCourseWithCourse[]>();
  for (const c of courses) {
    const key = c.semester ?? "Chưa xác định";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(c);
  }
  return Array.from(map.entries()).sort(([a], [b]) => {
    if (a === "Chưa xác định") return 1;
    if (b === "Chưa xác định") return -1;
    return a.localeCompare(b);
  });
}

interface InlineEditState {
  id: string;
  score: string;
  semester: string;
}

export default function CourseList({ userCourses, onEdit, onDelete, onAddClick }: CourseListProps) {
  const [editing, setEditing] = useState<InlineEditState | null>(null);
  const [saving, setSaving] = useState(false);

  if (userCourses.length === 0) {
    return (
      <div
        style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", padding: "48px 24px", textAlign: "center",
          border: "2px dashed var(--es-border)", borderRadius: "var(--r-lg)",
          background: "var(--white)",
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 12 }}>🎓</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>
          Chưa có môn nào được thêm
        </div>
        <div style={{ fontSize: 13, color: "var(--es-muted)", marginBottom: 20 }}>
          Thêm môn đã học để tính GPA và theo dõi tiến độ tốt nghiệp.
        </div>
        <button className="es-btn es-btn-primary" onClick={onAddClick}>
          + Thêm môn đầu tiên
        </button>
      </div>
    );
  }

  async function handleSave(id: string) {
    if (!editing) return;
    const score = parseFloat(editing.score);
    if (isNaN(score) || score < 0 || score > 10) return;
    setSaving(true);
    try {
      await onEdit(id, score, editing.semester);
      setEditing(null);
    } finally {
      setSaving(false);
    }
  }

  const groups = groupBySemester(userCourses);

  return (
    <div>
      {groups.map(([semester, courses]) => (
        <div key={semester} style={{ marginBottom: 20 }}>
          <div className="es-semester-label">{semester}</div>
          {courses.map((uc) => {
            const isEditing = editing?.id === uc.id;
            return (
              <div
                key={uc.id}
                className="es-course-row"
                style={
                  uc.status === "in_progress"
                    ? { borderColor: "var(--blue)", boxShadow: "0 0 0 3px rgba(37,99,235,.06)" }
                    : {}
                }
              >
                <div className={`es-course-dot ${getDotClass(uc)}`} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="es-course-name">{uc.course.name}</div>
                  <div className="es-course-credits">
                    {uc.course.id} · {uc.course.credits}TC
                  </div>
                </div>

                {isEditing ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <input
                      type="number"
                      min={0} max={10} step={0.1}
                      value={editing.score}
                      onChange={(e) => setEditing({ ...editing, score: e.target.value })}
                      placeholder="Điểm"
                      style={{
                        width: 68, padding: "4px 8px", border: "1.5px solid var(--blue)",
                        borderRadius: "var(--r-sm)", fontSize: 13, fontFamily: "inherit",
                        outline: "none",
                      }}
                      autoFocus
                    />
                    <input
                      type="text"
                      placeholder="HK1-2024-2025"
                      value={editing.semester}
                      onChange={(e) => setEditing({ ...editing, semester: e.target.value })}
                      style={{
                        width: 120, padding: "4px 8px", border: "1.5px solid var(--es-border)",
                        borderRadius: "var(--r-sm)", fontSize: 12, fontFamily: "inherit",
                        outline: "none",
                      }}
                    />
                    <div style={{ display: "flex", gap: 4 }}>
                      <button
                        className="es-btn es-btn-primary es-btn-sm"
                        onClick={() => handleSave(uc.id)}
                        disabled={saving}
                      >
                        {saving ? "..." : "Lưu"}
                      </button>
                      <button
                        className="es-btn-ghost"
                        onClick={() => setEditing(null)}
                        style={{ fontSize: 12 }}
                      >
                        Huỷ
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {uc.score !== null && (
                      <div className={`es-grade-pill ${getGradePillClass(uc.score)}`}>
                        {formatScore(uc.score)}
                      </div>
                    )}
                    {uc.status === "completed" && uc.score !== null && uc.score >= 4.0 && (
                      <span className="es-badge es-badge-green">Đạt</span>
                    )}
                    {uc.status === "in_progress" && (
                      <span className="es-badge es-badge-blue">Đang học</span>
                    )}
                    {((uc.status === "failed") || (uc.score !== null && uc.score < 4.0)) && (
                      <span className="es-badge es-badge-red">Rớt</span>
                    )}
                    <button
                      className="es-btn-ghost"
                      style={{ fontSize: 12, padding: "3px 6px" }}
                      onClick={() =>
                        setEditing({
                          id: uc.id,
                          score: uc.score !== null ? String(uc.score) : "",
                          semester: uc.semester ?? "",
                        })
                      }
                      title="Sửa"
                    >
                      ✏️
                    </button>
                    <button
                      className="es-btn-ghost"
                      style={{ fontSize: 12, padding: "3px 6px", color: "var(--red)" }}
                      onClick={() => onDelete(uc.id)}
                      title="Xoá"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
