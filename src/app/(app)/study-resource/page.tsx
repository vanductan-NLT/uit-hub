"use client";

import { useApp } from "@/contexts/app-context";
import ResourcesPanel from "@/components/panels/resources-panel";

export default function StudyResourcePage() {
  const { userId, inProgressCourses, allCourses } = useApp();

  return (
    <ResourcesPanel
      userId={userId}
      inProgressCourses={inProgressCourses}
      allCourses={allCourses}
    />
  );
}
