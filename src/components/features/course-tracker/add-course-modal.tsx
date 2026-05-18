"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import type { Course } from "@/types/database";

interface AddCourseModalProps {
  allCourses: Course[];
  takenCourseIds: Set<string>;
  userId: string;
  onAdd: (input: {
    course_id: string;
    score: number | null;
    semester: string | null;
    academic_year: string | null;
    status: "completed" | "in_progress" | "failed";
  }) => Promise<void>;
  onClose: () => void;
}

const STATUS_LABELS = {
  completed: "Đã hoàn thành",
  in_progress: "Đang học",
  failed: "Rớt môn",
} as const;

export default function AddCourseModal({
  allCourses,
  takenCourseIds,
  onAdd,
  onClose,
}: AddCourseModalProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Course | null>(null);
  const [score, setScore] = useState("");
  const [semester, setSemester] = useState("");
  const [status, setStatus] = useState<"completed" | "in_progress" | "failed">("completed");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { searchRef.current?.focus(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allCourses
      .filter((c) => !takenCourseIds.has(c.id))
      .filter(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q) ||
          (c.name_en?.toLowerCase().includes(q) ?? false)
      )
      .slice(0, 8);
  }, [query, allCourses, takenCourseIds]);

  function selectCourse(c: Course) {
    setSelected(c);
    setQuery(c.name);
    setShowDropdown(false);
  }

  function validateAndGetScore(): number | null {
    if (status === "in_progress") return null;
    if (score === "") return null;
    const n = parseFloat(score);
    if (isNaN(n) || n < 0 || n > 10) return null;
    return n;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!selected) { setError("Vui lòng chọn môn học."); return; }

    const parsedScore = validateAndGetScore();
    if (status !== "in_progress" && score !== "" && parsedScore === null) {
      setError("Điểm phải từ 0 đến 10.");
      return;
    }

    const semStr = semester.trim() || null;
    const yearStr = semStr ? semStr.split("-").slice(1).join("-") || null : null;

    setSaving(true);
    try {
      await onAdd({
        course_id: selected.id,
        score: parsedScore,
        semester: semStr,
        academic_year: yearStr,
        status,
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi không xác định.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="es-logout-overlay" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--white)", borderRadius: "var(--r-lg)",
          border: "1px solid var(--es-border)",
          width: 440, maxWidth: "calc(100vw - 32px)",
          padding: "24px 24px 20px",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>Thêm môn học</div>
          <button className="es-btn-ghost" onClick={onClose} style={{ fontSize: 18, lineHeight: 1 }}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Course search */}
          <div style={{ marginBottom: 14, position: "relative" }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink2)", display: "block", marginBottom: 5 }}>
              Môn học *
            </label>
            <input
              ref={searchRef}
              type="text"
              placeholder="Tìm theo tên hoặc mã môn..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelected(null);
                setShowDropdown(true);
              }}
              onFocus={() => query && setShowDropdown(true)}
              className="es-login-input"
              style={{ marginBottom: 0 }}
              autoComplete="off"
            />
            {showDropdown && filtered.length > 0 && (
              <div
                style={{
                  position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                  background: "var(--white)", border: "1px solid var(--es-border)",
                  borderRadius: "var(--r-sm)", boxShadow: "0 4px 16px rgba(0,0,0,.1)",
                  zIndex: 50, maxHeight: 240, overflowY: "auto",
                }}
              >
                {filtered.map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => selectCourse(c)}
                    style={{
                      width: "100%", textAlign: "left", padding: "10px 14px",
                      background: "none", border: "none", cursor: "pointer",
                      borderBottom: "1px solid var(--es-border)", fontFamily: "inherit",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: "var(--es-muted)", marginTop: 1, fontFamily: "var(--font-mono-var), monospace" }}>
                      {c.id} · {c.credits}TC
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink2)", display: "block", marginBottom: 5 }}>
              Tình trạng
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              {(["completed", "in_progress", "failed"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`es-filter-btn${status === s ? " active" : ""}`}
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Score */}
          {status !== "in_progress" && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink2)", display: "block", marginBottom: 5 }}>
                Điểm tổng kết (thang 10)
              </label>
              <input
                type="number"
                min={0} max={10} step={0.1}
                placeholder="VD: 8.5"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="es-login-input"
                style={{ marginBottom: 0 }}
              />
            </div>
          )}

          {/* Semester */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink2)", display: "block", marginBottom: 5 }}>
              Học kỳ <span style={{ fontWeight: 400, color: "var(--es-muted)" }}>(không bắt buộc)</span>
            </label>
            <input
              type="text"
              placeholder="VD: HK1-2023-2024"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="es-login-input"
              style={{ marginBottom: 0 }}
            />
          </div>

          {error && (
            <div className="es-login-error" style={{ marginBottom: 12 }}>{error}</div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" className="es-btn es-btn-outline" onClick={onClose} style={{ flex: 1, justifyContent: "center" }}>
              Huỷ
            </button>
            <button type="submit" className="es-btn es-btn-primary" disabled={saving || !selected} style={{ flex: 1, justifyContent: "center" }}>
              {saving ? "Đang lưu..." : "Thêm môn"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
