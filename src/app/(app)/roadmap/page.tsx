"use client";

import { useApp } from "@/contexts/app-context";
import RoadmapPanel from "@/components/panels/roadmap-panel";

export default function RoadmapPage() {
  const { userId, userEmail, totalCreditsRequired, userProfile, curriculumRefreshKey, openImportCtdt } = useApp();

  return (
    <RoadmapPanel
      userId={userId}
      userEmail={userEmail}
      totalCreditsRequired={totalCreditsRequired}
      major={userProfile?.major}
      intakeYear={userProfile?.intake_year}
      curriculumId={userProfile?.curriculum_id}
      curriculumRefreshKey={curriculumRefreshKey}
      onImportCtdt={openImportCtdt}
    />
  );
}
