"use client";

import { useState, useMemo, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import DashboardPanel from "@/components/panels/dashboard-panel";
import RoadmapPanel from "@/components/panels/roadmap-panel";
import GpaPanel from "@/components/panels/gpa-panel";
import ExamPanel from "@/components/panels/exam-panel";
import ResourcesPanel from "@/components/panels/resources-panel";
import ProfilePanel from "@/components/panels/profile-panel";
import ThemeToggle from "@/components/ui/theme-toggle";
import { useCourses } from "@/hooks/use-courses";
import { calculateRequiredCK, calculatePartialScore } from "@/lib/gpa-forecast-utils";
import ImportHubModal from "@/components/features/import/import-hub-modal";
import ImportFromDkhp from "@/components/features/course-tracker/import-from-dkhp";
import ImportFromHtml from "@/components/features/course-tracker/import-from-html";
import ImportExamHtml from "@/components/features/exam-schedule/import-exam-html";
import ImportCatalogModal from "@/components/features/import/import-catalog-modal";
import ImportCtdtModal from "@/components/features/import/import-ctdt-modal";
import FeedbackButton from "@/components/features/feedback/feedback-button";
import { getUserProfile } from "@/lib/supabase/courses-api";
import { getNearestExamDays } from "@/lib/supabase/exam-api";
import type { UserProfile } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import ToastContainer from "@/components/ui/toast-notification";

type Panel = "dashboard" | "roadmap" | "gpa" | "exam" | "resources" | "profile";

const navItems: { id: Panel; icon: string; label: string; badge?: string; badgeBg: string }[] = [
  { id: "dashboard", icon: "🏠", label: "Dashboard", badgeBg: "#EFF4FF" },
  { id: "roadmap", icon: "🗺️", label: "Lộ trình môn học", badgeBg: "#DCFCE7" },
  { id: "gpa", icon: "📈", label: "Dự báo GPA", badgeBg: "#F5F3FF" },
  { id: "exam", icon: "📅", label: "Kế hoạch ôn thi", badgeBg: "#FFF7ED" },
  { id: "resources", icon: "📚", label: "Tài nguyên học tập", badgeBg: "#FFF1F2" },
];

function getInitials(email: string) {
  const local = email.split("@")[0];
  return local.slice(0, 2).toUpperCase();
}

function getDisplayName(email: string) {
  return email.split("@")[0];
}

export default function AppShell({ userId, userEmail, avatarUrl }: { userId: string; userEmail: string; avatarUrl?: string }) {
  const [active, setActive] = useState<Panel>("dashboard");
  const [showLogout, setShowLogout] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Global import hub + sub-modal state
  const [showImportHub, setShowImportHub] = useState(false);
  const [showImportDkhp, setShowImportDkhp] = useState(false);
  const [showImportHtml, setShowImportHtml] = useState(false);
  const [showImportExam, setShowImportExam] = useState(false);
  const [showImportCatalog, setShowImportCatalog] = useState(false);
  const [showImportCtdt, setShowImportCtdt] = useState(false);
  const [curriculumRefreshKey, setCurriculumRefreshKey] = useState(0);
  const router = useRouter();
  const supabase = createClient();

  const { toasts, toast, removeToast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  useEffect(() => { getUserProfile(userId).then(setUserProfile); }, [userId]);
  const totalCreditsRequired = userProfile?.total_credits_required ?? 131;

  const { userCourses, allCourses, loading: coursesLoading, gpa4, passedCredits, addCourse, refetch } = useCourses(userId);
  const inProgressCourses = useMemo(() => userCourses.filter((c) => c.status === "in_progress"), [userCourses]);
  const completedCourses = useMemo(() => userCourses.filter((c) => c.status === "completed" || c.status === "exempted"), [userCourses]);

  const [nearestExamDays, setNearestExamDays] = useState<number | null>(null);
  useEffect(() => { getNearestExamDays(userId).then(setNearestExamDays); }, [userId]);

  const currentSemester = useMemo(() => {
    const ip = inProgressCourses[0];
    return ip?.semester ?? null;
  }, [inProgressCourses]);
  const riskyCount = useMemo(
    () => inProgressCourses.filter((c) => {
      const scores = c.component_scores ?? {};
      const ck = calculateRequiredCK(c.course, scores, 7.0);
      const partial = calculatePartialScore(c.course, scores);
      const ckEntered = (scores["Cuối kỳ"] ?? null) !== null;
      if (!partial) return false;
      // CK done: warn only if final score is failing
      if (ckEntered) return partial < 5.5;
      // CK pending: warn if needs very high CK or already low
      return (ck !== null && ck > 8.5) || partial < 5.5;
    }).length,
    [inProgressCourses]
  );

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function navigate(panel: Panel) {
    setActive(panel);
    setSidebarOpen(false);
  }

  /**
   * Guard: prevent DKHP import (in_progress) from downgrading a course
   * that the user already has as completed/exempted/failed.
   * If such a record exists, silently skip that course.
   */
  const addCourseWithGuard: typeof addCourse = async (input) => {
    const existing = userCourses.find((c) => c.course_id === input.course_id);
    if (existing && ["completed", "exempted"].includes(existing.status) && input.status === "in_progress") return;
    return addCourse(input);
  };

  const profileName = userProfile?.full_name || null;
  const initials = profileName
    ? profileName.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : getInitials(userEmail);
  const displayName = profileName || getDisplayName(userEmail);
  const mssv = userProfile?.student_id || displayName;

  return (
    <>
      {/* Mobile: hamburger button (fixed, hidden on desktop via CSS) */}
      <button className="es-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Mở menu">
        ☰
      </button>

      {/* Mobile: sidebar backdrop */}
      <div
        className={`es-sidebar-overlay${sidebarOpen ? " open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <div className="es-app">
        {/* Sidebar */}
        <nav className={`es-sidebar${sidebarOpen ? " open" : ""}${sidebarCollapsed ? " collapsed" : ""}`}>
          {/* Header section (fixed) */}
          <div className="es-sidebar-header">
            <div className="es-brand">
              <img src="/UITHUBLOGO.png" alt="UIT" style={{ width: 36, height: 36, objectFit: "contain", flexShrink: 0 }} />
              <div className="es-brand-text">
                <div className="es-brand-name">UIT Hub</div>
                <div className="es-brand-sub">UIT · 2024–2025</div>
              </div>
            </div>
            <button
              className="es-sidebar-collapse-btn"
              onClick={() => setSidebarCollapsed((v) => !v)}
              title={sidebarCollapsed ? "Mở rộng" : "Thu gọn"}
            >
              {sidebarCollapsed ? "»" : "«"}
            </button>
          </div>

          {/* Navigation content section (scrollable) */}
          <div className="es-sidebar-nav-content">
            <div className="es-nav-label">Tổng quan</div>
            <button className={`es-nav-item${active === "dashboard" ? " active" : ""}`} onClick={() => navigate("dashboard")} data-tooltip="Dashboard">
              <span className="es-nav-icon-badge" style={{ background: "#EFF4FF" }}>🏠</span>
              <span className="es-nav-text">Dashboard</span>
            </button>

            <div className="es-nav-label" style={{ marginTop: 12 }}>Cá nhân hóa</div>
            {navItems.slice(1).map((item) => (
              <button
                key={item.id}
                className={`es-nav-item${active === item.id ? " active" : ""}`}
                onClick={() => navigate(item.id)}
                data-tooltip={item.label}
              >
                <span className="es-nav-icon-badge" style={{ background: item.badgeBg }}>{item.icon}</span>
                <span className="es-nav-text">{item.label}</span>
                {item.id === "gpa"
                  ? riskyCount > 0 && <span className="es-nav-badge">{riskyCount}</span>
                  : item.id === "exam"
                  ? nearestExamDays !== null && nearestExamDays >= 0 && (
                    <span className={`es-nav-badge${nearestExamDays <= 3 ? " urgent" : nearestExamDays <= 7 ? " soon" : ""}`}>
                      {nearestExamDays === 0 ? "Hôm nay" : `${nearestExamDays}d`}
                    </span>
                  )
                  : item.badge && <span className="es-nav-badge">{item.badge}</span>
                }
              </button>
            ))}

            {/* Global import + feedback */}
            <div className="es-sidebar-bottom-btns">
              <button
                className="es-btn es-btn-primary"
                onClick={() => { setShowImportHub(true); setSidebarOpen(false); }}
                style={{ width: "100%", justifyContent: "center", gap: 6 }}
              >
                📥 Import dữ liệu
              </button>
              <FeedbackButton userId={userId} onToast={toast} />
            </div>

            {userProfile?.role === "admin" && (
              <>
                <div className="es-nav-label" style={{ marginTop: 12 }}>Quản trị</div>
                <a href="/admin" className="es-nav-item" style={{ textDecoration: "none" }} data-tooltip="Admin Panel">
                  <span className="es-nav-icon-badge" style={{ background: "#FEF3C7" }}>🛡️</span>
                  <span className="es-nav-text">Admin Panel</span>
                </a>
              </>
            )}
          </div>

          {/* Footer section (fixed) */}
          <div className="es-sidebar-user-section">
            <div
              className={`es-sidebar-user${active === "profile" ? " active" : ""}`}
              onClick={() => navigate("profile")}
              style={{ cursor: "pointer" }}
              title="Xem hồ sơ"
              data-tooltip="Xem hồ sơ"
            >
              <div className="es-user-avatar">
                {avatarUrl
                  ? <img src={avatarUrl} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} referrerPolicy="no-referrer" />
                  : initials}
              </div>
              <div className="es-nav-text" style={{ flex: 1, minWidth: 0 }}>
                <div className="es-user-name">{mssv}</div>
                <div className="es-user-id">{displayName} · {userProfile?.major ?? "CNTT"}</div>
              </div>
              <span className="es-nav-text"><ThemeToggle /></span>
            </div>
            <button
              className="es-logout-btn"
              onClick={() => setShowLogout(true)}
              title="Đăng xuất"
              data-tooltip="Đăng xuất"
            >
              <span className="es-nav-icon-badge" style={{ background: "rgba(239,68,68,0.1)", fontSize: 14 }}>↪</span>
              <span className="es-nav-text">Đăng xuất</span>
            </button>
          </div>
        </nav>

        {/* Main content */}
        <main className="es-main">
          {active === "dashboard" && (
            <DashboardPanel
              onNav={(p) => navigate(p as Panel)}
              displayName={displayName}
              avatarUrl={avatarUrl}
              loading={coursesLoading}
              gpa4={gpa4}
              passedCredits={passedCredits}
              totalCreditsRequired={totalCreditsRequired}
              inProgressCourses={inProgressCourses}
              completedCourses={completedCourses}
              nearestExamDays={nearestExamDays}
              semester={currentSemester}
            />
          )}
          {active === "roadmap" && <RoadmapPanel userId={userId} userEmail={userEmail} totalCreditsRequired={totalCreditsRequired} major={userProfile?.major} intakeYear={userProfile?.intake_year} onImportCtdt={() => setShowImportCtdt(true)} curriculumRefreshKey={curriculumRefreshKey} />}
          {active === "gpa" && <GpaPanel userId={userId} onNav={(p) => navigate(p as Panel)} />}
          {active === "exam" && <ExamPanel userId={userId} userCourses={userCourses} allCourses={allCourses} currentSemester={currentSemester} onToast={toast} />}
          {active === "resources" && <ResourcesPanel userId={userId} inProgressCourses={inProgressCourses} allCourses={allCourses} />}
          {active === "profile" && <ProfilePanel userId={userId} userEmail={userEmail} avatarUrl={avatarUrl} onImportCtdt={() => setShowImportCtdt(true)} curriculumRefreshKey={curriculumRefreshKey} />}
        </main>
      </div>

      {/* Import hub + sub-modals */}
      {showImportHub && (
        <ImportHubModal
          onSelectDkhp={() => setShowImportDkhp(true)}
          onSelectHtml={() => setShowImportHtml(true)}
          onSelectExam={() => setShowImportExam(true)}
          onSelectCatalog={() => setShowImportCatalog(true)}
          onSelectCtdt={() => setShowImportCtdt(true)}
          isAdmin={userProfile?.role === "admin"}
          onClose={() => setShowImportHub(false)}
        />
      )}
      {showImportDkhp && (
        <ImportFromDkhp
          allCourses={allCourses}
          onAdd={addCourseWithGuard}
          onSuccess={refetch}
          onClose={() => setShowImportDkhp(false)}
        />
      )}
      {showImportHtml && (
        <ImportFromHtml
          userId={userId}
          userEmail={userEmail}
          allCourses={allCourses}
          onSuccess={refetch}
          onClose={() => setShowImportHtml(false)}
        />
      )}
      {showImportExam && (
        <ImportExamHtml
          userId={userId}
          currentSemester={currentSemester}
          userCourses={userCourses}
          allCourses={allCourses}
          onSuccess={refetch}
          onClose={() => setShowImportExam(false)}
        />
      )}

      {showImportCatalog && (
        <ImportCatalogModal
          onSuccess={refetch}
          onClose={() => setShowImportCatalog(false)}
        />
      )}
      {showImportCtdt && (
        <ImportCtdtModal
          onSuccess={() => { refetch(); setCurriculumRefreshKey((k) => k + 1); }}
          onClose={() => setShowImportCtdt(false)}
          defaultMajor={userProfile?.major}
          defaultIntakeYear={userProfile?.intake_year}
          defaultTrainingType={userProfile?.training_type}
        />
      )}

      {/* Logout modal */}
      {showLogout && (
        <div className="es-logout-overlay" onClick={() => setShowLogout(false)}>
          <div className="es-logout-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>👋</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>Đăng xuất?</div>
            <div style={{ fontSize: 13, color: "var(--es-muted)" }}>
              Tiến độ học tập của bạn đã được lưu. Hẹn gặp lại nhé.
            </div>
            <div className="es-logout-btns">
              <button className="es-btn es-btn-outline" onClick={() => setShowLogout(false)}>Huỷ</button>
              <button className="es-btn es-btn-primary" onClick={handleLogout}>Đăng xuất</button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
