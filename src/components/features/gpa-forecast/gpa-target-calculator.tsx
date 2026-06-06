"use client";

import { useState, useMemo } from "react";
import { distributeRequiredScores, GRADE_THRESHOLDS } from "@/lib/gpa-forecast-utils";
import type { UserCourseWithCourse } from "@/types/database";

interface Props {
  completedCourses: UserCourseWithCourse[];
  inProgressCourses: UserCourseWithCourse[];
  currentGPA4: number;
}

function gradeLabel(score: number): string {
  const g = GRADE_THRESHOLDS.find((t) => score >= t.minScore);
  return g?.label ?? "F";
}

function scoreColor(score: number): string {
  if (score > 10) return "var(--duo-red)";
  if (score >= 8.5) return "var(--duo-green)";
  if (score >= 7.0) return "var(--blue)";
  if (score >= 5.5) return "var(--amber)";
  return "var(--duo-red)";
}

export default function GpaTargetCalculator({ completedCourses, inProgressCourses, currentGPA4 }: Props) {
  // Default target = current GPA rounded up to nearest 0.1, capped at 4.0
  const defaultTarget = Math.min(4.0, Math.ceil(currentGPA4 * 10) / 10 + 0.1);
  const [targetGPA4, setTargetGPA4] = useState(
    Math.round(defaultTarget * 20) / 20 // snap to 0.05 grid
  );

  const { requiredAvg, isAlreadyMet, isImpossible, perCourse: distributed } = useMemo(
    () => distributeRequiredScores(targetGPA4, completedCourses, inProgressCourses),
    [targetGPA4, completedCourses, inProgressCourses]
  );

  // Fair per-course CK targets — each course gets its own balanced share, so a
  // weak course no longer shows ">10" while others have headroom to spare.
  const perCourse = useMemo(
    () => distributed.map((d) => ({
      c: d.course,
      ckNeeded: isAlreadyMet || isImpossible ? null : d.requiredCK,
      feasible: d.feasible,
    })),
    [distributed, isAlreadyMet, isImpossible]
  );

  const statusColor = isImpossible ? "var(--duo-red)" : isAlreadyMet ? "var(--duo-green)" : scoreColor(requiredAvg);
  const statusBg   = isImpossible ? "var(--duo-red-lt)" : isAlreadyMet ? "var(--duo-green-lt)" : requiredAvg > 8.5 ? "var(--amber-lt)" : "var(--blue-lt)";

  return (
    <div className="es-card" style={{ marginBottom: 14 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div className="es-section-title">🎯 Tính ngược GPA mục tiêu</div>
          <div className="es-section-sub">Tôi cần đạt GPA bao nhiêu cuối học kỳ?</div>
        </div>
        <div style={{
          fontSize: 22, fontWeight: 800, color: "var(--blue)",
          minWidth: 52, textAlign: "right", fontVariantNumeric: "tabular-nums",
        }}>
          {targetGPA4.toFixed(2)}
        </div>
      </div>

      {/* Slider */}
      <div style={{ marginBottom: 14 }}>
        <input
          type="range" min={2.0} max={4.0} step={0.05}
          value={targetGPA4}
          onChange={(e) => setTargetGPA4(parseFloat(e.target.value))}
          style={{ width: "100%", accentColor: "var(--blue)", cursor: "pointer" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--es-muted)", marginTop: 2 }}>
          <span>2.0 (TB)</span><span>2.5 (Khá)</span><span>3.2 (Giỏi)</span><span>3.6 (XS)</span><span>4.0</span>
        </div>
      </div>

      {/* Result summary */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
        borderRadius: "var(--r)", background: statusBg, marginBottom: 12,
        border: `1px solid ${statusColor}`,
      }}>
        <div style={{ fontSize: 24 }}>
          {isAlreadyMet ? "✅" : isImpossible ? "🚫" : requiredAvg >= 8.5 ? "💪" : "📊"}
        </div>
        <div style={{ flex: 1 }}>
          {isAlreadyMet ? (
            <>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--duo-green)" }}>Đã đạt mục tiêu rồi!</div>
              <div style={{ fontSize: 12, color: "var(--es-muted)" }}>GPA hiện tại ({currentGPA4.toFixed(2)}) đã ≥ {targetGPA4.toFixed(2)}</div>
            </>
          ) : isImpossible ? (
            <>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--duo-red)" }}>Không thể đạt được</div>
              <div style={{ fontSize: 12, color: "var(--es-muted)" }}>Cần điểm trung bình &gt; 10 — hãy điều chỉnh mục tiêu xuống</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 14, fontWeight: 700, color: statusColor }}>
                Cần trung bình{" "}
                <span style={{ fontSize: 18 }}>{requiredAvg.toFixed(2)}</span>
                /10 mỗi môn
                <span style={{ fontSize: 12, fontWeight: 500, marginLeft: 6, color: "var(--es-muted)" }}>
                  (tương đương {gradeLabel(requiredAvg)})
                </span>
              </div>
              <div style={{ fontSize: 12, color: "var(--es-muted)", marginTop: 1 }}>
                Để đạt GPA {targetGPA4.toFixed(2)} sau học kỳ này
              </div>
            </>
          )}
        </div>
      </div>

      {/* Per-course CK requirements */}
      {!isAlreadyMet && !isImpossible && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--es-muted)", marginBottom: 2 }}>Điểm CK cần đạt mỗi môn</div>
          {perCourse.map(({ c, ckNeeded, feasible }) => {
            const ckDisplay = ckNeeded === null ? "—" : !feasible ? ">10 ⚠️" : ckNeeded.toFixed(1);
            const ckColor   = ckNeeded === null ? "var(--es-muted)" : scoreColor(ckNeeded ?? 0);
            return (
              <div key={c.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "7px 10px", borderRadius: "var(--r-sm)",
                background: "var(--es-bg-alt)",
                border: "1px solid var(--es-border)",
                fontSize: 13,
              }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0, flex: 1 }}>
                  <span style={{ fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.course.name}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--es-muted)" }}>{c.course_id} · {c.course.credits} TC</span>
                </div>
                <div style={{
                  fontSize: 16, fontWeight: 800, color: ckColor,
                  flexShrink: 0, marginLeft: 12, minWidth: 36, textAlign: "right",
                }}>
                  {ckDisplay}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
