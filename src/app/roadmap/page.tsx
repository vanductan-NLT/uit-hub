import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import RoadmapPanel from "@/components/panels/roadmap-panel";

export const metadata = { title: "Lộ trình môn học · EduSphere" };

export default async function RoadmapPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/onboarding");

  return (
    <div className="es-app">
      <main className="es-main">
        <RoadmapPanel userId={user.id} userEmail={user.email!} />
      </main>
    </div>
  );
}
