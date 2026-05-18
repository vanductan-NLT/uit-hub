"use client";

import { useState, useMemo, useEffect } from "react";
import { getAllCourses, upsertUserCourse } from "@/lib/supabase/courses-api";
import type { Course } from "@/types/database";

export interface AddedCourse {
  courseId: string;
  courseName: string;
  credits: number;
  score: number | null;
  semester: string;
}

interface OnboardingCourseAdderProps {
  userId: string;
  onCoursesChange: (courses: AddedCourse[]) => void;
}

export default function OnboardingCourseAdder({ userId, onCoursesChange }: OnboardingCourseAdderProps) {
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Course | null>(null);
  const [score, setScore] = useState("");
  const [semester, setSemester] = useState("");
  const [added, setAdded] = useState<AddedCourse[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { getAllCourses().then(setAllCourses).catch(console.error); }, []);

  const takenIds = useMemo(() => new Set(added.map((c) => c.courseId)), [added]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || selected) return [];
    return allCourses
      .filter((c) => !takenIds.has(c.id))
      .filter((c) => c.id.toLowerCase().includes(q) || c.name.toLowerCase().includes(q))
      .slice(0, 6);
  }, [query, allCourses, takenIds, selected]);

  async function handleAdd() {
    if (!selected) return;
    const parsedScore = score ? parseFloat(score) : null;
    if (parsedScore !== null && (isNaN(parsedScore) || parsedScore < 0 || parsedScore > 10)) return;
    setSaving(true);
    try {
      const semStr = semester.trim() || null;
      await upsertUserCourse({
        user_id: userId,
        course_id: selected.id,
        score: parsedScore,
        semester: semStr,
        academic_year: semStr ? semStr.split("-").slice(1).join("-") || null : null,
        status: parsedScore === null ? "in_progress" : "completed",
      });
      const newEntry: AddedCourse = {
        courseId: selected.id,
        courseName: selected.name,
        credits: selected.credits,
        score: parsedScore,
        semester: semStr ?? "",
      };
      const next = [...added, newEntry];
      setAdded(next);
      onCoursesChange(next);
      setSelected(null); setQuery(""); setScore(""); setSemester("");
    } finally { setSaving(false); }
  }

  return (
    <div>
      {/* Search */}
      <div style={{ position: "relative", marginBottom: 8 }}>
        <input
          type="text"
          placeholder="Tìm môn học theo tên hoặc mã..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
          className="es-login-input"
          style={{ marginBottom: 0 }}
          autoComplete="off"
        />
        {filtered.length > 0 && (
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 50,
            background: "var(--white)", border: "1px solid var(--es-border)",
            borderRadius: "var(--r-sm)", boxShadow: "0 4px 12px rgba(0,0,0,.08)",
            maxHeight: 200, overflowY: "auto",
          }}>
            {filtered.map((c) => (
              <button key={c.id} type="button" onClick={() => { setSelected(c); setQuery(c.name); }}
                style={{ width: "100%", textAlign: "left", padding: "9px 14px", background: "none",
                  border: "none", borderBottom: "1px solid var(--es-border)", cursor: "pointer", fontFamily: "inherit" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{c.name}</div>
                <div style={{ fontSize: 11, color: "var(--es-muted)", fontFamily: "monospace" }}>{c.id} · {c.credits}TC</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input type="number" min={0} max={10} step={0.1} placeholder="Điểm (0–10)"
            value={score} onChange={(e) => setScore(e.target.value)}
            className="es-login-input" style={{ flex: 1, marginBottom: 0 }} />
          <input type="text" placeholder="Học kỳ (VD: HK1-2023-2024)"
            value={semester} onChange={(e) => setSemester(e.target.value)}
            className="es-login-input" style={{ flex: 1.5, marginBottom: 0 }} />
          <button type="button" className="es-btn es-btn-primary" onClick={handleAdd} disabled={saving}>
            {saving ? "..." : "+ Thêm"}
          </button>
        </div>
      )}

      {/* Added list */}
      {added.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
          {added.map((c) => (
            <div key={c.courseId} className="es-course-row" style={{ cursor: "default" }}>
              <div className="es-course-dot dot-done" />
              <div style={{ flex: 1 }}>
                <div className="es-course-name">{c.courseName}</div>
                <div className="es-course-credits">{c.courseId} · {c.credits}TC {c.semester && `· ${c.semester}`}</div>
              </div>
              {c.score !== null && (
                <div className="es-grade-pill grade-a">{c.score}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
