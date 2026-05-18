"use client";

import { useState } from "react";
import { useCourses } from "@/hooks/use-courses";
import GpaSummary from "@/components/features/course-tracker/gpa-summary";
import CourseList from "@/components/features/course-tracker/course-list";
import AddCourseModal from "@/components/features/course-tracker/add-course-modal";
import ImportFromHtml from "@/components/features/course-tracker/import-from-html";

interface RoadmapPanelProps { userId: string; userEmail: string; }

// Credits targets per type (curriculum constants)
const TARGETS = { general: 30, required: 70, elective: 31 };

export default function RoadmapPanel({ userId, userEmail }: RoadmapPanelProps) {
  const { userCourses, allCourses, loading, error, gpa10, gpa4, passedCredits, addCourse, editCourse, removeCourse, refetch } = useCourses(userId);
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const takenIds = new Set(userCourses.map((c) => c.course_id));

  // Credits breakdown by type (passed only)
  const creditsByType = userCourses
    .filter((c) => c.score !== null && c.score >= 4.0 && c.status === "completed")
    .reduce<Record<string, number>>((acc, c) => {
      const t = c.course.course_type;
      acc[t] = (acc[t] ?? 0) + c.course.credits;
      return acc;
    }, {});

  const progress = [
    { label: "Tín chỉ tích lũy", value: `${passedCredits}/131`, pct: Math.min(100, Math.round((passedCredits / 131) * 100)), cls: "" },
    { label: "Môn đại cương", value: `${creditsByType.general ?? 0}/${TARGETS.general}TC`, pct: Math.min(100, Math.round(((creditsByType.general ?? 0) / TARGETS.general) * 100)), cls: "green" },
    { label: "Môn chuyên ngành", value: `${(creditsByType.required ?? 0) + (creditsByType.elective ?? 0)}/${TARGETS.required + TARGETS.elective}TC`, pct: Math.min(100, Math.round((((creditsByType.required ?? 0) + (creditsByType.elective ?? 0)) / (TARGETS.required + TARGETS.elective)) * 100)), cls: "amber" },
  ];

  if (error) {
    return (
      <>
        <div className="es-topbar">
          <div className="es-topbar-left">
            <div className="es-topbar-title">Lộ trình môn học</div>
          </div>
        </div>
        <div className="es-content">
          <div className="es-alert-strip danger">
            <span>⚠️</span>
            <div className="es-alert-text">{error}</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="es-topbar">
        <div className="es-topbar-left">
          <div className="es-topbar-title">Lộ trình môn học</div>
          <div className="es-topbar-sub">
            {loading ? "Đang tải..." : `${userCourses.length} môn đã nhập · ngành ${userId ? "CNTT" : ""}`}
          </div>
        </div>
        <div className="es-topbar-right">
          {!loading && (
            <span className="es-badge es-badge-green">✓ {passedCredits}/131 TC</span>
          )}
          <button className="es-btn es-btn-outline es-btn-sm" onClick={() => setShowImport(true)}>
            📥 Import từ UIT
          </button>
          <button className="es-btn es-btn-primary es-btn-sm" onClick={() => setShowModal(true)}>
            + Thêm môn
          </button>
        </div>
      </div>

      <div className="es-content">
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 240, color: "var(--es-muted)", fontSize: 14 }}>
            Đang tải dữ liệu...
          </div>
        ) : (
          <div className="es-grid-2" style={{ alignItems: "start" }}>
            {/* Left: course list */}
            <div>
              <CourseList
                userCourses={userCourses}
                onEdit={(id, score, semester) => editCourse(id, { score, semester })}
                onDelete={removeCourse}
                onAddClick={() => setShowModal(true)}
              />
            </div>

            {/* Right: GPA + progress */}
            <div>
              <GpaSummary
                gpa10={gpa10}
                gpa4={gpa4}
                passedCredits={passedCredits}
              />

              <div className="es-card">
                <div className="es-section-hdr">
                  <div className="es-section-title">Tiến độ chương trình</div>
                </div>
                {progress.map((p) => (
                  <div key={p.label} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 13, color: "var(--ink2)" }}>{p.label}</span>
                      <span className="es-mono" style={{ fontSize: 13, fontWeight: 700 }}>{p.value}</span>
                    </div>
                    <div className="es-prog-wrap">
                      <div className={`es-prog-fill${p.cls ? ` ${p.cls}` : ""}`} style={{ width: `${p.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <AddCourseModal
          allCourses={allCourses}
          takenCourseIds={takenIds}
          userId={userId}
          onAdd={addCourse}
          onClose={() => setShowModal(false)}
        />
      )}

      {showImport && (
        <ImportFromHtml
          userId={userId}
          userEmail={userEmail}
          allCourses={allCourses}
          onSuccess={refetch}
          onClose={() => setShowImport(false)}
        />
      )}
    </>
  );
}
