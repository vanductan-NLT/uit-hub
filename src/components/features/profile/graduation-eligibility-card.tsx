"use client";

import { useState, useEffect, useMemo } from "react";
import { getUserMilestones, upsertMilestone } from "@/lib/supabase/milestone-api";
import type { UserCourseWithCourse, UserMilestone } from "@/types/database";
import type { CurriculumWithDetails } from "@/lib/data/curriculum-registry";

interface Props {
  userId: string;
  userCourses: UserCourseWithCourse[];
  gpa4: number;
  curriculum: CurriculumWithDetails | null;
  totalCreditsRequired: number;
}

interface CreditBreakdown {
  general: { passed: number; required: number | null };
  foundation: { passed: number; required: number | null };
  required: { passed: number; required: number | null };
  elective: { passed: number; required: number | null };
  total: { passed: number; required: number };
}

function CheckRow({ ok, label, detail }: { ok: boolean; label: string; detail?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: "1px solid var(--es-border)", fontSize: 13 }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>{ok ? "✅" : "❌"}</span>
      <div style={{ flex: 1 }}>
        <span style={{ fontWeight: 600, color: ok ? "var(--ink)" : "var(--duo-red)" }}>{label}</span>
        {detail && <span style={{ marginLeft: 6, color: "var(--es-muted)", fontSize: 12 }}>{detail}</span>}
      </div>
    </div>
  );
}

export default function GraduationEligibilityCard({ userId, userCourses, gpa4, curriculum, totalCreditsRequired }: Props) {
  const [milestones, setMilestones] = useState<UserMilestone[]>([]);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    getUserMilestones(userId).then(setMilestones);
  }, [userId]);

  function isMet(key: string): boolean {
    return milestones.find((m) => m.key === key)?.is_completed ?? false;
  }

  async function toggleMilestone(key: string) {
    const next = !isMet(key);
    setSaving(key);
    // Optimistic update
    setMilestones((prev) => {
      const existing = prev.find((m) => m.key === key);
      if (existing) return prev.map((m) => m.key === key ? { ...m, is_completed: next } : m);
      return [...prev, { user_id: userId, key, is_completed: next, value: null, note: null, updated_at: new Date().toISOString() }];
    });
    await upsertMilestone(userId, key, next);
    setSaving(null);
  }

  // Credit breakdown by requirement_type
  const breakdown = useMemo<CreditBreakdown>(() => {
    const passedCourses = userCourses.filter(
      (c) => c.status === "exempted" || (c.status === "completed" && c.score !== null && c.score >= 4.0)
    );
    const counts = { general: 0, foundation: 0, required: 0, elective: 0 };
    for (const uc of passedCourses) {
      const cc = curriculum?.courses.find((c) => c.course_id === uc.course_id);
      if (cc) counts[cc.requirement_type] += uc.course.credits;
    }
    const totalPassed = passedCourses.reduce((s, c) => s + c.course.credits, 0);
    return {
      general:    { passed: counts.general,    required: curriculum?.general_credits ?? null },
      foundation: { passed: counts.foundation,  required: curriculum?.foundation_credits ?? null },
      required:   { passed: counts.required,    required: curriculum?.major_required_credits ?? null },
      elective:   { passed: counts.elective,    required: curriculum?.major_elective_credits ?? null },
      total:      { passed: totalPassed,         required: totalCreditsRequired },
    };
  }, [userCourses, curriculum, totalCreditsRequired]);

  // GPA requirement from graduation_requirements, fallback 2.0
  const gpaReq = curriculum?.graduation_requirements.find((r) => r.key === "gpa_min")?.threshold_value ?? 2.0;

  const checks = {
    totalCredits: breakdown.total.passed >= breakdown.total.required,
    general:      breakdown.general.required === null || breakdown.general.passed >= breakdown.general.required,
    foundation:   breakdown.foundation.required === null || breakdown.foundation.passed >= breakdown.foundation.required,
    required:     breakdown.required.required === null || breakdown.required.passed >= breakdown.required.required,
    elective:     breakdown.elective.required === null || breakdown.elective.passed >= breakdown.elective.required,
    gpa:          gpa4 >= gpaReq,
    english:      isMet("english"),
    gdqp:         isMet("gdqp"),
    gdtc:         isMet("gdtc"),
  };

  const allMet = Object.values(checks).every(Boolean);
  const failCount = Object.values(checks).filter((v) => !v).length;

  const softKeys = [
    { key: "english", label: "Tiếng Anh (TOEIC 450+)" },
    { key: "gdqp",    label: "Giáo dục quốc phòng" },
    { key: "gdtc",    label: "Giáo dục thể chất" },
  ];

  const creditRows: { label: string; passed: number; required: number | null; ok: boolean }[] = [
    { label: "Đại cương",      ...breakdown.general,    ok: checks.general },
    { label: "Cơ sở ngành",    ...breakdown.foundation, ok: checks.foundation },
    { label: "Chuyên ngành",   ...breakdown.required,   ok: checks.required },
    { label: "Tự chọn",        ...breakdown.elective,   ok: checks.elective },
  ].filter((r) => r.required !== null);

  return (
    <div className="es-card" style={{ marginBottom: 14 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div className="es-section-title">🎓 Điều kiện tốt nghiệp</div>
          <div style={{ fontSize: 12, color: "var(--es-muted)", marginTop: 2 }}>
            {curriculum ? `${curriculum.major} · K${String(curriculum.intake_year_from).slice(-2)}` : "Chưa liên kết CTĐT"}
          </div>
        </div>
        <div style={{
          padding: "4px 12px", borderRadius: "var(--r-full)", fontSize: 12, fontWeight: 700,
          background: allMet ? "var(--duo-green-lt, #f0fdf4)" : "var(--amber-lt)",
          color: allMet ? "var(--duo-green)" : "var(--amber)",
        }}>
          {allMet ? "✅ Đủ điều kiện" : `⚠️ Còn ${failCount} tiêu chí`}
        </div>
      </div>

      {/* Total credits + GPA */}
      <CheckRow
        ok={checks.totalCredits}
        label={`Tổng tín chỉ: ${breakdown.total.passed}/${breakdown.total.required} TC`}
        detail={checks.totalCredits ? undefined : `còn thiếu ${breakdown.total.required - breakdown.total.passed} TC`}
      />
      <CheckRow
        ok={checks.gpa}
        label={`GPA: ${gpa4.toFixed(2)}/4.0`}
        detail={`tối thiểu ${gpaReq.toFixed(1)}`}
      />

      {/* Credit breakdown by type (only if curriculum loaded) */}
      {creditRows.length > 0 && (
        <div style={{ paddingLeft: 26, marginBottom: 4 }}>
          {creditRows.map((row) => (
            <div key={row.label} style={{
              display: "flex", justifyContent: "space-between", padding: "5px 0",
              borderBottom: "1px solid var(--es-border)", fontSize: 12,
            }}>
              <span style={{ color: "var(--es-muted)" }}>{row.label}</span>
              <span style={{ fontWeight: 600, color: row.ok ? "var(--ink)" : "var(--duo-red)" }}>
                {row.passed}/{row.required} TC {row.ok ? "✓" : "✗"}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Soft requirements — toggleable checkboxes */}
      <div style={{ marginTop: 8 }}>
        {softKeys.map(({ key, label }) => (
          <div key={key} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "7px 0", borderBottom: "1px solid var(--es-border)", fontSize: 13,
          }}>
            <input
              type="checkbox"
              checked={isMet(key)}
              onChange={() => toggleMilestone(key)}
              disabled={saving === key}
              style={{ width: 16, height: 16, accentColor: "var(--blue)", cursor: "pointer", flexShrink: 0 }}
            />
            <span style={{
              fontWeight: 600,
              color: isMet(key) ? "var(--ink)" : "var(--es-muted)",
              textDecoration: isMet(key) ? "none" : "none",
            }}>
              {label}
            </span>
            {saving === key && <span style={{ fontSize: 11, color: "var(--es-muted)" }}>Đang lưu...</span>}
          </div>
        ))}
      </div>

      {!curriculum && (
        <div style={{ fontSize: 12, color: "var(--es-muted)", marginTop: 10, textAlign: "center" }}>
          Import CTĐT để xem chi tiết tín chỉ theo loại
        </div>
      )}
    </div>
  );
}
