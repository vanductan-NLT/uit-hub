"use client";

import { useApp } from "@/contexts/app-context";
import ExamPanel from "@/components/panels/exam-panel";

export default function ExamPlanPage() {
  const { userId, userCourses, allCourses, currentSemester, toast } = useApp();

  return (
    <ExamPanel
      userId={userId}
      userCourses={userCourses}
      allCourses={allCourses}
      currentSemester={currentSemester}
      onToast={toast}
    />
  );
}
