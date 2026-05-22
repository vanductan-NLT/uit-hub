"use client";

import { useState, useEffect } from "react";
import { getUserProfile, upsertUserProfile } from "@/lib/supabase/courses-api";
import { useCourses } from "@/hooks/use-courses";
import ProfileCurriculumSection from "@/components/features/profile/profile-curriculum-section";
import type { UserProfile } from "@/types/database";

const MAJORS = ["CNTT", "KTPM", "KHMT", "MMT&TT", "ATTT", "Khác"];
const INTAKE_YEARS = Array.from({ length: 10 }, (_, i) => 2026 - i);
const GRAD_YEARS = Array.from({ length: 8 }, (_, i) => 2026 + i);
const TRAINING_TYPES: { value: "chinh-quy" | "tu-xa"; label: string }[] = [
  { value: "chinh-quy", label: "Chính quy" },
  { value: "tu-xa", label: "Từ xa" },
];

interface Props {
  userId: string;
  userEmail: string;
  onImportCtdt?: () => void;
  curriculumRefreshKey?: number;
}

function getInitials(name: string | null, email: string) {
  if (name) return name.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  return email.split("@")[0].slice(0, 2).toUpperCase();
}

export default function ProfilePanel({ userId, userEmail, onImportCtdt, curriculumRefreshKey = 0 }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // edit form state
  const [fullName, setFullName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [major, setMajor] = useState("CNTT");
  const [intakeYear, setIntakeYear] = useState(2022);
  const [gradYear, setGradYear] = useState(2026);
  const [totalCredits, setTotalCredits] = useState(131);
  const [trainingType, setTrainingType] = useState<"chinh-quy" | "tu-xa">("chinh-quy");

  const { gpa10, gpa4, passedCredits } = useCourses(userId);

  useEffect(() => {
    getUserProfile(userId).then((p) => {
      setProfile(p);
      if (p) {
        setFullName(p.full_name ?? "");
        setStudentId(p.student_id ?? "");
        setMajor(p.major ?? "CNTT");
        setIntakeYear(p.intake_year ?? 2022);
        setGradYear(p.target_graduation_year ?? 2026);
        setTotalCredits(p.total_credits_required ?? 131);
        setTrainingType(p.training_type ?? "chinh-quy");
      }
      setLoading(false);
    });
  }, [userId]);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await upsertUserProfile({
        id: userId,
        full_name: fullName || null,
        student_id: studentId || null,
        major,
        intake_year: intakeYear,
        target_graduation_year: gradYear,
        total_credits_required: totalCredits,
        training_type: trainingType,
      });
      setProfile(updated);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setStudentId(profile.student_id ?? "");
      setMajor(profile.major ?? "CNTT");
      setIntakeYear(profile.intake_year ?? 2022);
      setGradYear(profile.target_graduation_year ?? 2026);
      setTotalCredits(profile.total_credits_required ?? 131);
      setTrainingType(profile.training_type ?? "chinh-quy");
    }
    setEditing(false);
  }

  if (loading) {
    return (
      <div className="es-content" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
        <span style={{ color: "var(--es-muted)" }}>Đang tải...</span>
      </div>
    );
  }

  const initials = getInitials(profile?.full_name ?? null, userEmail);
  const displayName = profile?.full_name || userEmail.split("@")[0];
  const progressPct = Math.min(100, Math.round((passedCredits / (profile?.total_credits_required ?? 131)) * 100));

  return (
    <>
      <div className="es-topbar">
        <div className="es-topbar-left">
          <div className="es-topbar-title">Hồ sơ sinh viên</div>
          <div className="es-topbar-sub">Thông tin cá nhân và học vụ</div>
        </div>
        <div className="es-topbar-right">
          {!editing ? (
            <button className="es-btn es-btn-outline es-btn-sm" onClick={() => setEditing(true)}>
              ✏️ Chỉnh sửa
            </button>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <button className="es-btn es-btn-outline es-btn-sm" onClick={handleCancel} disabled={saving}>
                Hủy
              </button>
              <button className="es-btn es-btn-primary es-btn-sm" onClick={handleSave} disabled={saving}>
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="es-content">
        <div className="es-grid-2" style={{ alignItems: "start" }}>
          {/* Left: Avatar + info card */}
          <div>
            <div className="es-card" style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 20 }}>
                <div style={{
                  width: 72, height: 72, borderRadius: "50%",
                  background: "var(--blue)", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 24, fontWeight: 800, flexShrink: 0,
                  boxShadow: "0 0 0 4px var(--blue-lt), 0 0 0 6px var(--blue)",
                }}>
                  {initials}
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)" }}>{displayName}</div>
                  <div style={{ fontSize: 13, color: "var(--es-muted)", marginTop: 2 }}>
                    {profile?.student_id && <span>{profile.student_id} · </span>}
                    {profile?.major ?? "CNTT"} · UIT
                  </div>
                  <div style={{ fontSize: 12, color: "var(--es-muted)", marginTop: 2 }}>{userEmail}</div>
                </div>
              </div>

              {/* GPA stats */}
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {[
                  { label: "GPA hệ 10", val: gpa10.toFixed(2), color: "var(--blue)", accent: "var(--blue)" },
                  { label: "GPA hệ 4", val: gpa4.toFixed(2), color: "var(--green)", accent: "var(--duo-green)" },
                  { label: "Tín chỉ tích lũy", val: `${passedCredits}`, color: "var(--ink)", accent: "var(--duo-orange)" },
                ].map((item, i) => (
                  <div key={item.label} className={`animate-spring-in stagger-${i + 1}`} style={{
                    flex: 1, textAlign: "center", padding: "10px 6px",
                    background: "var(--es-bg-alt, #f8f9fa)", borderRadius: "var(--r-sm)",
                  }}>
                    <div style={{ fontSize: 11, color: "var(--es-muted)", fontWeight: 600, marginBottom: 2 }}>{item.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: item.color }}>{item.val}</div>
                  </div>
                ))}
              </div>

              {/* Credit progress */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--es-muted)", marginBottom: 4 }}>
                  <span>Tiến độ tốt nghiệp</span>
                  <span><strong>{passedCredits}</strong> / {profile?.total_credits_required ?? 131} TC · {progressPct}%</span>
                </div>
                <div className="es-prog-wrap" style={{ height: 8 }}>
                  <div className="es-prog-fill green" style={{ width: `${progressPct}%` }} />
                </div>
              </div>
            </div>

            {/* Meta info */}
            <div className="es-card">
              <div className="es-section-title" style={{ marginBottom: 12 }}>Thông tin học vụ</div>
              {[
                { label: "Năm nhập học", val: profile?.intake_year ?? "—" },
                { label: "Năm tốt nghiệp dự kiến", val: profile?.target_graduation_year ?? "—" },
                { label: "Tổng TC cần tốt nghiệp", val: profile?.total_credits_required ?? 131 },
                { label: "Ngành", val: profile?.major ?? "CNTT" },
                { label: "Hệ đào tạo", val: profile?.training_type === "tu-xa" ? "Từ xa" : "Chính quy" },
              ].map((row) => (
                <div key={row.label} style={{
                  display: "flex", justifyContent: "space-between",
                  padding: "8px 0", borderBottom: "1px solid var(--es-border)",
                  fontSize: 13,
                }}>
                  <span style={{ color: "var(--es-muted)" }}>{row.label}</span>
                  <span style={{ fontWeight: 600 }}>{row.val}</span>
                </div>
              ))}
            </div>

            {/* CTĐT section */}
            {onImportCtdt && (
              <ProfileCurriculumSection
                major={profile?.major}
                intakeYear={profile?.intake_year}
                onImport={onImportCtdt}
                refreshKey={curriculumRefreshKey}
              />
            )}
          </div>

          {/* Right: Edit form (always visible for layout, read-only when not editing) */}
          <div className="es-card">
            <div className="es-section-hdr" style={{ marginBottom: 16 }}>
              <div>
                <div className="es-section-title">Chỉnh sửa thông tin</div>
                <div className="es-section-sub">{editing ? "Nhập thông tin rồi bấm Lưu" : "Bấm Chỉnh sửa để cập nhật"}</div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label className="es-login-label">Họ và tên</label>
                <input
                  className="es-login-input"
                  placeholder="Nguyễn Văn A"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={!editing}
                />
              </div>
              <div>
                <label className="es-login-label">MSSV</label>
                <input
                  className="es-login-input"
                  placeholder="22521234"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  disabled={!editing}
                />
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 2 }}>
                  <label className="es-login-label">Ngành</label>
                  <select
                    className="es-login-input"
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    disabled={!editing}
                    style={{ cursor: editing ? "pointer" : "default" }}
                  >
                    {MAJORS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="es-login-label">Hệ đào tạo</label>
                  <select
                    className="es-login-input"
                    value={trainingType}
                    onChange={(e) => setTrainingType(e.target.value as "chinh-quy" | "tu-xa")}
                    disabled={!editing}
                    style={{ cursor: editing ? "pointer" : "default" }}
                  >
                    {TRAINING_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label className="es-login-label">Năm nhập học</label>
                  <select
                    className="es-login-input"
                    value={intakeYear}
                    onChange={(e) => setIntakeYear(Number(e.target.value))}
                    disabled={!editing}
                    style={{ cursor: editing ? "pointer" : "default" }}
                  >
                    {INTAKE_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="es-login-label">Năm TN dự kiến</label>
                  <select
                    className="es-login-input"
                    value={gradYear}
                    onChange={(e) => setGradYear(Number(e.target.value))}
                    disabled={!editing}
                    style={{ cursor: editing ? "pointer" : "default" }}
                  >
                    {GRAD_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="es-login-label">Tổng tín chỉ cần tốt nghiệp</label>
                <input
                  className="es-login-input"
                  type="number"
                  min={100}
                  max={180}
                  value={totalCredits}
                  onChange={(e) => setTotalCredits(Number(e.target.value))}
                  disabled={!editing}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
