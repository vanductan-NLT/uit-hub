import { createClient } from "@/lib/supabase/client";
import type { UserMilestone } from "@/types/database";

export async function getUserMilestones(userId: string): Promise<UserMilestone[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("user_milestones")
    .select("*")
    .eq("user_id", userId);
  return (data ?? []) as UserMilestone[];
}

export async function upsertMilestone(
  userId: string,
  key: string,
  isCompleted: boolean,
  value?: number | null
): Promise<void> {
  const supabase = createClient();
  await supabase.from("user_milestones").upsert(
    {
      user_id: userId,
      key,
      is_completed: isCompleted,
      value: value ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,key" }
  );
}
