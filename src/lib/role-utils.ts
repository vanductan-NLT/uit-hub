// Role hierarchy: owner > admin > student. Shared by both the role-manager UI
// (to gate dropdown options) and the server action (to enforce on write).
// Never trust the client — the server re-checks with these same functions.

import type { UserProfile } from "@/types/database";

export type AppRole = UserProfile["role"];

export const ROLE_LABELS: Record<AppRole, string> = {
  owner: "Chủ sở hữu",
  admin: "Quản trị viên",
  student: "Sinh viên",
};

// Can `actor` set `target`'s role (currently `targetCurrent`) to `newRole`?
//  - owner: anything
//  - admin: only admin/student, and only on non-owner targets
//  - student: never
export function canAssignRole(
  actor: AppRole,
  targetCurrent: AppRole,
  newRole: AppRole
): boolean {
  if (actor === "owner") return true;
  if (actor === "admin") {
    return targetCurrent !== "owner" && newRole !== "owner";
  }
  return false;
}

// Roles an actor is allowed to assign at all — drives the dropdown options.
export function assignableRoles(actor: AppRole): AppRole[] {
  if (actor === "owner") return ["owner", "admin", "student"];
  if (actor === "admin") return ["admin", "student"];
  return [];
}
