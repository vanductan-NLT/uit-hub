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

/** Compact criteria chip */
function CriteriaChip({ ok, label, value }: { ok: boolean; label: string; value: string }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
      padding: "8px 12px", borderRadius: "var(--r-sm)", minWidth: 80, flex: 1,
      background: ok ? "var(--duo-green-lt, #f0fdf4)" : "var(--red-lt, #fff1f0)",
      border: `1px solid ${ok ? "var(--duo-green)" : "var(--duo-red)"}22`,
    }}>
      <span style={{ fontSize: 11, color: "var(--es-muted)", fontWeight: 600, whiteSpace: "nowrap" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: ok ? "var(--duo-green)" : "var(--duo-red)" }}>
        {ok ? "✓" : "✗"} {value}
      </span>
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
    setMilestones((prev) => {
      const existing = prev.find((m) => m.key === key);
      if (existing) return prev.map((m) => m.key === key ? { ...m, is_completed: next } : m);
      return [...prev, { user_id: userId, key, is_completed: next, value: null, note: null, updated_at: new Date().toISOString() }];
    });
    await upsertMilestone(userId, key, next);
    setSaving(null);
  }

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
    { key: "gdqp",    label: "GDQP" },
    { key: "gdtc",    label: "GDTC" },
  ];

  const creditChips = [
    { label: "Đại cương",  ok: checks.general,    bd: breakdown.general },
    { label: "Cơ sở ngành", ok: checks.foundation, bd: breakdown.foundation },
    { label: "Chuyên ngành", ok: checks.required,   bd: breakdown.required },
    { label: "Tự chọn",    ok: checks.elective,   bd: breakdown.elective },
  ].filter((c) => c.bd.required !== null);

  return (
    <div className="es-card" style={{ marginBottom: 14 }}>
      {/* Row 1: Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>🎓 Điều kiện tốt nghiệp</span>
          {curriculum && (
            <span style={{ fontSize: 12, color: "var(--es-muted)", background: "var(--es-bg-alt, #f8f9fa)", padding: "2px 8px", borderRadius: "var(--r-full)" }}>
              {curriculum.major} · K{String(curriculum.intake_year_from).slice(-2)}
            </span>
          )}
        </div>
        <div style={{
          padding: "4px 12px", borderRadius: "var(--r-full)", fontSize: 12, fontWeight: 700,
          background: allMet ? "var(--duo-green-lt, #f0fdf4)" : "var(--amber-lt)",
          color: allMet ? "var(--duo-green)" : "var(--amber)",
        }}>
          {allMet ? "✅ Đủ điều kiện" : `⚠️ Còn ${failCount} tiêu chí`}
        </div>
      </div>

      {/* Row 2: Criteria chips — Total TC + GPA + credit breakdown */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <CriteriaChip
          ok={checks.totalCredits}
          label="Tổng TC"
          value={`${breakdown.total.passed}/${breakdown.total.required}`}
        />
        <CriteriaChip
          ok={checks.gpa}
          label={`GPA (≥${gpaReq.toFixed(1)})`}
          value={gpa4.toFixed(2)}
        />
        {creditChips.map((c) => (
          <CriteriaChip
            key={c.label}
            ok={c.ok}
            label={c.label}
            value={`${c.bd.passed}/${c.bd.required} TC`}
          />
        ))}
      </div>

      {/* Row 3: Soft requirements — inline checkboxes */}
      <div style={{ display: "flex", gap: 20, marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--es-border)", flexWrap: "wrap" }}>
        {softKeys.map(({ key, label }) => (
          <label key={key} style={{
            display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
            fontSize: 13, fontWeight: 600,
            color: isMet(key) ? "var(--ink)" : "var(--es-muted)",
            opacity: saving === key ? 0.6 : 1,
          }}>
            <input
              type="checkbox"
              checked={isMet(key)}
              onChange={() => toggleMilestone(key)}
              disabled={saving === key}
              style={{ width: 15, height: 15, accentColor: "var(--blue)", cursor: "pointer" }}
            />
            {label}
          </label>
        ))}
        {!curriculum && (
          <span style={{ fontSize: 12, color: "var(--es-muted)", marginLeft: "auto" }}>
            Import CTĐT để xem chi tiết tín chỉ
          </span>
        )}
      </div>
    </div>
  );
}
