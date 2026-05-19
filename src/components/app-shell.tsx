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
import { getUserProfile } from "@/lib/supabase/courses-api";
import type { UserProfile } from "@/types/database";

type Panel = "dashboard" | "roadmap" | "gpa" | "exam" | "resources" | "profile";

const navItems: { id: Panel; icon: string; label: string; badge?: string }[] = [
  { id: "dashboard", icon: "🏠", label: "Dashboard" },
  { id: "roadmap", icon: "🗺️", label: "Lộ trình môn học" },
  { id: "gpa", icon: "📈", label: "Dự báo GPA" },
  { id: "exam", icon: "📅", label: "Kế hoạch ôn thi" },
  { id: "resources", icon: "📚", label: "Tài nguyên học tập" },
];

function getInitials(email: string) {
  const local = email.split("@")[0];
  return local.slice(0, 2).toUpperCase();
}

function getDisplayName(email: string) {
  return email.split("@")[0];
}

export default function AppShell({ userId, userEmail }: { userId: string; userEmail: string }) {
  const [active, setActive] = useState<Panel>("dashboard");
  const [showLogout, setShowLogout] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  useEffect(() => { getUserProfile(userId).then(setUserProfile); }, [userId]);
  const totalCreditsRequired = userProfile?.total_credits_required ?? 131;

  const { userCourses, loading: coursesLoading, gpa4, passedCredits } = useCourses(userId);
  const inProgressCourses = useMemo(() => userCourses.filter((c) => c.status === "in_progress"), [userCourses]);
  const completedCourses = useMemo(() => userCourses.filter((c) => c.status === "completed" || c.status === "exempted"), [userCourses]);
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
        <nav className={`es-sidebar${sidebarOpen ? " open" : ""}`}>
          <div className="es-sidebar-top">
            <div className="es-brand">
              <img src="/uit-logo.png" alt="UIT" style={{ width: 36, height: 36, objectFit: "contain", flexShrink: 0 }} />
              <div>
                <div className="es-brand-name">UIT Hub</div>
                <div className="es-brand-sub">UIT · 2024–2025</div>
              </div>
            </div>

            <div className="es-nav-label">Tổng quan</div>
            <button className={`es-nav-item${active === "dashboard" ? " active" : ""}`} onClick={() => navigate("dashboard")}>
              <span className="es-nav-icon">🏠</span> Dashboard
            </button>

            <div className="es-nav-label" style={{ marginTop: 12 }}>Cá nhân hóa</div>
            {navItems.slice(1).map((item) => (
              <button
                key={item.id}
                className={`es-nav-item${active === item.id ? " active" : ""}`}
                onClick={() => navigate(item.id)}
              >
                <span className="es-nav-icon">{item.icon}</span>
                {item.label}
                {item.id === "gpa"
                  ? riskyCount > 0 && <span className="es-nav-badge">{riskyCount}</span>
                  : item.badge && <span className="es-nav-badge">{item.badge}</span>
                }
              </button>
            ))}
          </div>

          <div
            className={`es-sidebar-user${active === "profile" ? " active" : ""}`}
            onClick={() => navigate("profile")}
            style={{ cursor: "pointer" }}
            title="Xem hồ sơ"
          >
            <div className="es-user-avatar">{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="es-user-name">{mssv}</div>
              <div className="es-user-id">{displayName} · {userProfile?.major ?? "CNTT"}</div>
            </div>
            <ThemeToggle />
            <button
              className="es-btn-ghost"
              onClick={(e) => { e.stopPropagation(); setShowLogout(true); }}
              title="Đăng xuất"
              style={{ padding: "4px 6px", fontSize: 16 }}
            >
              ↪
            </button>
          </div>
        </nav>

        {/* Main content */}
        <main className="es-main">
          {active === "dashboard" && (
            <DashboardPanel
              onNav={(p) => navigate(p as Panel)}
              displayName={displayName}
              loading={coursesLoading}
              gpa4={gpa4}
              passedCredits={passedCredits}
              totalCreditsRequired={totalCreditsRequired}
              inProgressCourses={inProgressCourses}
              completedCourses={completedCourses}
            />
          )}
          {active === "roadmap" && <RoadmapPanel userId={userId} userEmail={userEmail} totalCreditsRequired={totalCreditsRequired} />}
          {active === "gpa" && <GpaPanel userId={userId} onNav={(p) => navigate(p as Panel)} />}
          {active === "exam" && <ExamPanel />}
          {active === "resources" && <ResourcesPanel />}
          {active === "profile" && <ProfilePanel userId={userId} userEmail={userEmail} />}
        </main>
      </div>

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
    </>
  );
}
