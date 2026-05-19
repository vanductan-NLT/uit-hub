"use client";

import { useState, useEffect, useCallback } from "react";
import type { StudyResourceWithCourse, ResourceType } from "@/types/database";
import { getPublishedResources, getResourcesByCourseIds } from "@/lib/supabase/resources-api";

export function useResources(courseIds?: string[]) {
  const [resources, setResources] = useState<StudyResourceWithCourse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const data = courseIds && courseIds.length > 0
        ? await getResourcesByCourseIds(courseIds)
        : await getPublishedResources();
      setResources(data);
    } catch (err) {
      console.error("Failed to fetch resources:", err);
    } finally {
      setLoading(false);
    }
  }, [courseIds?.join(",")]);

  useEffect(() => { fetch(); }, [fetch]);

  const filterByType = useCallback(
    (type: ResourceType | null) =>
      type ? resources.filter((r) => r.resource_type === type) : resources,
    [resources]
  );

  return { resources, loading, refetch: fetch, filterByType };
}
