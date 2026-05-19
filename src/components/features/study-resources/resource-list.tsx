"use client";

import type { StudyResourceWithCourse } from "@/types/database";
import ResourceCard from "./resource-card";

interface Props {
  resources: StudyResourceWithCourse[];
  title: string;
  badge?: React.ReactNode;
  emptyText?: string;
}

export default function ResourceList({ resources, title, badge, emptyText }: Props) {
  if (resources.length === 0 && emptyText) {
    return (
      <div style={{ marginBottom: 20 }}>
        <div className="es-section-hdr" style={{ marginBottom: 10 }}>
          <div className="es-section-title">{title}</div>
          {badge}
        </div>
        <div style={{ padding: 24, textAlign: "center", color: "var(--es-muted)", fontSize: 13 }}>
          {emptyText}
        </div>
      </div>
    );
  }

  if (resources.length === 0) return null;

  return (
    <div style={{ marginBottom: 20 }}>
      <div className="es-section-hdr" style={{ marginBottom: 10 }}>
        <div className="es-section-title">{title}</div>
        {badge}
      </div>
      <div className="es-resource-grid">
        {resources.map((r) => (
          <ResourceCard key={r.id} resource={r} />
        ))}
      </div>
    </div>
  );
}
