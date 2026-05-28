"use client";

import React, { useState, useMemo } from "react";
import type { Course, UserCourseWithCourse } from "@/types/database";
import { parseSemester } from "@/lib/course-utils";
import { Check, BookOpen, Trash2, AlertTriangle, Save, Calendar } from "lucide-react";

interface CourseTimelineProps {
  userCourses: UserCourseWithCourse[];
  suggestions: Course[];
  addCourse?: (input: {
    course_id: string;
    score: number | null;
    semester: string | null;
    status: "completed" | "in_progress" | "exempted" | "failed";
    academic_year?: string | null;
    component_scores?: Record<string, number | null>;
    note?: string | null;
  }) => Promise<void>;
  editCourse?: (
    id: string,
    patch: {
      score: number | null;
      semester: string | null;
      status: "completed" | "in_progress" | "failed" | "exempted";
    }
  ) => Promise<void>;
  removeCourse?: (id: string) => Promise<void>;
}

const DEFAULT_SEMESTERS = [
  "HK1-2023-2024",
  "HK2-2023-2024",
  "HK1-2024-2025",
  "HK2-2024-2025",
  "HK1-2025-2026",
  "HK2-2025-2026",
  "HK1-2026-2027",
  "HK2-2026-2027",
];

function getCourseEmoji(name: string, status: string): string {
  const n = name.toLowerCase();
  if (status === "exempted") return "✨";
  if (status === "failed") return "❌";
  
  if (n.includes("lập trình") || n.includes("coding") || n.includes("python") || n.includes("c++") || n.includes("java") || n.includes("lập trình nâng cao")) return "💻";
  if (n.includes("cấu trúc dữ liệu") || n.includes("giải thuật") || n.includes("thuật toán")) return "🌳";
  if (n.includes("mạng máy tính") || n.includes("an toàn") || n.includes("mật mã")) return "🌐";
  if (n.includes("hệ điều hành") || n.includes("linux")) return "⚙️";
  if (n.includes("web") || n.includes("mobile") || n.includes("ứng dụng") || n.includes("phần mềm") || n.includes("software")) return "📱";
  if (n.includes("cơ sở dữ liệu") || n.includes("database") || n.includes("sql")) return "🗄️";
  
  if (n.includes("giải tích") || n.includes("đại số") || n.includes("xác suất") || n.includes("thống kê") || n.includes("toán") || n.includes("rời rạc")) return "📐";
  
  if (n.includes("anh văn") || n.includes("tiếng anh") || n.includes("english")) return "🇬🇧";
  
  if (n.includes("vật lý") || n.includes("physic") || n.includes("quang học") || n.includes("điện tử")) return "⚡";
  if (n.includes("hóa học") || n.includes("chemistry")) return "🧪";
  
  if (n.includes("triết học") || n.includes("mác") || n.includes("tư tưởng") || n.includes("đảng") || n.includes("lịch sử") || n.includes("pháp luật") || n.includes("đường lối")) return "📜";
  
  if (n.includes("thể chất") || n.includes("bóng") || n.includes("thể dục") || n.includes("chạy")) return "🏃";
  if (n.includes("kinh tế") || n.includes("quản lý") || n.includes("kỹ năng")) return "📊";
  
  if (status === "completed") return "🎓";
  if (status === "in_progress") return "📖";
  return "⏳";
}

const typeLabels: Record<string, string> = {
  required: "Bắt buộc",
  elective: "Tự chọn",
  general: "Đại cương",
};

export default function CourseTimeline({
  userCourses,
  suggestions,
  addCourse,
  editCourse,
  removeCourse,
}: CourseTimelineProps) {
  const [selectedItem, setSelectedItem] = useState<{
    course: Course;
    userCourse?: UserCourseWithCourse;
  } | null>(null);

  // Set of all passed course codes
  const allPassedIds = useMemo(() => {
    return new Set(
      userCourses
        .filter((uc) => uc.status === "completed" || uc.status === "exempted")
        .map((uc) => uc.course_id)
    );
  }, [userCourses]);

  // Alternating snake path offsets
  const offsets = [0, 30, 50, 30, 0, -30, -50, -30];

  // Flatten everything into a single learning path sequence
  const timelineElements = useMemo(() => {
    const list: Array<
      | { type: "header"; id: string; label: string; subLabel: string }
      | { type: "course"; id: string; uc: UserCourseWithCourse }
      | { type: "suggestion"; id: string; c: Course }
    > = [];

    // Group by semester
    const semMap = new Map<string, UserCourseWithCourse[]>();
    const unassignedCourses: UserCourseWithCourse[] = [];

    for (const uc of userCourses) {
      if (!uc.semester) {
        unassignedCourses.push(uc);
        continue;
      }
      const coursesInSem = semMap.get(uc.semester) ?? [];
      coursesInSem.push(uc);
      semMap.set(uc.semester, coursesInSem);
    }

    // Sort semesters chronologically
    const sortedSems = [...semMap.entries()].sort(([a], [b]) => {
      const pa = parseSemester(a)?.index ?? 0;
      const pb = parseSemester(b)?.index ?? 0;
      return pa - pb;
    });

    // 1. Semester groups
    for (const [sem, courses] of sortedSems) {
      const label = parseSemester(sem)?.label ?? sem;
      const totalCredits = courses.reduce((sum, c) => sum + c.course.credits, 0);
      const passedInSem = courses.filter((c) => c.status === "completed" || c.status === "exempted");
      const passedCredits = passedInSem.reduce((sum, c) => sum + c.course.credits, 0);
      
      list.push({
        type: "header",
        id: `header-${sem}`,
        label,
        subLabel: `${courses.length} môn học · ${passedCredits}/${totalCredits} TC tích lũy`,
      });

      for (const uc of courses) {
        list.push({
          type: "course",
          id: `course-${uc.id}`,
          uc,
        });
      }
    }

    // 2. Unassigned courses
    if (unassignedCourses.length > 0) {
      list.push({
        type: "header",
        id: "header-unassigned",
        label: "Chưa phân học kỳ",
        subLabel: `${unassignedCourses.length} môn học`,
      });
      for (const uc of unassignedCourses) {
        list.push({
          type: "course",
          id: `course-${uc.id}`,
          uc,
        });
      }
    }

    // 3. Suggested future courses
    if (suggestions.length > 0) {
      list.push({
        type: "header",
        id: "header-suggestions",
        label: "Học kỳ tới (Dự kiến)",
        subLabel: `${suggestions.length} môn đủ điều kiện`,
      });
      for (const c of suggestions) {
        list.push({
          type: "suggestion",
          id: `suggestion-${c.id}`,
          c,
        });
      }
    }

    return list;
  }, [userCourses, suggestions]);

  if (timelineElements.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "48px 0", color: "var(--es-muted)", fontSize: 14 }}>
        Chưa có dữ liệu — import hoặc thêm môn để xem lộ trình.
      </div>
    );
  }

  // Count to calculate dynamic snake pattern offsets (only increments for nodes, not headers)
  let nodeIndex = 0;

  return (
    <div style={{ padding: "10px 0" }}>
      <div className="dl-path-container">
        {/* Wavy trail connector line */}
        <div className="dl-path-line" />

        <div className="dl-path-elements">
          {timelineElements.map((el) => {
            if (el.type === "header") {
              return (
                <div key={el.id} className="dl-path-unit-header">
                  <div className="dl-path-unit-card">
                    <div className="dl-path-unit-title">Học phần</div>
                    <div className="dl-path-unit-name">{el.label}</div>
                    <div className="dl-path-unit-desc">{el.subLabel}</div>
                  </div>
                </div>
              );
            }

            // Node elements (courses or suggestions)
            const currentIdx = nodeIndex;
            nodeIndex++;
            const offset = offsets[currentIdx % offsets.length];

            if (el.type === "course") {
              const uc = el.uc;
              const emoji = getCourseEmoji(uc.course.name, uc.status);
              const statusClass = uc.status; // "completed", "in_progress", "failed", "exempted"
              
              return (
                <div key={el.id} className="dl-path-node-wrapper">
                  <button
                    onClick={() => setSelectedItem({ course: uc.course, userCourse: uc })}
                    className={`dl-path-node ${statusClass}`}
                    style={{ transform: `translateX(${offset}px)` }}
                    title={`${uc.course.name} · Điểm: ${uc.score ?? "Chưa có"}`}
                  >
                    {emoji}
                    {uc.status === "in_progress" && <span className="dl-path-active-ring" />}
                  </button>
                  <div className="dl-path-node-label" style={{ transform: `translateX(${offset}px)` }}>
                    {uc.course_id}
                  </div>
                  <div className="dl-path-node-title" style={{ transform: `translateX(${offset}px)` }}>
                    {uc.course.name}
                  </div>
                </div>
              );
            } else {
              const c = el.c;
              const emoji = getCourseEmoji(c.name, "suggestion");

              return (
                <div key={el.id} className="dl-path-node-wrapper">
                  <button
                    onClick={() => setSelectedItem({ course: c })}
                    className="dl-path-node suggestion"
                    style={{ transform: `translateX(${offset}px)` }}
                    title={`${c.name} · Môn dự kiến`}
                  >
                    {emoji}
                  </button>
                  <div className="dl-path-node-label" style={{ transform: `translateX(${offset}px)` }}>
                    {c.id}
                  </div>
                  <div className="dl-path-node-title" style={{ transform: `translateX(${offset}px)` }}>
                    {c.name}
                  </div>
                </div>
              );
            }
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 14, marginTop: 24, flexWrap: "wrap", justifyContent: "center" }}>
        {[
          { label: "Đạt", s: "completed", emoji: "🎓" },
          { label: "Chưa đạt", s: "failed", emoji: "❌" },
          { label: "Đang học", s: "in_progress", emoji: "📖" },
          { label: "Miễn học", s: "exempted", emoji: "✨" },
          { label: "Dự kiến", s: "suggestion", emoji: "⏳" },
        ].map(({ label, s, emoji }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                display: "inline-flex",
                width: 28,
                height: 28,
                borderRadius: "50%",
                fontSize: 12,
                alignItems: "center",
                justifyContent: "center",
                cursor: "default",
              }}
              className={`dl-path-node ${s}`}
            >
              {emoji}
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--es-muted)" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Course detail popup modal */}
      {selectedItem && (
        <CourseDetailModal
          course={selectedItem.course}
          userCourse={selectedItem.userCourse}
          prerequisites={selectedItem.course.prerequisites ?? []}
          allPassedIds={allPassedIds}
          onClose={() => setSelectedItem(null)}
          addCourse={addCourse}
          editCourse={editCourse}
          removeCourse={removeCourse}
        />
      )}
    </div>
  );
}

// ── Course detail / edit popup modal ───────────────────────
interface CourseDetailModalProps {
  course: Course;
  userCourse?: UserCourseWithCourse;
  prerequisites: string[];
  allPassedIds: Set<string>;
  onClose: () => void;
  addCourse?: (input: {
    course_id: string;
    score: number | null;
    semester: string | null;
    status: "completed" | "in_progress" | "exempted" | "failed";
  }) => Promise<void>;
  editCourse?: (
    id: string,
    patch: {
      score: number | null;
      semester: string | null;
      status: "completed" | "in_progress" | "failed" | "exempted";
    }
  ) => Promise<void>;
  removeCourse?: (id: string) => Promise<void>;
}

function CourseDetailModal({
  course,
  userCourse,
  prerequisites,
  allPassedIds,
  onClose,
  addCourse,
  editCourse,
  removeCourse,
}: CourseDetailModalProps) {
  const [status, setStatus] = useState<"completed" | "in_progress" | "exempted" | "failed">(
    userCourse?.status ?? "in_progress"
  );
  const [scoreStr, setScoreStr] = useState(
    userCourse?.score !== null && userCourse?.score !== undefined ? String(userCourse.score) : ""
  );
  const [semester, setSemester] = useState(userCourse?.semester ?? "HK1-2024-2025");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const score = status === "completed" || status === "failed" ? parseFloat(scoreStr) ?? null : null;
      
      if (userCourse) {
        if (editCourse) {
          await editCourse(userCourse.id, { score, semester, status });
        }
      } else {
        if (addCourse) {
          await addCourse({ course_id: course.id, score, semester, status });
        }
      }
      onClose();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Lỗi khi lưu";
      setError(errMsg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!userCourse || !removeCourse) return;
    if (!confirm(`Xóa môn học ${course.name} khỏi lộ trình?`)) return;
    setSaving(true);
    setError(null);
    try {
      await removeCourse(userCourse.id);
      onClose();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Lỗi khi xóa";
      setError(errMsg);
      setSaving(false);
    }
  }

  return (
    <div className="es-logout-overlay" onClick={onClose}>
      <div
        className="es-logout-modal animate-spring-in"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 440, textAlign: "left", width: "100%" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 13, color: "var(--es-muted)", fontFamily: "var(--font-mono), monospace" }}>{course.id}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)", marginTop: 2 }}>{course.name}</div>
          </div>
          <button className="es-btn-ghost" onClick={onClose} style={{ fontSize: 18, padding: 4 }}>✕</button>
        </div>

        {/* Course Info Badges */}
        <div className="dl-modal-badge-row">
          <span className="es-badge es-badge-blue-lt">
            <BookOpen size={12} /> {course.credits} Tín chỉ
          </span>
          <span className="es-badge es-badge-gray">
            {typeLabels[course.course_type] ?? course.course_type}
          </span>
        </div>

        {/* Prerequisites Alerts */}
        {prerequisites.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div className="dl-modal-section-title">Môn tiên quyết</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {prerequisites.map((pId) => {
                const passed = allPassedIds.has(pId);
                return (
                  <div
                    key={pId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 12,
                      padding: "6px 12px",
                      background: passed ? "var(--green-lt)" : "var(--red-lt)",
                      borderRadius: "var(--r-sm)",
                      color: passed ? "var(--green)" : "var(--red)",
                      fontWeight: 600,
                    }}
                  >
                    {passed ? <Check size={14} /> : <AlertTriangle size={14} />}
                    Môn {pId}: {passed ? "Đã đạt" : "Chưa hoàn thành"}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="es-divider" style={{ margin: "14px 0" }} />

        {/* Form Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label className="dl-modal-section-title" style={{ display: "block", marginBottom: 6 }}>Trạng thái</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "completed" | "in_progress" | "exempted" | "failed")}
              className="es-input"
              style={{ width: "100%" }}
            >
              <option value="in_progress">📖 Đang học</option>
              <option value="completed">🎓 Đã đạt (Hoàn thành)</option>
              <option value="failed">❌ Chưa đạt (Rớt)</option>
              <option value="exempted">✨ Miễn học</option>
            </select>
          </div>

          {(status === "completed" || status === "failed") && (
            <div>
              <label className="dl-modal-section-title" style={{ display: "block", marginBottom: 6 }}>Điểm số</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                placeholder="Nhập điểm hệ 10 (ví dụ: 8.5)"
                value={scoreStr}
                onChange={(e) => setScoreStr(e.target.value)}
                className="es-input"
                style={{ width: "100%" }}
              />
            </div>
          )}

          <div>
            <label className="dl-modal-section-title" style={{ display: "block", marginBottom: 6 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Calendar size={12} /> Học kỳ
              </span>
            </label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="es-input"
              style={{ width: "100%" }}
            >
              {DEFAULT_SEMESTERS.map((sem) => {
                const label = parseSemester(sem)?.label ?? sem;
                return (
                  <option key={sem} value={sem}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>

          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--red)", fontSize: 12, marginTop: 4 }}>
              <AlertTriangle size={14} /> {error}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="es-logout-btns" style={{ marginTop: 20 }}>
          {userCourse && (
            <button
              className="es-btn es-btn-ghost"
              onClick={handleDelete}
              disabled={saving}
              style={{ color: "var(--red)", padding: "10px 14px" }}
              title="Xoá học phần này"
            >
              <Trash2 size={16} />
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button className="es-btn es-btn-outline" onClick={onClose} disabled={saving}>
            Hủy
          </button>
          <button
            className="es-btn es-btn-primary"
            onClick={handleSave}
            disabled={saving || ((status === "completed" || status === "failed") && !scoreStr)}
          >
            <Save size={14} /> {saving ? "Đang lưu..." : userCourse ? "Cập nhật" : "Thêm môn"}
          </button>
        </div>
      </div>
    </div>
  );
}
