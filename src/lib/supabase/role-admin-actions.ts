"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canAssignRole, type AppRole } from "@/lib/role-utils";

export interface UserWithRole {
  id: string;
  full_name: string | null;
  student_id: string | null;
  role: AppRole;
}

// List all users with their role for the role-management UI.
export async function getUsersWithRoles(): Promise<UserWithRole[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("user_profiles")
    .select("id, full_name, student_id, role")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as UserWithRole[];
}

// Assign `newRole` to `targetUserId`. Permission is enforced on the server using
// the acting user's role — the client cannot bypass this.
export async function assignRole(targetUserId: string, newRole: AppRole): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Chưa đăng nhập.");

  const admin = createAdminClient();

  const { data: actor, error: actorErr } = await admin
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (actorErr || !actor) throw new Error("Không tìm thấy hồ sơ người thực hiện.");

  const { data: target, error: targetErr } = await admin
    .from("user_profiles")
    .select("role")
    .eq("id", targetUserId)
    .single();
  if (targetErr || !target) throw new Error("Không tìm thấy người dùng cần phân quyền.");

  if (!canAssignRole(actor.role as AppRole, target.role as AppRole, newRole)) {
    throw new Error("Bạn không có quyền thực hiện thay đổi này.");
  }

  const { error: updErr } = await admin
    .from("user_profiles")
    .update({ role: newRole, updated_at: new Date().toISOString() })
    .eq("id", targetUserId);
  if (updErr) throw new Error(updErr.message);
}
