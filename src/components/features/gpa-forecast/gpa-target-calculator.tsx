"use client";

import { useState } from "react";
import { calculateRequiredCK, GRADE_THRESHOLDS } from "@/lib/gpa-forecast-utils";
import type { UserCourseWithCourse } from "@/types/database";

interface Props {
  inProgressCourses: UserCourseWithCourse[];
}

function gradeLabel(score: number): string {
  const g = GRADE_THRESHOLDS.find((t) => score >= t.minScore);
  return g?.label ?? "F";
}

function scoreColor(score: number): string {
  if (score > 10) return "var(--duo-red)";
  if (score >= 8.0) return "var(--duo-green)";
  if (score >= 6.0) return "var(--blue)";
  if (score >= 5.0) return "var(--amber)";
  return "var(--duo-red)";
}

const SLIDER_LABELS = ["5.0 (C)", "6.0 (B)", "7.0 (B+)", "8.0 (A)", "9.0 (A+)", "10.0"];

export default function GpaTargetCalculator({ inProgressCourses }: Props) {
  const [targetScore, setTargetScore] = useState(7.0);

  const label = gradeLabel(targetScore);
  const labelColor = scoreColor(targetScore);

  return (
    <div className="es-card" style={{ marginBottom: 14 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div className="es-section-title">🎯 Điểm tôi muốn đạt</div>
          <div className="es-section-sub">Cần điểm CK bao nhiêu để đạt mục tiêu?</div>
        </div>
        <div style={{
          fontSize: 22, fontWeight: 800, color: labelColor,
          minWidth: 64, textAlign: "right", fontVariantNumeric: "tabular-nums",
        }}>
          {targetScore.toFixed(1)}
          <span style={{ fontSize: 13, fontWeight: 600, marginLeft: 4 }}>{label}</span>
        </div>
      </div>

      {/* Slider */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="range" min={5.0} max={10.0} step={0.5}
          value={targetScore}
          onChange={(e) => setTargetScore(parseFloat(e.target.value))}
          style={{ width: "100%", accentColor: labelColor, cursor: "pointer" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--es-muted)", marginTop: 2 }}>
          {SLIDER_LABELS.map((l) => <span key={l}>{l}</span>)}
        </div>
      </div>

      {/* Per-course CK requirements */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--es-muted)", marginBottom: 2 }}>
          Điểm CK cần đạt để được <strong style={{ color: labelColor }}>{label} ({targetScore.toFixed(1)}/10)</strong>
        </div>
        {inProgressCourses.map((uc) => {
          const scores = uc.component_scores ?? {};
          const ckEntered = (scores["Cuối kỳ"] ?? null) !== null;
          const ckNeeded = ckEntered ? null : calculateRequiredCK(uc.course, scores, targetScore);

          let ckDisplay: string;
          let ckColor: string;
          if (ckEntered) {
            ckDisplay = "Đã có điểm CK";
            ckColor = "var(--es-muted)";
          } else if (ckNeeded === null) {
            ckDisplay = "—";
            ckColor = "var(--es-muted)";
          } else if (ckNeeded > 10) {
            ckDisplay = "Không thể ⚠️";
            ckColor = "var(--duo-red)";
          } else {
            ckDisplay = `≥ ${ckNeeded.toFixed(1)}`;
            ckColor = scoreColor(ckNeeded);
          }

          return (
            <div key={uc.id} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "7px 10px", borderRadius: "var(--r-sm)",
              background: "var(--es-bg-alt)",
              border: "1px solid var(--es-border)",
              fontSize: 13,
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0, flex: 1 }}>
                <span style={{ fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {uc.course.name}
                </span>
                <span style={{ fontSize: 11, color: "var(--es-muted)" }}>{uc.course_id} · {uc.course.credits} TC</span>
              </div>
              <div style={{
                fontSize: ckEntered ? 11 : 16,
                fontWeight: ckEntered ? 500 : 800,
                color: ckColor,
                flexShrink: 0, marginLeft: 12, textAlign: "right",
              }}>
                {ckDisplay}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
