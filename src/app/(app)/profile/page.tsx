"use client";

import { useApp } from "@/contexts/app-context";
import ProfilePanel from "@/components/panels/profile-panel";

export default function ProfilePage() {
  const { userId, userEmail, avatarUrl, curriculumRefreshKey, openImportCtdt } = useApp();

  return (
    <ProfilePanel
      userId={userId}
      userEmail={userEmail}
      avatarUrl={avatarUrl}
      onImportCtdt={openImportCtdt}
      curriculumRefreshKey={curriculumRefreshKey}
    />
  );
}
