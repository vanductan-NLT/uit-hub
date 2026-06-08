"use client";

import type { UserCourseWithCourse } from "@/types/database";

interface RiskyCourse {
  c: UserCourseWithCourse;
  ckNeeded: number | null;
}

interface Props {
  gpa4: number;
  passedCredits: number;
  totalCreditsRequired: number;
  completedCourses: UserCourseWithCourse[];
  inProgressCourses: UserCourseWithCourse[];
  riskyCourses: RiskyCourse[];
  nearestExamDays: number | null;
  onNav: (panel: string) => void;
}

const MILESTONES = [
  { label: "Trung bình", from: 0,   target: 2.0, color: "var(--amber)" },
  { label: "Khá",        from: 2.0, target: 2.8, color: "var(--blue)" },
  { label: "Giỏi",       from: 2.8, target: 3.2, color: "var(--blue)" },
  { label: "Xuất sắc",   from: 3.2, target: 3.6, color: "var(--duo-green)" },
];

function gradeInfo(gpa4: number) {
  if (gpa4 >= 3.6) return { label: "Xuất sắc 🏆", color: "var(--duo-green)", bg: "var(--duo-green-lt)" };
  if (gpa4 >= 3.2) return { label: "Giỏi", color: "var(--blue)", bg: "var(--blue-lt)" };
  if (gpa4 >= 2.8) return { label: "Khá", color: "var(--blue)", bg: "var(--blue-lt)" };
  if (gpa4 >= 2.0) return { label: "Trung bình", color: "var(--amber)", bg: "var(--amber-lt)" };
  return { label: gpa4 > 0 ? "Yếu" : "—", color: "var(--red)", bg: "var(--red-lt)" };
}

export default function DashboardAcademicOverview({
  gpa4, passedCredits, totalCreditsRequired,
  completedCourses, inProgressCourses, riskyCourses, nearestExamDays, onNav,
}: Props) {
  const grade = gradeInfo(gpa4);
  const milestone = MILESTONES.find((m) => gpa4 < m.target) ?? null;
  const milestoneProgress = milestone
    ? Math.min(100, Math.round(((gpa4 - milestone.from) / (milestone.target - milestone.from)) * 100))
    : 100;
  const creditPct = totalCreditsRequired > 0 ? Math.round((passedCredits / totalCreditsRequired) * 100) : 0;
  const aGradeCount = completedCourses.filter((c) => c.score !== null && (c.score as number) >= 8.0).length;
  const showExam = nearestExamDays !== null && nearestExamDays >= 0 && nearestExamDays <= 30;
  const examUrgent = nearestExamDays !== null && nearestExamDays <= 3;
  const examColor = examUrgent ? "var(--red)" : nearestExamDays !== null && nearestExamDays! <= 7 ? "var(--amber)" : "var(--blue)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 0 }}>

      {/* ── Row 1: Stat chips ── */}
      <div className="es-dashboard-stats-row" style={{ display: "flex", gap: 10 }}>
        {/* GPA chip */}
        <div
          className="es-card"
          style={{ flex: "0 0 auto", padding: "12px 16px", cursor: "pointer", minWidth: 120 }}
          onClick={() => onNav("gpa")}
        >
          <div style={{ fontSize: 10, color: "var(--es-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>GPA tích lũy</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontSize: 32, fontWeight: 900, color: "var(--ink)", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{gpa4.toFixed(2)}</span>
            <span style={{ fontSize: 12, color: "var(--es-muted)" }}>/4.0</span>
          </div>
          <span style={{ display: "inline-block", marginTop: 6, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: "var(--r-full)", color: grade.color, background: grade.bg }}>
            {grade.label}
          </span>
        </div>

        {/* Credits chip */}
        <div className="es-card" style={{ flex: 1, minWidth: 140, padding: "12px 16px", cursor: "pointer" }} onClick={() => onNav("profile")}>
          <div style={{ fontSize: 10, color: "var(--es-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Tín chỉ tích lũy</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
            <span style={{ fontSize: 26, fontWeight: 900, color: "var(--ink)", lineHeight: 1 }}>{passedCredits}</span>
            <span style={{ fontSize: 12, color: "var(--es-muted)" }}>/ {totalCreditsRequired} TC · {creditPct}%</span>
          </div>
          <div style={{ height: 6, background: "var(--es-border)", borderRadius: "var(--r-full)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${creditPct}%`, background: creditPct >= 100 ? "var(--duo-green)" : "var(--blue)", borderRadius: "var(--r-full)", transition: "width 0.6s ease" }} />
          </div>
        </div>

        {/* Courses chip */}
        <div className="es-card" style={{ flex: "0 0 auto", padding: "12px 16px", minWidth: 110 }}>
          <div style={{ fontSize: 10, color: "var(--es-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Môn học</div>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
            <div>
              <div style={{ fontSize: 26, fontWeight: 900, color: "var(--ink)", lineHeight: 1 }}>{completedCourses.length}</div>
              <div style={{ fontSize: 10, color: "var(--es-muted)", marginTop: 2 }}>hoàn thành</div>
            </div>
            {inProgressCourses.length > 0 && (
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: riskyCourses.length > 0 ? "var(--amber)" : "var(--blue)", lineHeight: 1 }}>{inProgressCourses.length}</div>
                <div style={{ fontSize: 10, color: "var(--es-muted)", marginTop: 2 }}>đang học</div>
              </div>
            )}
            {aGradeCount > 0 && (
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--duo-green)", lineHeight: 1 }}>{aGradeCount}</div>
                <div style={{ fontSize: 10, color: "var(--es-muted)", marginTop: 2 }}>điểm A</div>
              </div>
            )}
          </div>
        </div>

        {/* Exam chip — only when relevant */}
        {showExam && (
          <div className="es-card" style={{ flex: "0 0 auto", padding: "12px 16px", cursor: "pointer", border: `1.5px solid ${examColor}`, minWidth: 110 }} onClick={() => onNav("exam")}>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, color: examColor }}>Kỳ thi gần nhất</div>
            <div style={{ fontSize: 32, fontWeight: 900, lineHeight: 1, color: examColor, fontVariantNumeric: "tabular-nums" }}>
              {nearestExamDays === 0 ? "Hôm nay" : nearestExamDays}
            </div>
            {nearestExamDays !== 0 && <div style={{ fontSize: 11, color: examColor, marginTop: 4 }}>ngày nữa →</div>}
          </div>
        )}
      </div>

      {/* ── Row 2: GPA milestone (only if not maxed) ── */}
      {milestone && (
        <div className="es-card" style={{ padding: "10px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 6 }}>
            <span style={{ color: "var(--es-muted)" }}>Tiến đến <strong style={{ color: "var(--ink)" }}>{milestone.label}</strong></span>
            <span style={{ fontWeight: 700, color: milestone.color }}>còn +{(milestone.target - gpa4).toFixed(2)}</span>
          </div>
          <div style={{ height: 7, background: "var(--es-border)", borderRadius: "var(--r-full)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${milestoneProgress}%`, background: milestone.color, borderRadius: "var(--r-full)", transition: "width 0.6s ease" }} />
          </div>
        </div>
      )}

      {/* ── Row 3: Alert strips — only when needed ── */}
      {riskyCourses.length > 0 && (
        <div className="es-card" style={{ padding: "10px 16px", cursor: "pointer", border: "1.5px solid var(--amber)", background: "var(--amber-lt)" }} onClick={() => onNav("gpa")}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 16 }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>{riskyCourses.length} môn cần chú ý — </span>
              <span style={{ fontSize: 12, color: "var(--amber)" }}>
                {riskyCourses[0].ckNeeded !== null && riskyCourses[0].ckNeeded <= 10
                  ? `${riskyCourses[0].c.course.name}: cần ${riskyCourses[0].ckNeeded.toFixed(1)} điểm CK`
                  : riskyCourses[0].c.course.name}
                {riskyCourses.length > 1 ? ` +${riskyCourses.length - 1} môn khác` : ""}
              </span>
            </div>
            <span style={{ fontSize: 11, color: "var(--es-muted)" }}>Xem dự báo →</span>
          </div>
        </div>
      )}
    </div>
  );
}
