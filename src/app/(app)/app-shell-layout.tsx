"use client";

import { useState, useMemo, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useCourses } from "@/hooks/use-courses";
import { calculateRequiredCK, calculatePartialScore } from "@/lib/gpa-forecast-utils";
import { getUserProfile } from "@/lib/supabase/courses-api";
import { getNearestExamDays } from "@/lib/supabase/exam-api";
import { useToast } from "@/hooks/use-toast";
import { AppProvider, type AppContextValue } from "@/contexts/app-context";
import AppShellSidebar from "./app-shell-sidebar";
import ToastContainer from "@/components/ui/toast-notification";
import ImportHubModal from "@/components/features/import/import-hub-modal";
import ImportFromDkhp from "@/components/features/course-tracker/import-from-dkhp";
import ImportFromHtml from "@/components/features/course-tracker/import-from-html";
import ImportExamHtml from "@/components/features/exam-schedule/import-exam-html";
import ImportCtdtModal from "@/components/features/import/import-ctdt-modal";
import type { UserProfile } from "@/types/database";

interface Props {
  userId: string;
  userEmail: string;
  avatarUrl?: string;
  children: React.ReactNode;
}

function getInitials(email: string) {
  return email.split("@")[0].slice(0, 2).toUpperCase();
}

function getDisplayName(email: string) {
  return email.split("@")[0];
}

export default function AppShellLayout({ userId, userEmail, avatarUrl, children }: Props) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [nearestExamDays, setNearestExamDays] = useState<number | null>(null);
  const [curriculumRefreshKey, setCurriculumRefreshKey] = useState(0);
  const [showImportHub, setShowImportHub] = useState(false);
  const [showImportDkhp, setShowImportDkhp] = useState(false);
  const [showImportHtml, setShowImportHtml] = useState(false);
  const [showImportExam, setShowImportExam] = useState(false);
  const [showImportCtdt, setShowImportCtdt] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  const router = useRouter();
  const supabase = createClient();
  const { toasts, toast, removeToast } = useToast();

  useEffect(() => { getUserProfile(userId).then(setUserProfile); }, [userId]);
  useEffect(() => { getNearestExamDays(userId).then(setNearestExamDays); }, [userId]);

  const { userCourses, allCourses, loading: coursesLoading, gpa4, passedCredits, addCourse, refetch } = useCourses(userId);
  const totalCreditsRequired = userProfile?.total_credits_required ?? 131;

  const inProgressCourses = useMemo(() => userCourses.filter((c) => c.status === "in_progress"), [userCourses]);
  const completedCourses = useMemo(() => userCourses.filter((c) => c.status === "completed" || c.status === "exempted"), [userCourses]);
  const currentSemester = useMemo(() => inProgressCourses[0]?.semester ?? null, [inProgressCourses]);
  const riskyCount = useMemo(
    () => inProgressCourses.filter((c) => {
      const scores = c.component_scores ?? {};
      const ck = calculateRequiredCK(c.course, scores, 7.0);
      const partial = calculatePartialScore(c.course, scores);
      const ckEntered = (scores["Cuối kỳ"] ?? null) !== null;
      if (!partial) return false;
      if (ckEntered) return partial < 5.5;
      return (ck !== null && ck > 8.5) || partial < 5.5;
    }).length,
    [inProgressCourses]
  );

  const profileName = userProfile?.full_name || null;
  const initials = profileName
    ? profileName.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : getInitials(userEmail);
  const displayName = profileName || getDisplayName(userEmail);
  const mssv = userProfile?.student_id || displayName;

  /** Prevent DKHP import from downgrading completed/exempted courses */
  const addCourseWithGuard: typeof addCourse = async (input) => {
    const existing = userCourses.find((c) => c.course_id === input.course_id);
    if (existing && ["completed", "exempted"].includes(existing.status) && input.status === "in_progress") return;
    return addCourse(input);
  };

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const ctx: AppContextValue = {
    userId, userEmail, avatarUrl, displayName, initials, mssv,
    userProfile, totalCreditsRequired,
    userCourses, allCourses, coursesLoading, gpa4, passedCredits,
    inProgressCourses, completedCourses, currentSemester, riskyCount,
    nearestExamDays, curriculumRefreshKey,
    addCourse: addCourseWithGuard, refetch,
    toast,
    openImportHub: () => setShowImportHub(true),
    openImportCtdt: () => setShowImportCtdt(true),
  };

  return (
    <AppProvider value={ctx}>
      <div className="es-app">
        <AppShellSidebar
          userProfile={userProfile}
          displayName={displayName}
          initials={initials}
          mssv={mssv}
          avatarUrl={avatarUrl}
          riskyCount={riskyCount}
          nearestExamDays={nearestExamDays}
          onLogout={() => setShowLogout(true)}
          onOpenImportHub={() => setShowImportHub(true)}
        />
        <main className="es-main">{children}</main>
      </div>

      {showImportHub && (
        <ImportHubModal
          onSelectDkhp={() => setShowImportDkhp(true)}
          onSelectHtml={() => setShowImportHtml(true)}
          onSelectExam={() => setShowImportExam(true)}
          onClose={() => setShowImportHub(false)}
        />
      )}
      {showImportDkhp && (
        <ImportFromDkhp
          userId={userId}
          allCourses={allCourses}
          userCourses={userCourses}
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
      {showImportCtdt && (
        <ImportCtdtModal
          onSuccess={() => { refetch(); getUserProfile(userId).then(setUserProfile); setCurriculumRefreshKey((k) => k + 1); }}
          onClose={() => setShowImportCtdt(false)}
          userId={userId}
          defaultMajor={userProfile?.major}
          defaultIntakeYear={userProfile?.intake_year}
          defaultStudentId={userProfile?.student_id}
          defaultTrainingType={userProfile?.training_type}
        />
      )}

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
    </AppProvider>
  );
}
