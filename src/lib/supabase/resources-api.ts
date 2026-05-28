import { createClient } from "@/lib/supabase/client";
import type { StudyResource, StudyResourceWithCourse, ResourceStatus } from "@/types/database";

// ── PUBLIC ───────────────────────────────────────────────

export async function getPublishedResources(): Promise<StudyResourceWithCourse[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("study_resources")
    .select("*, course:courses(*)")
    .eq("status", "published")
    .order("course_id")
    .order("resource_type");
  if (error) throw new Error(error.message);
  return data as StudyResourceWithCourse[];
}

export async function getResourcesByCourseIds(courseIds: string[]): Promise<StudyResourceWithCourse[]> {
  if (courseIds.length === 0) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("study_resources")
    .select("*, course:courses(*)")
    .eq("status", "published")
    .in("course_id", courseIds)
    .order("resource_type");
  if (error) throw new Error(error.message);
  return data as StudyResourceWithCourse[];
}

// ── STUDENT CONTRIBUTION ─────────────────────────────────

export interface SubmitResourceInput {
  course_id: string;
  title: string;
  description: string | null;
  url: string | null;
  file_path?: string | null;
  resource_type: string;
  source: string | null;
  submitted_by: string;
}

export async function uploadResourceFile(file: File, userId: string): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop() ?? "bin";
  const filePath = `resources/${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("resources").upload(filePath, file);
  if (error) throw new Error(error.message);
  return filePath;
}

export function getResourceFileUrl(filePath: string): string {
  const supabase = createClient();
  return supabase.storage.from("resources").getPublicUrl(filePath).data.publicUrl;
}

export async function submitResource(input: SubmitResourceInput): Promise<StudyResource> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("study_resources")
    .insert({ ...input, status: "pending" })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as StudyResource;
}

export async function getMySubmissions(userId: string): Promise<StudyResourceWithCourse[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("study_resources")
    .select("*, course:courses(*)")
    .eq("submitted_by", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as StudyResourceWithCourse[];
}

// ── ADMIN ────────────────────────────────────────────────

export async function getAllResourcesAdmin(): Promise<StudyResourceWithCourse[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("study_resources")
    .select("*, course:courses(*)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as StudyResourceWithCourse[];
}

export async function updateResourceStatus(
  id: string,
  status: ResourceStatus,
  adminNote?: string
): Promise<StudyResource> {
  const supabase = createClient();
  const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (adminNote !== undefined) patch.admin_note = adminNote;
  const { data, error } = await supabase
    .from("study_resources")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as StudyResource;
}

export interface UpsertResourceAdminInput {
  id?: string;
  course_id: string;
  title: string;
  description: string | null;
  url: string | null;
  file_path?: string | null;
  resource_type: string;
  source: string | null;
  status: ResourceStatus;
}

export async function upsertResourceAdmin(input: UpsertResourceAdminInput): Promise<StudyResource> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("study_resources")
    .upsert({ ...input, updated_at: new Date().toISOString() }, { onConflict: "id" })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as StudyResource;
}

export async function deleteResource(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("study_resources").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
