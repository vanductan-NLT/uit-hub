"use client";

import { useMemo } from "react";
import type { UserCourseWithCourse } from "@/types/database";
import { calculateRequiredCK, calculatePartialScore } from "@/lib/gpa-forecast-utils";
import DashboardAcademicOverview from "@/components/features/dashboard/dashboard-academic-overview";
import DashboardHeroQuote from "@/components/features/dashboard/dashboard-hero-quote";

interface Props {
  onNav: (panel: string) => void;
  displayName: string;
  avatarUrl?: string;
  loading: boolean;
  gpa4: number;
  passedCredits: number;
  totalCreditsRequired: number;
  inProgressCourses: UserCourseWithCourse[];
  completedCourses: UserCourseWithCourse[];
  nearestExamDays: number | null;
  semester: string | null;
}

function gradeLabel(gpa4: number) {
  if (gpa4 >= 3.6) return "Xuất sắc";
  if (gpa4 >= 3.2) return "Giỏi";
  if (gpa4 >= 2.8) return "Khá";
  if (gpa4 >= 2.0) return "Trung bình";
  return gpa4 > 0 ? "Yếu" : "—";
}

function getInitials(name: string) {
  return name.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function DashboardPanel({
  onNav, displayName, avatarUrl, loading, gpa4, passedCredits, totalCreditsRequired,
  inProgressCourses, completedCourses, nearestExamDays, semester,
}: Props) {
  const dateStr = semester ?? "HK hiện tại";
  const progressPct = totalCreditsRequired > 0 ? Math.round((passedCredits / totalCreditsRequired) * 100) : 0;
  const gradEligible = !loading && gpa4 >= 2.0 && passedCredits >= totalCreditsRequired;

  const riskyCourses = useMemo(() =>
    inProgressCourses
      .map((c) => {
        const scores = c.component_scores ?? {};
        return { c, ckNeeded: calculateRequiredCK(c.course, scores, 7.0), partial: calculatePartialScore(c.course, scores) };
      })
      .filter(({ c, ckNeeded, partial }) => {
        if (!partial) return false;
        const ckEntered = (c.component_scores?.["Cuối kỳ"] ?? null) !== null;
        if (ckEntered) return partial < 5.5;
        return (ckNeeded !== null && ckNeeded > 8.5) || partial < 5.5;
      }),
    [inProgressCourses]
  );
  const riskyCount = riskyCourses.length;

  const quickActions = [
    {
      id: "gpa", icon: "🔮", label: "Dự báo GPA",
      desc: loading ? "…" : riskyCount > 0 ? `⚠️ ${riskyCount} môn cần chú ý` : `GPA ${gpa4.toFixed(2)} · ${gradeLabel(gpa4)}`,
      urgent: riskyCount > 0,
    },
    {
      id: "exam", icon: "📅", label: "Kế hoạch ôn thi",
      desc: loading ? "…" : nearestExamDays === 0 ? "🚨 Thi hôm nay!" : nearestExamDays !== null && nearestExamDays >= 0 ? `Thi gần nhất: ${nearestExamDays} ngày` : "Chưa có lịch thi",
      urgent: nearestExamDays !== null && nearestExamDays >= 0 && nearestExamDays <= 3,
    },
    {
      id: "roadmap", icon: "🗺️", label: "Lộ trình môn học",
      desc: loading ? "…" : `${completedCourses.length} môn hoàn thành · ${progressPct}% lộ trình`,
      urgent: false,
    },
    {
      id: "resources", icon: "📚", label: "Tài nguyên học tập",
      desc: "Slide, đề thi, bài tập theo môn",
      urgent: false,
    },
  ];

  return (
    <>
      <div className="es-topbar">
        <div className="es-topbar-left">
          <div className="es-topbar-title">Dashboard</div>
          <div className="es-topbar-sub">{dateStr}</div>
        </div>
        <div className="es-topbar-right" style={{ gap: 8 }}>
          {!loading && (
            <button
              className={`es-badge ${gradEligible ? "es-badge-green" : "es-badge-amber"}`}
              onClick={() => onNav("profile")}
              style={{ cursor: "pointer", border: "none", fontSize: 12 }}
            >
              {gradEligible ? "🎓 Đủ ĐK TN" : `🎓 ${progressPct}% lộ trình`}
            </button>
          )}
        </div>
      </div>

      <div className="es-content">
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: "var(--es-muted)" }}>
            Đang tải dữ liệu...
          </div>
        ) : (
          <>
            {/* ── 1. Hero: Avatar + Greeting + Quote ── */}
            <DashboardHeroQuote
              displayName={displayName}
              avatarUrl={avatarUrl}
              initials={getInitials(displayName)}
            />

            {/* ── 2. Academic status: GPA + progress + alerts ── */}
            <DashboardAcademicOverview
              gpa4={gpa4}
              passedCredits={passedCredits}
              totalCreditsRequired={totalCreditsRequired}
              completedCourses={completedCourses}
              inProgressCourses={inProgressCourses}
              riskyCourses={riskyCourses}
              nearestExamDays={nearestExamDays}
              onNav={onNav}
            />

            {/* ── 3. Quick actions ── */}
            <div className="es-section-hdr" style={{ marginTop: 18, marginBottom: 10 }}>
              <div className="es-section-title" style={{ fontSize: 13 }}>Hành động nhanh</div>
            </div>
            <div className="es-quick-actions">
              {quickActions.map((a) => (
                <div
                  key={a.id}
                  className="es-quick-action"
                  onClick={() => onNav(a.id)}
                  style={a.urgent ? { border: "1.5px solid var(--amber)", background: "var(--amber-lt)" } : undefined}
                >
                  <div className="es-quick-action-icon">{a.icon}</div>
                  <div className="es-quick-action-name">{a.label}</div>
                  <div className="es-quick-action-desc" style={a.urgent ? { color: "var(--amber)", fontWeight: 600 } : undefined}>{a.desc}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
