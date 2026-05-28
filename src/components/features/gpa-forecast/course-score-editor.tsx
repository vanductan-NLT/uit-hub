"use client";

import { useState } from "react";
import type { UserCourseWithCourse } from "@/types/database";
import {
  calculatePartialScore,
  calculateRequiredCK,
  getRiskScore,
} from "@/lib/gpa-forecast-utils";
import { validateScore } from "@/lib/validation-utils";

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

// Fixed 4 columns always displayed in this order
const STANDARD_COLS = [
  { key: "QT", name: "Quá trình" },
  { key: "GK", name: "Giữa kỳ" },
  { key: "TH", name: "Thực hành" },
  { key: "CK", name: "Cuối kỳ" },
] as const;

export default function CourseScoreEditor({ course, onUpdate, onStudyPlan }: Props) {
  // Build a weight map from course components for quick lookup
  const weightMap = new Map(course.course.components.map((c) => [c.name, c.weight]));

  const [scores, setScores] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const col of STANDARD_COLS) {
      const val = course.component_scores?.[col.name];
      init[col.name] = val !== null && val !== undefined ? String(val) : "";
    }
    return init;
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  // Parse all 4 columns — GPA calc ignores weight=0 cols naturally
  const parsedScores: Record<string, number | null> = {};
  for (const col of STANDARD_COLS) {
    const raw = scores[col.name];
    parsedScores[col.name] = raw !== "" && !isNaN(Number(raw)) ? Number(raw) : null;
  }

  const partial = calculatePartialScore(course.course, parsedScores);
  const ckEntered = parsedScores["Cuối kỳ"] !== null;
  const requiredCKforB = ckEntered ? null : calculateRequiredCK(course.course, parsedScores, 7.0);
  const requiredCKforA = ckEntered ? null : calculateRequiredCK(course.course, parsedScores, 8.5);
  const riskScore = getRiskScore({ ...course, component_scores: parsedScores });
  const riskBadge = getRiskBadge(riskScore, course.course.credits);
  const forecastBadge = getForecastBadge(requiredCKforB);
  const isRisky = !ckEntered && riskScore / (10 * course.course.credits) >= 0.5;

  function handleChange(name: string, raw: string) {
    setScores((prev) => ({ ...prev, [name]: raw }));
    setErrors((prev) => ({ ...prev, [name]: validateScore(raw).error }));
  }

  async function handleBlur() {
    // Don't persist if any field is invalid
    const hasError = STANDARD_COLS.some((col) => !validateScore(scores[col.name]).valid);
    if (hasError) return;
    setSaving(true);
    try {
      await onUpdate(parsedScores);
    } finally {
      setSaving(false);
    }
  }

  // If partial score is already low (< 5.5), force danger regardless of badge
  const cardCls = (partial !== null && partial < 5.5) ? "danger"
    : riskBadge.cls === "es-badge-red" ? "danger"
    : riskBadge.cls === "es-badge-amber" ? "warn"
    : "ok";

  return (
    <div className={`es-forecast-card ${cardCls}`} style={{ flexDirection: "column", gap: 10, padding: "12px 14px" }}>
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

      {/* Component score inputs — always show all 4 cols, dim unused ones */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {STANDARD_COLS.map((col) => {
          const weight = weightMap.get(col.name) ?? 0;
          const active = weight > 0;
          const fieldError = errors[col.name];
          return (
            <label key={col.name} style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 72, opacity: active ? 1 : 0.38 }}>
              <span style={{ fontSize: 11, color: "var(--es-muted)", fontWeight: 600 }}>
                {col.key}{" "}
                <span style={{ fontWeight: 400 }}>
                  {active ? `(${Math.round(weight * 100)}%)` : "(—)"}
                </span>
              </span>
              <input
                type="number"
                min={0}
                max={10}
                step={0.1}
                placeholder="—"
                value={scores[col.name]}
                onChange={(e) => handleChange(col.name, e.target.value)}
                onBlur={handleBlur}
                style={{
                  width: 68,
                  padding: "4px 8px",
                  borderRadius: "var(--r-sm, 6px)",
                  border: `1px solid ${fieldError ? "var(--red)" : "var(--es-border, #e5e7eb)"}`,
                  fontSize: 14,
                  background: active ? "var(--white)" : "var(--es-bg-alt)",
                  color: "var(--ink)",
                }}
              />
              {fieldError && (
                <span style={{ fontSize: 10, color: "var(--red)" }}>{fieldError}</span>
              )}
            </label>
          );
        })}
      </div>

      {/* Result row */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", fontSize: 12 }}>
        {partial === null ? (
          <span style={{ color: "var(--es-muted)", fontStyle: "italic" }}>Nhập điểm để xem dự báo</span>
        ) : (
          <>
            <span style={{ color: "var(--es-muted)" }}>
              Điểm hiện tại: <strong style={{ color: "var(--es-text)" }}>{partial.toFixed(2)}</strong>
            </span>
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
          </>
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
