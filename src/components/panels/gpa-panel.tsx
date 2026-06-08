"use client";

import { useMemo, useState } from "react";
import { useCourses } from "@/hooks/use-courses";
import CourseScoreEditor from "@/components/features/gpa-forecast/course-score-editor";
import GpaTargetCalculator from "@/components/features/gpa-forecast/gpa-target-calculator";
import ImportFromDkhp from "@/components/features/course-tracker/import-from-dkhp";
import ErrorState from "@/components/ui/error-state";
import { sortByRisk, calculateRequiredCK, calculatePartialScore } from "@/lib/gpa-forecast-utils";

interface Props {
  userId: string;
  onNav: (p: string) => void;
}

export default function GpaPanel({ userId, onNav }: Props) {
  const { userCourses, allCourses, loading, error, gpa4, updateComponentScores, addCourse, refetch } = useCourses(userId);
  const [showDkhpImport, setShowDkhpImport] = useState(false);

  const completedCourses = useMemo(
    () => userCourses.filter((c) => c.status === "completed" || c.status === "exempted"),
    [userCourses]
  );
  const inProgressCourses = useMemo(
    () => userCourses.filter((c) => c.status === "in_progress"),
    [userCourses]
  );
  const sortedInProgress = useMemo(() => sortByRisk(inProgressCourses), [inProgressCourses]);

  const riskyCount = useMemo(
    () =>
      inProgressCourses.filter((c) => {
        const scores = c.component_scores ?? {};
        const ck = calculateRequiredCK(c.course, scores, 7.0);
        const partial = calculatePartialScore(c.course, scores);
        if (!partial) return false;
        const ckEntered = (scores["Cuối kỳ"] ?? null) !== null;
        if (ckEntered) return partial < 5.5;
        return (ck !== null && ck > 8.5) || partial < 5.5;
      }).length,
    [inProgressCourses]
  );

  if (loading) {
    return (
      <div className="es-content" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
        <span style={{ color: "var(--es-muted)" }}>Đang tải...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="es-content">
        <ErrorState variant="inline" message={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <>
      <div className="es-topbar">
        <div className="es-topbar-left">
          <div className="es-topbar-title">Dự báo GPA</div>
          <div className="es-topbar-sub">
            {inProgressCourses.length > 0
              ? `${inProgressCourses[0].semester ?? "HK hiện tại"} · Dựa trên điểm thành phần đã có`
              : "Dựa trên điểm thành phần đã có"}
          </div>
        </div>
        <div className="es-topbar-right">
          {riskyCount > 0 && (
            <span className="es-badge es-badge-amber">⚠️ {riskyCount} môn cần chú ý</span>
          )}
        </div>
      </div>

      <div className="es-content">
        {inProgressCourses.length === 0 ? (
          <div className="es-card" style={{ textAlign: "center", padding: 40, color: "var(--es-muted)" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📝</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Chưa có môn đang học</div>
            <div style={{ fontSize: 13, marginBottom: 20 }}>
              Tải danh sách môn học kỳ này từ cổng thông tin UIT để bắt đầu dự báo GPA.
            </div>
            <button
              className="es-btn es-btn-primary"
              onClick={() => setShowDkhpImport(true)}
              style={{ margin: "0 auto" }}
            >
              📋 Tải môn đang học
            </button>
            <div style={{ fontSize: 12, marginTop: 12, color: "var(--es-muted)" }}>
              hoặc thêm thủ công ở trang <button onClick={() => onNav("roadmap")} style={{ background: "none", border: "none", padding: 0, color: "var(--blue)", cursor: "pointer", fontSize: 12 }}>Lộ trình</button>
            </div>
          </div>
        ) : (
          <div className="es-grid-2" style={{ alignItems: "start" }}>
            {/* Left: GPA summary + risky alerts */}
            <div>
              <div className="es-card" style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--es-muted)" }}>GPA tích lũy hiện tại</span>
                  <span className={`es-badge ${gpa4 >= 3.2 ? "es-badge-green" : gpa4 >= 2.8 ? "es-badge-amber" : "es-badge-red"}`}>
                    {gpa4 >= 3.6 ? "Xuất sắc" : gpa4 >= 3.2 ? "Giỏi" : gpa4 >= 2.8 ? "Khá" : gpa4 >= 2.0 ? "Trung bình" : "Yếu"}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginBottom: 4 }}>
                  <div className="es-gpa-number">{gpa4.toFixed(2)}</div>
                  <div className="es-gpa-max">/4.0</div>
                </div>
                <div>
                  <div className="es-prog-wrap" style={{ height: 8 }}>
                    <div className="es-prog-fill green" style={{ width: `${(gpa4 / 4) * 100}%` }} />
                  </div>
                </div>
              </div>

              {/* Score editors per course — fills the left column under the summary */}
              <div className="es-card">
                <div className="es-section-hdr">
                  <div>
                    <div className="es-section-title">Nhập điểm thành phần</div>
                    <div className="es-section-sub">Cập nhật để dự báo chính xác hơn · Lưu tự động</div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                  {sortedInProgress.map((c) => (
                    <CourseScoreEditor
                      key={c.id}
                      course={c}
                      onUpdate={(scores) => updateComponentScores(c.id, scores)}
                      onStudyPlan={() => onNav("exam")}
                    />
                  ))}
                </div>
                <div className="es-divider" />
                <div style={{ fontSize: 12, color: "var(--es-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                  <span>💡</span>
                  <span>Trọng số từng thành phần theo quy định môn học. Nhập xong từng ô → tự lưu.</span>
                </div>
              </div>
            </div>

            {/* Right: target slider (reverse GPA) — slider lives here on the right */}
            <div>
              <GpaTargetCalculator
                inProgressCourses={inProgressCourses}
              />
            </div>
          </div>
        )}
      </div>

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
