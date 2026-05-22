import { useState, useEffect } from "react";
import { getCurriculumForUser, type CurriculumWithDetails } from "@/lib/data/curriculum-registry";

/**
 * Fetch the CTĐT (curriculum) for a given major + intake year.
 * Returns null when the curriculum hasn't been imported yet.
 */
export function useCurriculum(major: string | null | undefined, intakeYear: number | null | undefined, refreshKey = 0) {
  const [curriculum, setCurriculum] = useState<CurriculumWithDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!major || !intakeYear) {
      setCurriculum(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    getCurriculumForUser(major, intakeYear)
      .then((data) => { if (!cancelled) setCurriculum(data); })
      .catch((e: Error) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [major, intakeYear, refreshKey]);

  return { curriculum, loading, error };
}
