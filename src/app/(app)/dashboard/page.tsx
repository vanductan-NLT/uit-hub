"use client";

import { useRouter } from "next/navigation";
import { useApp } from "@/contexts/app-context";
import { PANEL_PATHS } from "@/contexts/app-context";
import DashboardPanel from "@/components/panels/dashboard-panel";

export default function DashboardPage() {
  const router = useRouter();
  const {
    displayName, avatarUrl, coursesLoading, gpa4, passedCredits,
    totalCreditsRequired, inProgressCourses, completedCourses,
    nearestExamDays, currentSemester,
  } = useApp();

  return (
    <DashboardPanel
      onNav={(p) => router.push(PANEL_PATHS[p] ?? "/dashboard")}
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
  );
}
