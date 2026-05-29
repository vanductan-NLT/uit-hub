"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import ThemeToggle from "@/components/ui/theme-toggle";
import FeedbackButton from "@/components/features/feedback/feedback-button";
import { useApp } from "@/contexts/app-context";
import { PANEL_PATHS } from "@/contexts/app-context";
import type { UserProfile } from "@/types/database";

interface Props {
  userProfile: UserProfile | null;
  displayName: string;
  initials: string;
  mssv: string;
  avatarUrl?: string;
  riskyCount: number;
  nearestExamDays: number | null;
  onLogout: () => void;
  onOpenImportHub: () => void;
}

const navItems = [
  { id: "dashboard", icon: "🏠", label: "Dashboard", badgeBg: "#EFF4FF", group: "Tổng quan" },
  { id: "roadmap", icon: "🗺️", label: "Lộ trình môn học", badgeBg: "#DCFCE7", group: "Cá nhân hóa" },
  { id: "gpa", icon: "📈", label: "Dự báo GPA", badgeBg: "#F5F3FF", group: "Cá nhân hóa" },
  { id: "exam", icon: "📅", label: "Kế hoạch ôn thi", badgeBg: "#FFF7ED", group: "Cá nhân hóa" },
  { id: "resources", icon: "📚", label: "Tài nguyên học tập", badgeBg: "#FFF1F2", group: "Cá nhân hóa" },
];

function pathnameToPanel(pathname: string): string {
  if (pathname.startsWith("/roadmap")) return "roadmap";
  if (pathname.startsWith("/gpa")) return "gpa";
  if (pathname.startsWith("/exam-plan")) return "exam";
  if (pathname.startsWith("/study-resource")) return "resources";
  if (pathname.startsWith("/profile")) return "profile";
  return "dashboard";
}

export default function AppShellSidebar({
  userProfile, displayName, initials, mssv, avatarUrl,
  riskyCount, nearestExamDays, onLogout, onOpenImportHub,
}: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { toast, userId } = useApp();
  const activePanel = pathnameToPanel(pathname);

  function navigate(panelId: string) {
    router.push(PANEL_PATHS[panelId] ?? "/dashboard");
    setSidebarOpen(false);
  }

  return (
    <>
      <button className="es-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Mở menu">
        ☰
      </button>

      <div
        className={`es-sidebar-overlay${sidebarOpen ? " open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <nav className={`es-sidebar${sidebarOpen ? " open" : ""}${sidebarCollapsed ? " collapsed" : ""}`}>
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

        <div className="es-sidebar-nav-content">
          <div className="es-nav-label">Tổng quan</div>
          <button
            className={`es-nav-item${activePanel === "dashboard" ? " active" : ""}`}
            onClick={() => navigate("dashboard")}
            data-tooltip="Dashboard"
          >
            <span className="es-nav-icon-badge" style={{ background: "#EFF4FF" }}>🏠</span>
            <span className="es-nav-text">Dashboard</span>
          </button>

          <div className="es-nav-label" style={{ marginTop: 12 }}>Cá nhân hóa</div>
          {navItems.slice(1).map((item) => (
            <button
              key={item.id}
              className={`es-nav-item${activePanel === item.id ? " active" : ""}`}
              onClick={() => navigate(item.id)}
              data-tooltip={item.label}
            >
              <span className="es-nav-icon-badge" style={{ background: item.badgeBg }}>{item.icon}</span>
              <span className="es-nav-text">{item.label}</span>
              {item.id === "gpa" && riskyCount > 0 && (
                <span className="es-nav-badge">{riskyCount}</span>
              )}
              {item.id === "exam" && nearestExamDays !== null && nearestExamDays >= 0 && (
                <span className={`es-nav-badge${nearestExamDays <= 3 ? " urgent" : nearestExamDays <= 7 ? " soon" : ""}`}>
                  {nearestExamDays === 0 ? "Hôm nay" : `${nearestExamDays}d`}
                </span>
              )}
            </button>
          ))}

          <div className="es-sidebar-bottom-btns">
            <button
              className="es-btn es-btn-primary"
              onClick={() => { onOpenImportHub(); setSidebarOpen(false); }}
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

        <div className="es-sidebar-user-section">
          <div
            className={`es-sidebar-user${activePanel === "profile" ? " active" : ""}`}
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
            onClick={onLogout}
            title="Đăng xuất"
            data-tooltip="Đăng xuất"
          >
            <span className="es-nav-icon-badge" style={{ background: "rgba(239,68,68,0.1)", fontSize: 14 }}>↪</span>
            <span className="es-nav-text">Đăng xuất</span>
          </button>
        </div>
      </nav>
    </>
  );
}
