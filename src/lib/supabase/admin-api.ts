import { createClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/types/database";

export interface StudentWithProgress extends UserProfile {
  course_count: number;
  completed_count: number;
  in_progress_count: number;
  total_credits: number;
  gpa10: number | null;
}

export async function checkIsAdmin(userId: string): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", userId)
    .single();
  if (error) return false;
  return data?.role === "admin";
}

export async function getStudentsWithProgress(): Promise<StudentWithProgress[]> {
  const supabase = createClient();

  const { data: profiles, error: pErr } = await supabase
    .from("user_profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (pErr) throw new Error(pErr.message);

  const { data: courses, error: cErr } = await supabase
    .from("user_courses")
    .select("user_id, status, score, course:courses(credits)");
  if (cErr) throw new Error(cErr.message);

  const statsMap = new Map<string, {
    count: number; completed: number; inProgress: number;
    credits: number; weightedSum: number; creditSum: number;
  }>();

  for (const c of courses ?? []) {
    const uid = c.user_id as string;
    if (!statsMap.has(uid)) {
      statsMap.set(uid, { count: 0, completed: 0, inProgress: 0, credits: 0, weightedSum: 0, creditSum: 0 });
    }
    const s = statsMap.get(uid)!;
    s.count++;
    const credits = (c.course as unknown as { credits: number })?.credits ?? 0;
    if (c.status === "completed" || c.status === "exempted") {
      s.completed++;
      s.credits += credits;
      if (c.score != null) {
        s.weightedSum += (c.score as number) * credits;
        s.creditSum += credits;
      }
    } else if (c.status === "in_progress") {
      s.inProgress++;
    }
  }

  return (profiles ?? []).map((p) => {
    const s = statsMap.get(p.id) ?? { count: 0, completed: 0, inProgress: 0, credits: 0, weightedSum: 0, creditSum: 0 };
    return {
      ...p,
      course_count: s.count,
      completed_count: s.completed,
      in_progress_count: s.inProgress,
      total_credits: s.credits,
      gpa10: s.creditSum > 0 ? Math.round((s.weightedSum / s.creditSum) * 100) / 100 : null,
    } as StudentWithProgress;
  });
}
