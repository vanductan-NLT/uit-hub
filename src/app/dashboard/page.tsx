import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppShell from "@/components/app-shell";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Redirect new users to onboarding if profile not set up
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/onboarding");

  const avatarUrl = (user.user_metadata?.avatar_url as string | undefined) ?? undefined;
  return <AppShell userId={user.id} userEmail={user.email!} avatarUrl={avatarUrl} />;
}
