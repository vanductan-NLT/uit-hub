"use client";

import { useState, useMemo } from "react";
import type { Course, UserCourseWithCourse, ResourceType } from "@/types/database";
import { useResources } from "@/hooks/use-resources";
import ResourceList from "@/components/features/study-resources/resource-list";
import CourseFilter from "@/components/features/study-resources/course-filter";
import SubmitResourceModal from "@/components/features/study-resources/submit-resource-modal";

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
            style={{
              padding: "6px 12px", borderRadius: "var(--r-sm)",
              border: "1px solid var(--es-border)", fontFamily: "inherit",
              fontSize: 13, width: 200, outline: "none",
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
        ) : (
          <>
            {suggested.length > 0 && (
              <ResourceList
                resources={suggested}
                title="⭐ Gợi ý cho bạn"
                badge={<span className="es-badge es-badge-blue">Dựa trên tiến độ học</span>}
              />
            )}
            <ResourceList
              resources={rest.length > 0 ? rest : suggested.length === 0 ? filtered : rest}
              title={suggested.length > 0 ? "📚 Tài nguyên khác" : "📚 Tất cả tài nguyên"}
              emptyText="Không tìm thấy tài nguyên phù hợp."
            />
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
