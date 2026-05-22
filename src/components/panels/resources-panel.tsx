"use client";

import { useState, useMemo, useEffect } from "react";
import type { Course, UserCourseWithCourse, ResourceType } from "@/types/database";
import { useResources } from "@/hooks/use-resources";
import { getExamSchedules } from "@/lib/supabase/exam-api";
import ResourceList from "@/components/features/study-resources/resource-list";
import CourseFilter from "@/components/features/study-resources/course-filter";
import SubmitResourceModal from "@/components/features/study-resources/submit-resource-modal";
import EmptyState from "@/components/ui/empty-state";

const typeFilters: { label: string; value: ResourceType | null }[] = [
  { label: "Tất cả", value: null },
  { label: "📺 Video", value: "video" },
  { label: "📄 Slide & PDF", value: "slide" },
  { label: "📝 Bài tập", value: "exercise" },
  { label: "🔗 Đề thi cũ", value: "exam" },
];

interface Props {
  userId: string;
  inProgressCourses: UserCourseWithCourse[];
  allCourses: Course[];
}

export default function ResourcesPanel({ userId, inProgressCourses, allCourses }: Props) {
  const { resources, loading, refetch } = useResources();
  const [activeType, setActiveType] = useState<ResourceType | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showSubmit, setShowSubmit] = useState(false);
  // Map courseId → nearest upcoming exam { daysLeft, period }
  const [examMap, setExamMap] = useState<Map<string, { daysLeft: number; period: "GK" | "CK" }>>(new Map());

  useEffect(() => {
    getExamSchedules(userId).then((exams) => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const map = new Map<string, { daysLeft: number; period: "GK" | "CK" }>();
      for (const e of exams) {
        const d = new Date(e.exam_date); d.setHours(0, 0, 0, 0);
        const daysLeft = Math.ceil((d.getTime() - today.getTime()) / 86400000);
        if (daysLeft < 0) continue; // past exams
        const existing = map.get(e.course_id);
        if (!existing || daysLeft < existing.daysLeft) map.set(e.course_id, { daysLeft, period: e.exam_period });
      }
      setExamMap(map);
    });
  }, [userId]);

  const inProgressIds = useMemo(
    () => inProgressCourses.map((c) => c.course_id),
    [inProgressCourses]
  );

  const filtered = useMemo(() => {
    let list = resources;
    if (activeType) list = list.filter((r) => r.resource_type === activeType);
    if (selectedCourse) list = list.filter((r) => r.course_id === selectedCourse);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) => r.title.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [resources, activeType, selectedCourse, search]);

  const suggested = useMemo(
    () => filtered.filter((r) => inProgressIds.includes(r.course_id)),
    [filtered, inProgressIds]
  );

  const rest = useMemo(
    () => filtered.filter((r) => !inProgressIds.includes(r.course_id)),
    [filtered, inProgressIds]
  );

  // ALL in-progress courses sorted by nearest exam, each with their filtered resources (may be empty)
  const allInProgressByCourse = useMemo(() => {
    const resourceMap = new Map<string, typeof filtered>();
    for (const r of suggested) {
      if (!resourceMap.has(r.course_id)) resourceMap.set(r.course_id, []);
      resourceMap.get(r.course_id)!.push(r);
    }
    return inProgressCourses
      .map((uc) => ({ uc, items: resourceMap.get(uc.course_id) ?? [] }))
      .sort((a, b) => {
        const ea = examMap.get(a.uc.course_id);
        const eb = examMap.get(b.uc.course_id);
        if (ea && eb) return ea.daysLeft - eb.daysLeft;
        return ea ? -1 : eb ? 1 : 0;
      });
  }, [suggested, inProgressCourses, examMap]);

  const coursesWithResources = useMemo(() => {
    const ids = new Set(resources.map((r) => r.course_id));
    return allCourses.filter((c) => ids.has(c.id));
  }, [resources, allCourses]);

  return (
    <>
      <div className="es-topbar">
        <div className="es-topbar-left">
          <div className="es-topbar-title">Tài nguyên học tập</div>
          <div className="es-topbar-sub">Nguồn: BHTCNPM · Gợi ý theo môn đang học</div>
        </div>
        <div className="es-topbar-right" style={{ display: "flex", gap: 8 }}>
          <input
            placeholder="Tìm kiếm tài nguyên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="es-search-input"
            style={{
              padding: "6px 12px", borderRadius: "var(--r-sm)",
              border: "1px solid var(--es-border)", fontFamily: "inherit",
              fontSize: 13, outline: "none",
              background: "var(--white)", color: "var(--ink)",
            }}
          />
          <button className="es-btn es-btn-primary es-btn-sm" onClick={() => setShowSubmit(true)}>
            + Đóng góp
          </button>
        </div>
      </div>

      <div className="es-content">
        {inProgressCourses.length > 0 && !selectedCourse && !search && (
          <div className="es-alert-strip info" style={{ marginBottom: 16 }}>
            <span>🤖</span>
            <span className="es-alert-text">
              Gợi ý dựa trên: Bạn đang học{" "}
              <strong>
                {inProgressCourses.slice(0, 3).map((c) => c.course?.name).join(", ")}
                {inProgressCourses.length > 3 && ` và ${inProgressCourses.length - 3} môn khác`}
              </strong>
            </span>
          </div>
        )}

        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
          <div className="es-resource-filters">
            {typeFilters.map((f) => (
              <button
                key={f.label}
                className={`es-filter-btn${activeType === f.value ? " active" : ""}`}
                onClick={() => setActiveType(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <CourseFilter courses={coursesWithResources} selected={selectedCourse} onChange={setSelectedCourse} />
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--es-muted)" }}>
            Đang tải tài nguyên...
          </div>
        ) : resources.length === 0 ? (
          <EmptyState
            icon="📚"
            title="Chưa có tài nguyên"
            description="Chưa có tài nguyên nào trong hệ thống. Bạn có thể đóng góp slide, video, đề thi cũ cho cộng đồng UIT."
            actionLabel="+ Đóng góp tài nguyên"
            onAction={() => setShowSubmit(true)}
          />
        ) : (
          <>
            {allInProgressByCourse.map(({ uc, items }) => {
              const exam = examMap.get(uc.course_id);
              const urgencyBadge = exam ? (
                <span className={`es-badge ${exam.daysLeft <= 7 ? "es-badge-red" : exam.daysLeft <= 14 ? "es-badge-amber" : "es-badge-green"}`}>
                  📅 {exam.daysLeft === 0 ? "Hôm nay" : `${exam.daysLeft} ngày`} · {exam.period}
                </span>
              ) : null;
              return (
                <ResourceList
                  key={uc.course_id}
                  resources={items}
                  title={uc.course?.name ?? uc.course_id}
                  badge={urgencyBadge}
                  emptyText="Chưa có tài nguyên cho môn này · Bạn có thể đóng góp!"
                />
              );
            })}
            {rest.length > 0 && (
              <ResourceList
                resources={rest}
                title="📚 Tài nguyên khác"
              />
            )}
          </>
        )}
      </div>

      {showSubmit && (
        <SubmitResourceModal
          userId={userId}
          courses={allCourses}
          onClose={() => setShowSubmit(false)}
          onSubmitted={refetch}
        />
      )}
    </>
  );
}
