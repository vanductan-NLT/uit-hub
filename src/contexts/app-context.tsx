"use client";

import { createContext, useContext } from "react";
import type { UserProfile, UserCourseWithCourse, Course } from "@/types/database";
import type { UpsertUserCourseInput } from "@/lib/supabase/courses-api";

export interface ToastFns {
  success: (msg: string) => void;
  error: (msg: string) => void;
  warning: (msg: string) => void;
  info: (msg: string) => void;
}

export interface AppContextValue {
  userId: string;
  userEmail: string;
  avatarUrl?: string;
  displayName: string;
  initials: string;
  mssv: string;
  userProfile: UserProfile | null;
  totalCreditsRequired: number;
  userCourses: UserCourseWithCourse[];
  allCourses: Course[];
  coursesLoading: boolean;
  gpa4: number;
  passedCredits: number;
  inProgressCourses: UserCourseWithCourse[];
  completedCourses: UserCourseWithCourse[];
  currentSemester: string | null;
  riskyCount: number;
  nearestExamDays: number | null;
  curriculumRefreshKey: number;
  addCourse: (input: UpsertUserCourseInput) => Promise<void>;
  refetch: () => void;
  toast: ToastFns;
  openImportHub: () => void;
  openImportCtdt: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider = AppContext.Provider;

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

/** Map sidebar panel IDs to URL paths */
export const PANEL_PATHS: Record<string, string> = {
  dashboard: "/dashboard",
  roadmap: "/roadmap",
  gpa: "/gpa",
  exam: "/exam-plan",
  resources: "/study-resource",
  profile: "/profile",
};
