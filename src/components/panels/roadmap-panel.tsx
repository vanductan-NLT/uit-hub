"use client";

import { useState, useMemo, useEffect } from "react";
import { useCourses } from "@/hooks/use-courses";
import { getUserMilestones } from "@/lib/supabase/milestone-api";
import type { UserMilestone } from "@/types/database";
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
  getFulfilledGroupExclusions,
  estimateRemainingTime,
} from "@/lib/course-utils";
import { useCurriculum } from "@/hooks/use-curriculum";
import EmptyState from "@/components/ui/empty-state";
import ErrorState from "@/components/ui/error-state";

interface RoadmapPanelProps {
  userId: string;
  userEmail: string;
  totalCreditsRequired?: number;
  major?: string | null;
  intakeYear?: number | null;
  curriculumRefreshKey?: number;
}

const TARGETS = { general: 30, required: 70, elective: 31 };

export default function RoadmapPanel({ userId, userEmail, totalCreditsRequired = 131, major, intakeYear, curriculumRefreshKey = 0 }: RoadmapPanelProps) {
  const { userCourses, allCourses, loading, error, gpa10, gpa4, passedCredits, addCourse, editCourse, removeCourse, refetch } = useCourses(userId);
  const { curriculum } = useCurriculum(major, intakeYear, curriculumRefreshKey);
  const [milestones, setMilestones] = useState<UserMilestone[]>([]);
  useEffect(() => { getUserMilestones(userId).then(setMilestones); }, [userId]);
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showDkhpImport, setShowDkhpImport] = useState(false);
  const [showImportMenu, setShowImportMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<"list" | "timeline">("list");

  const takenIds = useMemo(() => buildTakenIds(userCourses), [userCourses]);
  const passedIds = useMemo(() => buildPassedIds(userCourses), [userCourses]);
  const allCoursesMap = useMemo(() => new Map(allCourses.map((c) => [c.id, c])), [allCourses]);
  const curriculumCourseIds = useMemo(
    () => curriculum ? new Set(curriculum.courses.map((c) => c.course_id)) : undefined,
    [curriculum]
  );
  const curriculumSemesterMap = useMemo(() => {
    if (!curriculum) return undefined;
    const m = new Map<string, number>();
    for (const c of curriculum.courses) {
      if (c.suggested_semester !== null) m.set(c.course_id, c.suggested_semester);
    }
    return m;
  }, [curriculum]);
  const milestoneExcludeIds = useMemo(() => {
    const ids = new Set<string>();
    const isMet = (key: string) => milestones.find((m) => m.key === key)?.is_completed ?? false;
    if (isMet("gdqp")) allCourses.filter((c) => c.id.startsWith("ME")).forEach((c) => ids.add(c.id));
    if (isMet("gdtc")) allCourses.filter((c) => c.id.startsWith("PE")).forEach((c) => ids.add(c.id));
    return ids;
  }, [milestones, allCourses]);

  const combinedExcludeIds = useMemo(() => {
    if (!curriculum) return milestoneExcludeIds;
    const passed = userCourses
      .filter((c) => passedIds.has(c.course_id))
      .map((c) => ({ id: c.course_id, credits: c.course.credits }));
    const groupExclude = getFulfilledGroupExclusions(curriculum.courses, passed);
    if (groupExclude.size === 0) return milestoneExcludeIds;
    const merged = new Set(milestoneExcludeIds);
    for (const id of groupExclude) merged.add(id);
    return merged;
  }, [curriculum, userCourses, passedIds, milestoneExcludeIds]);

  const suggestionResult = useMemo(
    () => getSuggestedCourses(allCourses, takenIds, passedIds, curriculumCourseIds, curriculumSemesterMap, combinedExcludeIds),
    [allCourses, takenIds, passedIds, curriculumCourseIds, curriculumSemesterMap, combinedExcludeIds]
  );
  const suggestions = suggestionResult.courses;
  const suggestionReason = suggestionResult.reason;
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
          <ErrorState variant="inline" message={error} onRetry={refetch} />
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
        ) : userCourses.length === 0 ? (
          <EmptyState
            icon="🗺️"
            title="Chưa có dữ liệu lộ trình"
            description="Import bảng điểm hoặc lịch học từ cổng UIT để hệ thống tự động xây dựng lộ trình và gợi ý môn học."
            actionLabel="📋 Tải dữ liệu từ cổng UIT"
            onAction={() => setShowDkhpImport(true)}
            secondary="hoặc kéo file HTML từ DAA · daa.uit.edu.vn"
          />
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

                  <div className="es-card" style={{ marginBottom: 14 }}>
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

                  <CourseSuggestions
                    suggestions={suggestions}
                    reason={suggestionReason}
                    onImport={() => setShowDkhpImport(true)}
                  />
                </div>
              </div>
            ) : (
              <CourseTimeline
                userCourses={userCourses}
                suggestions={suggestions}
                addCourse={addCourse}
                editCourse={editCourse}
                removeCourse={removeCourse}
              />
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
          userId={userId}
          allCourses={allCourses}
          userCourses={userCourses}
          onAdd={addCourse}
          onSuccess={refetch}
          onClose={() => setShowDkhpImport(false)}
        />
      )}
    </>
  );
}
