"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { upsertUserProfile } from "@/lib/supabase/courses-api";
import OnboardingCourseAdder, { type AddedCourse } from "./onboarding-course-adder";

interface Props { userId: string; userEmail: string; }

const MAJORS = ["CNTT", "KTPM", "KHMT", "MMT&TT", "ATTT", "Khác"];
const YEARS = Array.from({ length: 8 }, (_, i) => 2026 - i);

function StepDots({ current }: { current: number }) {
  return (
    <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 32 }}>
      {[1, 2, 3].map((n) => (
        <div key={n} style={{
          width: n === current ? 32 : n < current ? 10 : 10,
          height: 10, borderRadius: 99,
          background: n === current ? "var(--blue)" : n < current ? "var(--duo-green)" : "rgba(255,255,255,0.2)",
          boxShadow: n === current ? "0 2px 0 var(--blue-shadow)" : n < current ? "0 2px 0 var(--duo-green-shadow)" : "none",
          transition: "all .4s cubic-bezier(0.34,1.56,0.64,1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 7, color: "#fff", fontWeight: 700,
        }}>
          {n < current ? "✓" : ""}
        </div>
      ))}
    </div>
  );
}

export default function OnboardingWizard({ userId, userEmail }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Step 1 state
  const [fullName, setFullName] = useState("");
  const [studentId, setStudentId] = useState(userEmail.split("@")[0] ?? "");
  const [intakeYear, setIntakeYear] = useState<number>(2023);
  const [major, setMajor] = useState("CNTT");

  // Step 2 state
  const [addedCourses, setAddedCourses] = useState<AddedCourse[]>([]);

  async function handleStep1() {
    setSaving(true);
    setSaveError("");
    try {
      await upsertUserProfile({ id: userId, full_name: fullName || null, student_id: studentId || null, intake_year: intakeYear, major });
      setStep(2);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Không thể lưu hồ sơ. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
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
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: ["#2563EB", "#58CC02", "#FFC800", "#FF9600", "#FF4B4B"] });
  }, []);

  useEffect(() => {
    if (step === 3) fireConfetti();
  }, [step, fireConfetti]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #0F172A 100%)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{ width: "100%", maxWidth: 480 }}>
        {/* Brand */}
        <div className="animate-bounce-in" style={{ textAlign: "center", marginBottom: 32 }}>
          <img src="/uit-logo.png" alt="UIT" style={{ width: 52, height: 52, objectFit: "contain", marginBottom: 10, display: "block", margin: "0 auto 10px" }} />
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>UIT Hub · UIT</div>
        </div>

        <StepDots current={step} />

        <div className="animate-card-enter" style={{
          background: "rgba(15, 23, 42, 0.90)",
          backdropFilter: "blur(12px)",
          borderRadius: "var(--r-2xl)",
          border: "1px solid rgba(59,130,246,0.2)",
          padding: "36px 32px",
          boxShadow: "0 4px 0 rgba(0,0,0,0.4), 0 24px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}>
          {/* ── STEP 1: Profile ── */}
          {step === 1 && (
            <>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#fff", marginBottom: 6, letterSpacing: "-.3px" }}>
                Chào mừng đến UIT Hub 👋
              </div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 28 }}>
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

              {saveError && (
                <div role="alert" style={{ fontSize: 12, color: "#FCA5A5", background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: "var(--r-sm)", padding: "9px 12px", marginBottom: 14 }}>
                  {saveError}
                </div>
              )}

              <button className="es-btn es-btn-primary" style={{ width: "100%", justifyContent: "center", padding: "14px 20px", fontSize: 15 }}
                onClick={handleStep1} disabled={saving}>
                {saving ? "Đang lưu..." : "Tiếp theo →"}
              </button>
            </>
          )}

          {/* ── STEP 2: Add courses ── */}
          {step === 2 && (
            <>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#fff", marginBottom: 6, letterSpacing: "-.3px" }}>
                Môn đã học 📚
              </div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 24 }}>
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
                <div className="animate-bounce-in" style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#fff", marginBottom: 6, letterSpacing: "-.3px" }}>
                  Lộ trình sẵn sàng!
                </div>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>
                  UIT Hub đã cá nhân hóa lộ trình học của bạn.
                </div>
              </div>

              {/* Quick stats */}
              <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
                <div className="animate-spring-in stagger-1" style={{
                  flex: 1, textAlign: "center", padding: "16px 12px",
                  background: "rgba(37,99,235,0.15)", borderRadius: "var(--r-xl)",
                  border: "1px solid rgba(37,99,235,0.25)",
                }}>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 500, marginBottom: 6 }}>GPA</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#93C5FD" }}>{gpa10()}</div>
                </div>
                <div className="animate-spring-in stagger-2" style={{
                  flex: 1, textAlign: "center", padding: "16px 12px",
                  background: "rgba(88,204,2,0.15)", borderRadius: "var(--r-xl)",
                  border: "1px solid rgba(88,204,2,0.25)",
                }}>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 500, marginBottom: 6 }}>Tín chỉ</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#A7EF7A" }}>{passedCredits}</div>
                </div>
                <div className="animate-spring-in stagger-3" style={{
                  flex: 1, textAlign: "center", padding: "16px 12px",
                  background: "rgba(255,150,0,0.15)", borderRadius: "var(--r-xl)",
                  border: "1px solid rgba(255,150,0,0.25)",
                }}>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 500, marginBottom: 6 }}>Đã nhập</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#FFB86C" }}>{addedCourses.length}</div>
                </div>
              </div>

              <button className="es-btn es-btn-success" style={{ width: "100%", justifyContent: "center", padding: "14px 20px", fontSize: 15 }}
                onClick={() => router.push("/dashboard")}>
                Vào UIT Hub →
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
