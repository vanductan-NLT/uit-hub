"use client";

import { useState, useEffect } from "react";
import { getAllCourses } from "@/lib/supabase/courses-api";
import type { Course } from "@/types/database";
import ResourceManager from "@/components/features/admin/resource-manager";
import StudentList from "@/components/features/admin/student-list";
import FeedbackList from "@/components/features/admin/feedback-list";
import type { AppRole } from "@/lib/role-utils";

type Tab = "resources" | "students" | "feedback";

export default function AdminShell({ userId, userEmail, currentUserRole }: { userId: string; userEmail: string; currentUserRole: AppRole }) {
  const [activeTab, setActiveTab] = useState<Tab>("resources");
  const [allCourses, setAllCourses] = useState<Course[]>([]);

  useEffect(() => {
    getAllCourses().then(setAllCourses);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <div className="es-topbar" style={{ borderBottom: "1px solid var(--es-border)" }}>
        <div className="es-topbar-left">
          <div className="es-topbar-title">🛡️ Admin Panel</div>
          <div className="es-topbar-sub">{userEmail}</div>
        </div>
        <div className="es-topbar-right">
          <a
            href="/dashboard"
            className="es-btn es-btn-outline es-btn-sm"
            style={{ textDecoration: "none" }}
          >
            ← Dashboard
          </a>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 24px" }}>
        <div className="es-resource-filters" style={{ marginBottom: 20 }}>
          <button
            className={`es-filter-btn${activeTab === "resources" ? " active" : ""}`}
            onClick={() => setActiveTab("resources")}
          >
            📚 Quản lý tài nguyên
          </button>
          <button
            className={`es-filter-btn${activeTab === "students" ? " active" : ""}`}
            onClick={() => setActiveTab("students")}
          >
            👥 Danh sách sinh viên
          </button>
          <button
            className={`es-filter-btn${activeTab === "feedback" ? " active" : ""}`}
            onClick={() => setActiveTab("feedback")}
          >
            💬 Góp ý người dùng
          </button>
        </div>

        {activeTab === "resources" && <ResourceManager userId={userId} allCourses={allCourses} />}
        {activeTab === "students" && <StudentList currentUserRole={currentUserRole} />}
        {activeTab === "feedback" && <FeedbackList />}
      </div>
    </div>
  );
}
