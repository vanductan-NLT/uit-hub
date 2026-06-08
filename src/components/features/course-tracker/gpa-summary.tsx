"use client";

import { useState } from "react";

interface GpaSummaryProps {
  gpa10: number;
  gpa4: number;
  passedCredits: number;
  totalRequired?: number;
}

export default function GpaSummary({
  gpa10,
  gpa4,
  passedCredits,
  totalRequired = 131,
}: GpaSummaryProps) {
  const [gpaScale, setGpaScale] = useState<4 | 10>(4);
  const creditPct = Math.min(100, Math.round((passedCredits / totalRequired) * 100));

  const gpaColor =
    gpa10 >= 8.0 ? "var(--green)" :
    gpa10 >= 6.0 ? "var(--blue)" :
    gpa10 >= 5.0 ? "var(--amber)" :
    gpa10 > 0 ? "var(--red)" : "var(--es-muted)";

  const displayVal = gpaScale === 4
    ? (gpa4 > 0 ? gpa4.toFixed(2) : "—")
    : (gpa10 > 0 ? gpa10.toFixed(2) : "—");

  return (
    <div className="es-card" style={{ marginBottom: 14 }}>
      <div className="es-section-hdr">
        <div className="es-section-title">Kết quả học tập</div>
      </div>

      {/* GPA row — single togglable value */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "stretch" }}>
        <div className="es-stat-card" style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span className="es-stat-label" style={{ margin: 0 }}>GPA</span>
            {/* Scale toggle */}
            <div style={{ display: "flex", background: "var(--es-border)", borderRadius: "var(--r-full)", padding: 2 }}>
              {([4, 10] as const).map((scale) => (
                <button
                  key={scale}
                  onClick={() => setGpaScale(scale)}
                  style={{
                    fontSize: 10, fontWeight: 700, padding: "2px 7px",
                    borderRadius: "var(--r-full)", border: "none", cursor: "pointer",
                    background: gpaScale === scale ? "var(--blue)" : "transparent",
                    color: gpaScale === scale ? "#fff" : "var(--es-muted)",
                    transition: "background 0.15s, color 0.15s",
                  }}
                >
                  /{scale}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span className="es-stat-value" style={{ color: gpaColor, fontSize: 28 }}>{displayVal}</span>
            <span style={{ fontSize: 13, color: "var(--es-muted)" }}>/ {gpaScale}</span>
          </div>
        </div>
      </div>

      {/* Credits progress */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ fontSize: 13, color: "var(--ink2)" }}>Tín chỉ tích lũy</span>
          <span
            className="es-mono"
            style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}
          >
            {passedCredits}/{totalRequired}
          </span>
        </div>
        <div className="es-prog-wrap">
          <div
            className={`es-prog-fill${creditPct >= 70 ? " green" : creditPct >= 40 ? "" : " amber"}`}
            style={{ width: `${creditPct}%` }}
          />
        </div>
        <div style={{ fontSize: 11, color: "var(--es-muted)", marginTop: 4 }}>
          {creditPct}% chương trình · còn {totalRequired - passedCredits} TC
        </div>
      </div>
    </div>
  );
}
