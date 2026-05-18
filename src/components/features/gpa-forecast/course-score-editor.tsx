"use client";

import { useState } from "react";
import type { UserCourseWithCourse } from "@/types/database";
import {
  calculatePartialScore,
  calculateRequiredCK,
  getRiskScore,
  GRADE_THRESHOLDS,
} from "@/lib/gpa-forecast-utils";

interface Props {
  course: UserCourseWithCourse;
  onUpdate: (scores: Record<string, number | null>) => Promise<void>;
  onStudyPlan: () => void;
}

function getRiskBadge(riskScore: number, credits: number) {
  // normalize: max possible = 10 × credits
  const ratio = riskScore / (10 * credits);
  if (ratio >= 0.75) return { cls: "es-badge-red",   label: "Nguy hiểm" };
  if (ratio >= 0.5)  return { cls: "es-badge-amber", label: "Cần chú ý" };
  return                    { cls: "es-badge-green",  label: "Ổn định" };
}

function getForecastBadge(requiredCK: number | null) {
  if (requiredCK === null) return null;
  if (requiredCK > 10) return { cls: "es-badge-red",   label: "Khó đạt B" };
  if (requiredCK > 8)  return { cls: "es-badge-amber", label: "Cần cố gắng" };
  return                      { cls: "es-badge-green",  label: "Đang ổn" };
}

export default function CourseScoreEditor({ course, onUpdate, onStudyPlan }: Props) {
  const [scores, setScores] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const comp of course.course.components) {
      const val = course.component_scores?.[comp.name];
      init[comp.name] = val !== null && val !== undefined ? String(val) : "";
    }
    return init;
  });
  const [saving, setSaving] = useState(false);

  const parsedScores: Record<string, number | null> = {};
  for (const comp of course.course.components) {
    const raw = scores[comp.name];
    parsedScores[comp.name] = raw !== "" && !isNaN(Number(raw)) ? Number(raw) : null;
  }

  const partial = calculatePartialScore(course.course, parsedScores);
  const requiredCKforB = calculateRequiredCK(course.course, parsedScores, 7.0);
  const requiredCKforA = calculateRequiredCK(course.course, parsedScores, 8.5);
  const riskScore = getRiskScore({ ...course, component_scores: parsedScores });
  const riskBadge = getRiskBadge(riskScore, course.course.credits);
  const forecastBadge = getForecastBadge(requiredCKforB);
  const isRisky = riskScore / (10 * course.course.credits) >= 0.5;

  async function handleBlur() {
    setSaving(true);
    try {
      await onUpdate(parsedScores);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="es-forecast-card" style={{ flexDirection: "column", gap: 10, padding: "12px 14px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{course.course.name}</span>
          <span style={{ fontSize: 12, color: "var(--es-muted)", marginLeft: 6 }}>
            {course.course.credits}TC
          </span>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {saving && <span style={{ fontSize: 11, color: "var(--es-muted)" }}>Lưu...</span>}
          <span className={`es-badge ${riskBadge.cls}`}>{riskBadge.label}</span>
        </div>
      </div>

      {/* Component score inputs */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {course.course.components.map((comp) => (
          <label key={comp.name} style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 80 }}>
            <span style={{ fontSize: 11, color: "var(--es-muted)", fontWeight: 600 }}>
              {comp.name} <span style={{ fontWeight: 400 }}>({Math.round(comp.weight * 100)}%)</span>
            </span>
            <input
              type="number"
              min={0}
              max={10}
              step={0.1}
              placeholder="—"
              value={scores[comp.name]}
              onChange={(e) => setScores((prev) => ({ ...prev, [comp.name]: e.target.value }))}
              onBlur={handleBlur}
              style={{
                width: 72,
                padding: "4px 8px",
                borderRadius: "var(--r-sm, 6px)",
                border: "1px solid var(--es-border, #e5e7eb)",
                fontSize: 14,
                background: "var(--es-bg, #fff)",
                color: "var(--es-text, #111)",
              }}
            />
          </label>
        ))}
      </div>

      {/* Result row */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", fontSize: 12 }}>
        {partial !== null && (
          <span style={{ color: "var(--es-muted)" }}>
            Điểm hiện tại: <strong style={{ color: "var(--es-text)" }}>{partial.toFixed(2)}</strong>
          </span>
        )}
        {requiredCKforB !== null && (
          <span style={{ color: "var(--es-muted)" }}>
            CK cần để đạt <strong>B</strong>:{" "}
            <strong className={requiredCKforB > 10 ? "score-need" : "score-ok"}>
              {requiredCKforB > 10 ? "Không thể" : `≥ ${requiredCKforB.toFixed(1)}`}
            </strong>
          </span>
        )}
        {requiredCKforA !== null && requiredCKforA <= 10 && (
          <span style={{ color: "var(--es-muted)" }}>
            Đạt <strong>A</strong>: <strong className="score-ok">≥ {requiredCKforA.toFixed(1)}</strong>
          </span>
        )}
        {forecastBadge && <span className={`es-badge ${forecastBadge.cls}`}>{forecastBadge.label}</span>}
        {partial === null && (
          <span style={{ color: "var(--es-muted)", fontStyle: "italic" }}>Nhập điểm để xem dự báo</span>
        )}
      </div>

      {/* CTA for risky courses */}
      {isRisky && (
        <div style={{ marginTop: 2 }}>
          <button className="es-forecast-action" onClick={onStudyPlan}>
            Lên lịch ôn →
          </button>
        </div>
      )}
    </div>
  );
}
