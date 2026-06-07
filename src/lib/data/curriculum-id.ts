/**
 * Curriculum id helpers — pure string logic, safe to import from both server
 * actions and client code (no Supabase / browser dependencies).
 *
 * The id is an opaque internal key (never shown to users). Build and lookup must
 * stay consistent; the user-facing khóa label lives in validation-utils.
 */

/** Build curriculum id from major + intake year, e.g. "CNTT" + 2024 → "CNTT-K24". */
export function buildCurriculumId(major: string, intakeYear: number): string {
  return `${major.toUpperCase()}-K${String(intakeYear).slice(-2)}`;
}
