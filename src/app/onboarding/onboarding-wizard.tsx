"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { upsertUserProfile } from "@/lib/supabase/courses-api";
import OnboardingCourseAdder, { type AddedCourse } from "./onboarding-course-adder";

interface Props { userId: string; userEmail: string; }

const MAJORS = ["CNTT", "KTPM", "KHMT", "MMT&TT", "ATTT", "Khác"];
const YEARS  = Array.from({ length: 8 }, (_, i) => 2026 - i);
const TOTAL_STEPS = 3;

/** Thin progress bar at top — same pattern as Duolingo onboarding */
function ProgressBar({ current }: { current: number }) {
  const pct = Math.round(((current - 1) / TOTAL_STEPS) * 100);
  return (
    <div className="ob-progress-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="ob-progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function OnboardingWizard({ userId, userEmail }: Props) {
  const router = useRouter();
  const [step, setStep]         = useState(1);
  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveError] = useState("");

  // Step 1 state
  const [fullName, setFullName]   = useState("");
  const [studentId, setStudentId] = useState(userEmail.split("@")[0] ?? "");
  const [intakeYear, setIntakeYear] = useState<number>(2023);
  const [major, setMajor]         = useState("CNTT");

  // Step 2 state
  const [addedCourses, setAddedCourses] = useState<AddedCourse[]>([]);

  async function handleStep1() {
    setSaving(true); setSaveError("");
    try {
      await upsertUserProfile({ id: userId, full_name: fullName || null, student_id: studentId || null, intake_year: intakeYear, major });
      setStep(2);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Không thể lưu hồ sơ. Vui lòng thử lại.");
    } finally { setSaving(false); }
  }

  function gpa10(): string {
    const graded = addedCourses.filter((c) => c.score !== null);
    if (!graded.length) return "—";
    const wSum = graded.reduce((s, c) => s + c.score! * c.credits, 0);
    const cSum = graded.reduce((s, c) => s + c.credits, 0);
    return cSum ? (wSum / cSum).toFixed(2) : "—";
  }
  const passedCredits = addedCourses.filter((c) => c.score !== null && c.score >= 4).reduce((s, c) => s + c.credits, 0);

  const fireConfetti = useCallback(() => {
    confetti({ particleCount: 90, spread: 70, origin: { y: 0.55 }, colors: ["#2563EB","#58CC02","#FFC800","#FF9600","#FF4B4B"] });
  }, []);
  useEffect(() => { if (step === 3) fireConfetti(); }, [step, fireConfetti]);

  return (
    <div className="ob-root">
      <ProgressBar current={step} />

      {/* Brand header */}
      <div className="ob-brand">
        <img src="/uit-logo.png" alt="UIT" width={36} height={36} />
        <span className="ob-brand-name">UIT Hub</span>
      </div>

      <div className="ob-content">
        {/* STEP 1 — Profile */}
        {step === 1 && (
          <div className="ob-card animate-card-enter">
            <div className="ob-step-icon">👋</div>
            <h1 className="ob-heading">Chào mừng đến UIT Hub!</h1>
            <p className="ob-sub">Cho mình biết thêm về bạn để cá nhân hóa lộ trình học.</p>

            <div className="ob-fields">
              <div className="ob-field">
                <label className="ob-label">Họ và tên</label>
                <input className="ob-input" placeholder="Nguyễn Văn A" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="ob-field">
                <label className="ob-label">MSSV</label>
                <input className="ob-input" placeholder="22521234" value={studentId} onChange={(e) => setStudentId(e.target.value)} />
              </div>
              <div className="ob-row-2">
                <div className="ob-field">
                  <label className="ob-label">Năm nhập học</label>
                  <select className="ob-input" value={intakeYear} onChange={(e) => setIntakeYear(Number(e.target.value))}>
                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="ob-field">
                  <label className="ob-label">Ngành</label>
                  <select className="ob-input" value={major} onChange={(e) => setMajor(e.target.value)}>
                    {MAJORS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {saveError && <div role="alert" className="ob-error">{saveError}</div>}

            <button className="ob-btn-primary" onClick={handleStep1} disabled={saving}>
              {saving ? "Đang lưu…" : "TIẾP THEO →"}
            </button>
          </div>
        )}

        {/* STEP 2 — Courses */}
        {step === 2 && (
          <div className="ob-card animate-card-enter">
            <div className="ob-step-icon">📚</div>
            <h1 className="ob-heading">Môn đã học</h1>
            <p className="ob-sub">Nhập môn đã hoàn thành để tính GPA và theo dõi tiến độ.</p>

            <OnboardingCourseAdder userId={userId} onCoursesChange={setAddedCourses} />

            <div className="ob-btn-row">
              <button className="ob-btn-ghost" onClick={() => setStep(3)}>Bỏ qua</button>
              <button className="ob-btn-primary ob-btn-flex" onClick={() => setStep(3)}>XEM LỘ TRÌNH →</button>
            </div>
          </div>
        )}

        {/* STEP 3 — Done */}
        {step === 3 && (
          <div className="ob-card ob-card--done animate-card-enter">
            <div className="ob-done-emoji animate-bounce-in">🎉</div>
            <h1 className="ob-heading">Lộ trình sẵn sàng!</h1>
            <p className="ob-sub">UIT Hub đã cá nhân hóa lộ trình học của bạn.</p>

            <div className="ob-stats-row">
              <div className="ob-stat animate-spring-in stagger-1">
                <div className="ob-stat-label">GPA</div>
                <div className="ob-stat-val ob-stat-val--blue">{gpa10()}</div>
              </div>
              <div className="ob-stat animate-spring-in stagger-2">
                <div className="ob-stat-label">Tín chỉ</div>
                <div className="ob-stat-val ob-stat-val--green">{passedCredits}</div>
              </div>
              <div className="ob-stat animate-spring-in stagger-3">
                <div className="ob-stat-label">Đã nhập</div>
                <div className="ob-stat-val ob-stat-val--orange">{addedCourses.length}</div>
              </div>
            </div>

            <button className="ob-btn-success" onClick={() => router.push("/dashboard")}>
              VÀO UIT HUB →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
