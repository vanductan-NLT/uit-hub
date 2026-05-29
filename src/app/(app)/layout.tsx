import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppShellLayout from "./app-shell-layout";

export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/onboarding");

  const avatarUrl =
    (user.user_metadata?.avatar_url as string | undefined) ?? undefined;

  return (
    <AppShellLayout
      userId={user.id}
      userEmail={user.email!}
      avatarUrl={avatarUrl}
    >
      {children}
    </AppShellLayout>
  );
}
