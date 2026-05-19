"use client";

import type { StudyResourceWithCourse } from "@/types/database";

const typeConfig: Record<string, { icon: string; badge: string; cls: string }> = {
  video: { icon: "📺", badge: "Video", cls: "es-badge-blue" },
  slide: { icon: "📄", badge: "Slide & PDF", cls: "es-badge-gray" },
  exercise: { icon: "📝", badge: "Bài tập", cls: "es-badge-amber" },
  exam: { icon: "🔗", badge: "Đề thi cũ", cls: "es-badge-red" },
};

export default function ResourceCard({ resource }: { resource: StudyResourceWithCourse }) {
  const cfg = typeConfig[resource.resource_type] ?? typeConfig.slide;

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="es-resource-card"
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <div className="es-resource-type-row">
        <span className="es-resource-icon">{cfg.icon}</span>
        <span className={`es-badge ${cfg.cls}`}>{cfg.badge}</span>
      </div>
      <div className="es-resource-name">{resource.title}</div>
      <div className="es-resource-desc">{resource.description}</div>
      <div className="es-resource-footer">
        <span className="es-resource-meta">{resource.source ?? "BHTCNPM"} · {resource.course?.name}</span>
      </div>
    </a>
  );
}
