"use client";

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
  const creditPct = Math.min(100, Math.round((passedCredits / totalRequired) * 100));

  const gpaColor =
    gpa10 >= 8.0 ? "var(--green)" :
    gpa10 >= 6.0 ? "var(--blue)" :
    gpa10 >= 5.0 ? "var(--amber)" :
    gpa10 > 0 ? "var(--red)" : "var(--es-muted)";

  return (
    <div className="es-card" style={{ marginBottom: 14 }}>
      <div className="es-section-hdr">
        <div className="es-section-title">Kết quả học tập</div>
      </div>

      {/* GPA row */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <div className="es-stat-card" style={{ flex: 1 }}>
          <div className="es-stat-label">GPA (thang 10)</div>
          <div className="es-stat-value" style={{ color: gpaColor, fontSize: 28 }}>
            {gpa10 > 0 ? gpa10.toFixed(2) : "—"}
          </div>
        </div>
        <div className="es-stat-card" style={{ flex: 1 }}>
          <div className="es-stat-label">GPA (thang 4)</div>
          <div className="es-stat-value" style={{ color: gpaColor, fontSize: 28 }}>
            {gpa4 > 0 ? gpa4.toFixed(2) : "—"}
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
