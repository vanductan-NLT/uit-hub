"use client";

import { useState, useMemo } from "react";
import { useCourses } from "@/hooks/use-courses";
import GpaSummary from "@/components/features/course-tracker/gpa-summary";
import CourseList from "@/components/features/course-tracker/course-list";
import AddCourseModal from "@/components/features/course-tracker/add-course-modal";
import ImportFromHtml from "@/components/features/course-tracker/import-from-html";
import ImportFromDkhp from "@/components/features/course-tracker/import-from-dkhp";
import CourseSuggestions from "@/components/features/course-tracker/course-suggestions";
import CourseTimeline from "@/components/features/course-tracker/course-timeline";
import {
  buildPassedIds,
  buildTakenIds,
  getSuggestedCourses,
  estimateRemainingTime,
} from "@/lib/course-utils";

interface RoadmapPanelProps { userId: string; userEmail: string; totalCreditsRequired?: number; }

const TARGETS = { general: 30, required: 70, elective: 31 };

export default function RoadmapPanel({ userId, userEmail, totalCreditsRequired = 131 }: RoadmapPanelProps) {
  const { userCourses, allCourses, loading, error, gpa10, gpa4, passedCredits, addCourse, editCourse, removeCourse, refetch } = useCourses(userId);
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showDkhpImport, setShowDkhpImport] = useState(false);
  const [showImportMenu, setShowImportMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<"list" | "timeline">("list");

  const takenIds = useMemo(() => buildTakenIds(userCourses), [userCourses]);
  const passedIds = useMemo(() => buildPassedIds(userCourses), [userCourses]);
  const allCoursesMap = useMemo(() => new Map(allCourses.map((c) => [c.id, c])), [allCourses]);
  const suggestions = useMemo(() => getSuggestedCourses(allCourses, takenIds, passedIds), [allCourses, takenIds, passedIds]);
  const { avgCreditsPerSem, remainingSemesters } = useMemo(
    () => estimateRemainingTime(userCourses, passedCredits),
    [userCourses, passedCredits]
  );

  const creditsByType = userCourses
    .filter((c) => c.score !== null && c.score >= 4.0 && c.status === "completed")
    .reduce<Record<string, number>>((acc, c) => {
      const t = c.course.course_type;
      acc[t] = (acc[t] ?? 0) + c.course.credits;
      return acc;
    }, {});

  const progress = [
    { label: "Tín chỉ tích lũy", value: `${passedCredits}/${totalCreditsRequired}`, pct: Math.min(100, Math.round((passedCredits / totalCreditsRequired) * 100)), cls: "" },
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
            <span className="es-badge es-badge-green">✓ {passedCredits}/{totalCreditsRequired} TC</span>
          )}
          {/* Import dropdown */}
          <div style={{ position: "relative" }}>
            <button
              className="es-btn es-btn-outline es-btn-sm"
              onClick={() => setShowImportMenu((v) => !v)}
            >
              ↓ Import
            </button>
            {showImportMenu && (
              <>
                <div
                  style={{ position: "fixed", inset: 0, zIndex: 49 }}
                  onClick={() => setShowImportMenu(false)}
                />
                <div style={{
                  position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 50,
                  background: "var(--white)", border: "1px solid var(--es-border)",
                  borderRadius: "var(--r)", boxShadow: "0 4px 16px rgba(0,0,0,.1)",
                  minWidth: 210, overflow: "hidden",
                }}>
                  <button
                    style={{ display: "block", width: "100%", padding: "11px 14px", textAlign: "left", fontSize: 13, cursor: "pointer", background: "none", border: "none", fontFamily: "inherit", color: "var(--ink)", borderBottom: "1px solid var(--es-border)" }}
                    onClick={() => { setShowDkhpImport(true); setShowImportMenu(false); }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>📋 Lịch học kỳ này</div>
                    <div style={{ fontSize: 11, color: "var(--es-muted)" }}>Từ trang ĐKHP · student.uit.edu.vn</div>
                  </button>
                  <button
                    style={{ display: "block", width: "100%", padding: "11px 14px", textAlign: "left", fontSize: 13, cursor: "pointer", background: "none", border: "none", fontFamily: "inherit", color: "var(--ink)" }}
                    onClick={() => { setShowImport(true); setShowImportMenu(false); }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>📊 Bảng điểm lịch sử</div>
                    <div style={{ fontSize: 11, color: "var(--es-muted)" }}>Từ DAA · daa.uit.edu.vn</div>
                  </button>
                </div>
              </>
            )}
          </div>
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
          <>
            {/* Tab bar — Google Material underline style */}
            <div style={{ display: "flex", borderBottom: "1px solid var(--es-border)", marginBottom: 20 }}>
              {(["list", "timeline"] as const).map((tab) => {
                const label = tab === "list" ? "Danh sách" : "Lộ trình";
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      padding: "10px 20px", fontSize: 14,
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? "var(--blue)" : "var(--es-muted)",
                      background: "none", border: "none", cursor: "pointer",
                      borderBottom: `2px solid ${isActive ? "var(--blue)" : "transparent"}`,
                      marginBottom: -1, fontFamily: "inherit",
                      transition: "color 0.15s, border-color 0.15s",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {activeTab === "list" ? (
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

                {/* Right: GPA + progress + suggestions */}
                <div>
                  <GpaSummary gpa10={gpa10} gpa4={gpa4} passedCredits={passedCredits} />

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

                    {/* F1: graduation estimate */}
                    {passedCredits >= totalCreditsRequired ? (
                      <div style={{ fontSize: 13, color: "var(--green)", fontWeight: 600, paddingTop: 4 }}>
                        Đủ điều kiện tốt nghiệp 🎓
                      </div>
                    ) : remainingSemesters !== null ? (
                      <div style={{ fontSize: 12, color: "var(--es-muted)", paddingTop: 4 }}>
                        Còn khoảng <strong style={{ color: "var(--ink2)" }}>{remainingSemesters} học kỳ</strong>
                        {" · "}trung bình {avgCreditsPerSem} TC/HK
                      </div>
                    ) : null}
                  </div>

                  <CourseSuggestions suggestions={suggestions} />
                </div>
              </div>
            ) : (
              <CourseTimeline userCourses={userCourses} suggestions={suggestions} />
            )}
          </>
        )}
      </div>

      {showModal && (
        <AddCourseModal
          allCourses={allCourses}
          takenCourseIds={takenIds}
          passedIds={passedIds}
          allCoursesMap={allCoursesMap}
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

      {showDkhpImport && (
        <ImportFromDkhp
          allCourses={allCourses}
          onAdd={addCourse}
          onSuccess={refetch}
          onClose={() => setShowDkhpImport(false)}
        />
      )}
    </>
  );
}
