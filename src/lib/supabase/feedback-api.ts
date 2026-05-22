import { createClient } from "@/lib/supabase/client";

export type FeedbackType = "bug" | "suggestion" | "praise" | "other";

export async function submitFeedback(
  userId: string,
  type: FeedbackType,
  message: string,
  page?: string
): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase.from("user_feedback").insert({
    user_id: userId,
    type,
    message: message.trim(),
    page: page ?? null,
  });
  return { error: error ? error.message : null };
}
