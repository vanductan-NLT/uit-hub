"use client";

import { useRouter } from "next/navigation";
import { useApp } from "@/contexts/app-context";
import { PANEL_PATHS } from "@/contexts/app-context";
import GpaPanel from "@/components/panels/gpa-panel";

export default function GpaPage() {
  const router = useRouter();
  const { userId } = useApp();

  return (
    <GpaPanel
      userId={userId}
      onNav={(p) => router.push(PANEL_PATHS[p] ?? "/dashboard")}
    />
  );
}
