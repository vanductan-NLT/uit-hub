"use client";

import { useState } from "react";
import { calculateRequiredCK, calculatePartialScore } from "@/lib/gpa-forecast-utils";
import type { UserCourseWithCourse } from "@/types/database";

interface Props {
  inProgressCourses: UserCourseWithCourse[];
}

function scoreColor(score: number): string {
  if (score > 10) return "var(--duo-red)";
  if (score >= 8.0) return "var(--duo-green)";
  if (score >= 6.0) return "var(--blue)";
  if (score >= 5.0) return "var(--amber)";
  return "var(--duo-red)";
}

// Status icon + label based on CK needed
function courseStatus(ckNeeded: number | null, ckEntered: boolean): {
  icon: string; color: string; group: "done" | "ok" | "hard" | "impossible";
} {
  if (ckEntered) return { icon: "✅", color: "var(--duo-green)", group: "done" };
  if (ckNeeded === null) return { icon: "—", color: "var(--es-muted)", group: "ok" };
  if (ckNeeded > 10) return { icon: "🚫", color: "var(--duo-red)", group: "impossible" };
  if (ckNeeded <= 7.5) return { icon: "✅", color: "var(--duo-green)", group: "ok" };
  if (ckNeeded <= 9.0) return { icon: "⚡", color: "var(--amber)", group: "hard" };
  return { icon: "⚠️", color: "var(--duo-red)", group: "hard" };
}

const SLIDER_LABELS = ["5.0", "6.0", "7.0", "8.0", "9.0", "10.0"];

export default function GpaTargetCalculator({ inProgressCourses }: Props) {
  const [targetScore, setTargetScore] = useState(7.0);
  const targetColor = scoreColor(targetScore);

  // Compute per-course data
  const courseData = inProgressCourses.map((uc) => {
    const scores = uc.component_scores ?? {};
    const ckEntered = (scores["Cuối kỳ"] ?? null) !== null;
    const ckNeeded = ckEntered ? null : calculateRequiredCK(uc.course, scores, targetScore);
    // Partial score excludng CK (what they've already locked in)
    const partial = calculatePartialScore(uc.course, scores);
    const { icon, color, group } = courseStatus(ckNeeded, ckEntered);

    // CK display
    let ckDisplay: string;
    let ckColor: string;
    if (ckEntered) {
      ckDisplay = "Đã có CK";
      ckColor = "var(--es-muted)";
    } else if (ckNeeded === null) {
      ckDisplay = "—";
      ckColor = "var(--es-muted)";
    } else if (ckNeeded > 10) {
      ckDisplay = "Không thể";
      ckColor = "var(--duo-red)";
    } else {
      ckDisplay = `≥ ${ckNeeded.toFixed(1)}`;
      ckColor = scoreColor(ckNeeded);
    }

    return { uc, ckNeeded, ckEntered, ckDisplay, ckColor, icon, color, group, partial };
  });

  // Group counts for summary chips
  const okCount = courseData.filter((d) => d.group === "ok" || d.group === "done").length;
  const hardCount = courseData.filter((d) => d.group === "hard").length;
  const impossibleCount = courseData.filter((d) => d.group === "impossible").length;

  return (
    <div className="es-card" style={{ marginBottom: 14 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div className="es-section-title">🎯 Điểm tôi muốn đạt</div>
          <div className="es-section-sub">CK cần bao nhiêu để đạt mục tiêu?</div>
        </div>
        <div style={{
          fontSize: 26, fontWeight: 800, color: targetColor,
          minWidth: 56, textAlign: "right", fontVariantNumeric: "tabular-nums",
          lineHeight: 1,
        }}>
          {targetScore.toFixed(1)}
          <div style={{ fontSize: 11, fontWeight: 500, color: "var(--es-muted)", textAlign: "right" }}>/ 10</div>
        </div>
      </div>

      {/* Slider */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="range" min={5.0} max={10.0} step={0.5}
          value={targetScore}
          onChange={(e) => setTargetScore(parseFloat(e.target.value))}
          style={{ width: "100%", accentColor: targetColor, cursor: "pointer" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--es-muted)", marginTop: 2 }}>
          {SLIDER_LABELS.map((l) => <span key={l}>{l}</span>)}
        </div>
      </div>

      {/* Summary chips */}
      {inProgressCourses.length > 0 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
          {okCount > 0 && (
            <span className="es-badge es-badge-green" style={{ fontSize: 11 }}>
              ✅ {okCount} ổn
            </span>
          )}
          {hardCount > 0 && (
            <span className="es-badge es-badge-amber" style={{ fontSize: 11 }}>
              ⚡ {hardCount} cần cố
            </span>
          )}
          {impossibleCount > 0 && (
            <span className="es-badge es-badge-red" style={{ fontSize: 11 }}>
              🚫 {impossibleCount} không thể
            </span>
          )}
        </div>
      )}

      {/* Per-course list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {courseData.map(({ uc, ckDisplay, ckColor, ckEntered, ckNeeded, icon, partial }) => {
          // Progress bar: partial score out of 10 (locked-in portion)
          const partialPct = partial !== null ? Math.min((partial / 10) * 100, 100) : 0;
          const barColor = partial !== null ? scoreColor(partial) : "var(--es-border)";

          return (
            <div key={uc.id} style={{
              padding: "8px 10px",
              borderRadius: "var(--r-sm)",
              background: "var(--es-bg-alt)",
              border: `1px solid ${ckNeeded !== null && ckNeeded > 10 ? "color-mix(in srgb, var(--duo-red) 30%, transparent)" : "var(--es-border)"}`,
              fontSize: 13,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                {/* Status icon */}
                <span style={{ fontSize: 15, flexShrink: 0 }}>{icon}</span>

                {/* Course info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {uc.course.name}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--es-muted)" }}>
                    {uc.course_id} · {uc.course.credits} TC
                    {partial !== null && (
                      <span style={{ marginLeft: 6, color: scoreColor(partial) }}>
                        · Hiện tại: {partial.toFixed(1)}
                      </span>
                    )}
                  </div>
                  {/* Mini progress bar showing locked-in score vs target */}
                  {partial !== null && (
                    <div style={{ marginTop: 4, position: "relative" }}>
                      <div className="es-prog-wrap" style={{ height: 4 }}>
                        <div
                          className="es-prog-fill"
                          style={{ width: `${partialPct}%`, background: barColor, transition: "width 0.3s" }}
                        />
                      </div>
                      {/* Target marker — sits on top of the bar */}
                      <div style={{
                        position: "absolute",
                        left: `${(targetScore / 10) * 100}%`,
                        top: 0, height: 4,
                        width: 2,
                        background: targetColor,
                        opacity: 0.8,
                        transform: "translateX(-50%)",
                        borderRadius: 1,
                        pointerEvents: "none",
                      }} />
                    </div>
                  )}
                </div>

                {/* CK needed */}
                <div style={{
                  fontSize: ckEntered ? 11 : 15,
                  fontWeight: ckEntered ? 500 : 800,
                  color: ckColor,
                  flexShrink: 0, textAlign: "right",
                  minWidth: 60,
                }}>
                  {ckDisplay}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      <div style={{ fontSize: 11, color: "var(--es-muted)", marginTop: 10, display: "flex", gap: 6 }}>
        <span>💡</span>
        <span>Thanh màu = điểm thành phần đã có. Vạch dọc = mục tiêu bạn đặt.</span>
      </div>
    </div>
  );
}
