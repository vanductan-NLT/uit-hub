import { useState, useEffect } from "react";
import { getCurriculum, getCurriculumForUser, type CurriculumWithDetails } from "@/lib/data/curriculum-registry";

/**
 * Fetch the CTĐT (curriculum) for a user.
 *
 * Prefers the curriculum id stored on the profile (set at import time) — this
 * is the authoritative link and never mismatches. Falls back to reconstructing
 * the key from major + intake year for users who imported before the link
 * existed. Returns null when no curriculum has been imported yet.
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
    if (!curriculumId && (!major || !intakeYear)) {
      setCurriculum(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    const load = curriculumId
      ? getCurriculum(curriculumId)
      : getCurriculumForUser(major as string, intakeYear as number);
    load
      .then((data) => { if (!cancelled) setCurriculum(data); })
      .catch((e: Error) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [major, intakeYear, refreshKey, curriculumId]);

  return { curriculum, loading, error };
}
