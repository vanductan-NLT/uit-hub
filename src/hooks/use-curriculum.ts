import { useState, useEffect } from "react";
import { getCurriculum, getCurriculumForUser, type CurriculumWithDetails } from "@/lib/data/curriculum-registry";

/**
 * Fetch the CTĐT (curriculum) for a user.
 *
 * Resolves by the LIVE profile fields (major + intake year) first, so editing
 * major/MSSV immediately loads the matching curriculum instead of a stale one.
 * Since curricula are keyed by (major, year), this also auto-shares any
 * curriculum another same-cohort user already imported. The stored
 * `curriculumId` is only a fallback for legacy rows missing major/intake year.
 * Returns null when no matching curriculum exists yet (UI prompts an import).
 */
export function useCurriculum(
  major: string | null | undefined,
  intakeYear: number | null | undefined,
  refreshKey = 0,
  curriculumId?: string | null
) {
  const [curriculum, setCurriculum] = useState<CurriculumWithDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!major || !intakeYear) {
      if (!curriculumId) {
        setCurriculum(null);
        return;
      }
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    const load = (major && intakeYear)
      ? getCurriculumForUser(major, intakeYear)
      : getCurriculum(curriculumId as string);
    load
      .then((data) => { if (!cancelled) setCurriculum(data); })
      .catch((e: Error) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [major, intakeYear, refreshKey, curriculumId]);

  return { curriculum, loading, error };
}
