"use client";

import { useMemo, useState } from "react";
import { useCourses } from "@/hooks/use-courses";
import CourseScoreEditor from "@/components/features/gpa-forecast/course-score-editor";
import ImportFromDkhp from "@/components/features/course-tracker/import-from-dkhp";
import ErrorState from "@/components/ui/error-state";
import {
  forecastCumulativeGPA4,
  sortByRisk,
  calculateRequiredCK,
  calculatePartialScore,
} from "@/lib/gpa-forecast-utils";

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

  const forecastGPA4 = useMemo(
    () => forecastCumulativeGPA4(completedCourses, inProgressCourses),
    [completedCourses, inProgressCourses]
  );

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

  const delta = (forecastGPA4 - gpa4).toFixed(2);
  const deltaPositive = forecastGPA4 >= gpa4;

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
                <div style={{ marginBottom: 12 }}>
                  <div className="es-prog-wrap" style={{ height: 8 }}>
                    <div className="es-prog-fill green" style={{ width: `${(gpa4 / 4) * 100}%` }} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[
                    { label: "Dự báo cuối HK", val: forecastGPA4.toFixed(2), bg: "var(--green-lt)", color: "var(--green)" },
                    { label: "Thay đổi", val: `${deltaPositive ? "+" : ""}${delta}`, bg: deltaPositive ? "var(--blue-lt)" : "var(--amber-lt)", color: deltaPositive ? "var(--blue)" : "var(--amber)" },
                    { label: "Cần cải thiện", val: `+${Math.max(0, 3.6 - forecastGPA4).toFixed(2)}`, bg: "var(--amber-lt)", color: "var(--amber)" },
                  ].map((item, i) => (
                    <div key={item.label} className={`animate-spring-in stagger-${i + 1}`} style={{ flex: 1, textAlign: "center", padding: 8, background: item.bg, borderRadius: "var(--r-sm)" }}>
                      <div style={{ fontSize: 11, color: item.color, fontWeight: 600 }}>{item.label}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: item.color }}>{item.val}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risky course alerts */}
              {sortedInProgress.map((c) => {
                const scores = c.component_scores ?? {};
                const partial = calculatePartialScore(c.course, scores);
                const ckEntered = (scores["Cuối kỳ"] ?? null) !== null;
                const ckForB = ckEntered ? null : calculateRequiredCK(c.course, scores, 7.0);
                const isOk = ckEntered
                  ? (partial !== null && partial >= 5.5)
                  : (ckForB !== null && ckForB <= 7.5);
                return (
                  <div key={c.id} className={`es-forecast-card ${isOk ? "ok" : ckEntered ? "danger" : "warn"}`}>
                    <div className="es-forecast-icon">{isOk ? "✅" : ckEntered ? "🚨" : "⚡"}</div>
                    <div style={{ flex: 1 }}>
                      <div className="es-forecast-title">
                        {c.course.name}
                        {!ckEntered && ckForB !== null && !isOk && ` — Cần ${ckForB > 10 ? "điểm không khả thi" : `≥ ${ckForB.toFixed(1)}`} ở cuối kỳ để đạt B`}
                        {ckEntered && !isOk && partial !== null && ` — Điểm cuối: ${partial.toFixed(2)} (dưới C)`}
                        {isOk && " — Đang đúng hướng"}
                      </div>
                      <div className="es-forecast-desc">
                        {Object.entries(scores)
                          .filter(([, v]) => v !== null)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(" · ")}
                        {partial !== null && ` · Điểm hiện tại: ${partial.toFixed(2)}`}
                      </div>
                    </div>
                    {!isOk && !ckEntered && (
                      <button className="es-forecast-action" onClick={() => onNav("exam")}>
                        Lên lịch ôn →
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Right: score editors per course */}
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
        )}
      </div>

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
