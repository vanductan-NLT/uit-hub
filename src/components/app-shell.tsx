"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import DashboardPanel from "@/components/panels/dashboard-panel";
import RoadmapPanel from "@/components/panels/roadmap-panel";
import GpaPanel from "@/components/panels/gpa-panel";
import TrackerPanel from "@/components/panels/tracker-panel";
import ExamPanel from "@/components/panels/exam-panel";
import ResourcesPanel from "@/components/panels/resources-panel";
import ProfilePanel from "@/components/panels/profile-panel";
import ThemeToggle from "@/components/ui/theme-toggle";

type Panel = "dashboard" | "roadmap" | "gpa" | "tracker" | "exam" | "resources" | "profile";

const navItems: { id: Panel; icon: string; label: string; badge?: string }[] = [
  { id: "dashboard", icon: "🏠", label: "Dashboard" },
  { id: "roadmap", icon: "🗺️", label: "Lộ trình môn học" },
  { id: "gpa", icon: "📈", label: "Dự báo GPA", badge: "!" },
  { id: "tracker", icon: "✅", label: "Tracker tiến độ" },
  { id: "exam", icon: "📅", label: "Kế hoạch ôn thi", badge: "3" },
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

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function navigate(panel: Panel) {
    setActive(panel);
    setSidebarOpen(false);
  }

  const initials = getInitials(userEmail);
  const displayName = getDisplayName(userEmail);
  const mssv = displayName.match(/^\d+$/) ? displayName : displayName;

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
                {item.badge && <span className="es-nav-badge">{item.badge}</span>}
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
              <div className="es-user-id">{userEmail.split("@")[0]} · CNTT</div>
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
          {active === "dashboard" && <DashboardPanel onNav={(p) => navigate(p as Panel)} />}
          {active === "roadmap" && <RoadmapPanel userId={userId} userEmail={userEmail} />}
          {active === "gpa" && <GpaPanel userId={userId} onNav={(p) => navigate(p as Panel)} />}
          {active === "tracker" && <TrackerPanel />}
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
