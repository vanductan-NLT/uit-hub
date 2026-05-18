"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upsertUserProfile } from "@/lib/supabase/courses-api";
import OnboardingCourseAdder, { type AddedCourse } from "./onboarding-course-adder";

interface Props { userId: string; userEmail: string; }

const MAJORS = ["CNTT", "KTPM", "KHMT", "MMT&TT", "ATTT", "Khác"];
const YEARS = Array.from({ length: 8 }, (_, i) => 2026 - i);

function StepDots({ current }: { current: number }) {
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 32 }}>
      {[1, 2, 3].map((n) => (
        <div key={n} style={{
          width: n === current ? 24 : 8, height: 8, borderRadius: 99,
          background: n === current ? "var(--blue)" : n < current ? "var(--blue-mid)" : "var(--es-border)",
          transition: "all .3s",
        }} />
      ))}
    </div>
  );
}

export default function OnboardingWizard({ userId, userEmail }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1 state
  const [fullName, setFullName] = useState("");
  const [studentId, setStudentId] = useState(userEmail.split("@")[0] ?? "");
  const [intakeYear, setIntakeYear] = useState<number>(2023);
  const [major, setMajor] = useState("CNTT");

  // Step 2 state
  const [addedCourses, setAddedCourses] = useState<AddedCourse[]>([]);

  async function handleStep1() {
    setSaving(true);
    try {
      await upsertUserProfile({ id: userId, full_name: fullName || null, student_id: studentId || null, intake_year: intakeYear, major });
      setStep(2);
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

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{ width: "100%", maxWidth: 480 }}>
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img src="/uit-logo.png" alt="UIT" style={{ width: 44, height: 44, objectFit: "contain", marginBottom: 10, display: "block", margin: "0 auto 10px" }} />
          <div style={{ fontSize: 13, color: "var(--es-muted)" }}>UIT Hub · UIT</div>
        </div>

        <StepDots current={step} />

        <div className="es-card" style={{ padding: "32px 28px" }}>
          {/* ── STEP 1: Profile ── */}
          {step === 1 && (
            <>
              <div style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)", marginBottom: 6, letterSpacing: "-.3px" }}>
                Chào mừng đến UIT Hub 👋
              </div>
              <div style={{ fontSize: 14, color: "var(--es-muted)", marginBottom: 28 }}>
                Cho mình biết thêm về bạn để cá nhân hóa lộ trình học.
              </div>

              <div style={{ marginBottom: 14 }}>
                <label className="es-login-label">Họ và tên</label>
                <input className="es-login-input" placeholder="Nguyễn Văn A" value={fullName}
                  onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label className="es-login-label">MSSV</label>
                <input className="es-login-input" placeholder="22521234" value={studentId}
                  onChange={(e) => setStudentId(e.target.value)} />
              </div>
              <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
                <div style={{ flex: 1 }}>
                  <label className="es-login-label">Năm nhập học</label>
                  <select value={intakeYear} onChange={(e) => setIntakeYear(Number(e.target.value))}
                    className="es-login-input" style={{ cursor: "pointer" }}>
                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="es-login-label">Ngành</label>
                  <select value={major} onChange={(e) => setMajor(e.target.value)}
                    className="es-login-input" style={{ cursor: "pointer" }}>
                    {MAJORS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <button className="es-login-btn" onClick={handleStep1} disabled={saving}>
                {saving ? "Đang lưu..." : "Tiếp theo →"}
              </button>
            </>
          )}

          {/* ── STEP 2: Add courses ── */}
          {step === 2 && (
            <>
              <div style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)", marginBottom: 6, letterSpacing: "-.3px" }}>
                Môn đã học 📚
              </div>
              <div style={{ fontSize: 14, color: "var(--es-muted)", marginBottom: 24 }}>
                Nhập môn đã hoàn thành để tính GPA và theo dõi tiến độ.
              </div>

              <OnboardingCourseAdder userId={userId} onCoursesChange={setAddedCourses} />

              <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
                <button className="es-btn es-btn-outline" style={{ flex: 1, justifyContent: "center" }}
                  onClick={() => setStep(3)}>
                  Bỏ qua
                </button>
                <button className="es-btn es-btn-primary" style={{ flex: 2, justifyContent: "center" }}
                  onClick={() => setStep(3)}>
                  Xem lộ trình →
                </button>
              </div>
            </>
          )}

          {/* ── STEP 3: Done ── */}
          {step === 3 && (
            <>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)", marginBottom: 6, letterSpacing: "-.3px" }}>
                  Lộ trình sẵn sàng!
                </div>
                <div style={{ fontSize: 14, color: "var(--es-muted)" }}>
                  UIT Hub đã cá nhân hóa lộ trình học của bạn.
                </div>
              </div>

              {/* Quick stats */}
              <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
                <div className="es-stat-card" style={{ flex: 1, textAlign: "center" }}>
                  <div className="es-stat-label">GPA</div>
                  <div className="es-stat-value" style={{ fontSize: 24, color: "var(--blue)" }}>{gpa10()}</div>
                </div>
                <div className="es-stat-card" style={{ flex: 1, textAlign: "center" }}>
                  <div className="es-stat-label">Tín chỉ tích lũy</div>
                  <div className="es-stat-value" style={{ fontSize: 24 }}>{passedCredits}</div>
                </div>
                <div className="es-stat-card" style={{ flex: 1, textAlign: "center" }}>
                  <div className="es-stat-label">Môn đã nhập</div>
                  <div className="es-stat-value" style={{ fontSize: 24 }}>{addedCourses.length}</div>
                </div>
              </div>

              <button className="es-login-btn" onClick={() => router.push("/dashboard")}>
                Vào UIT Hub →
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
