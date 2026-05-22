"use client";

import type { ReactNode } from "react";

interface EmptyStateProps {
  /** Emoji or short glyph shown above the title. Defaults to a neutral inbox. */
  icon?: string;
  title: string;
  description?: string;
  /** Primary CTA — when both label + handler are set, renders a filled button. */
  actionLabel?: string;
  onAction?: () => void;
  /** Optional secondary hint rendered below the CTA (e.g. "hoặc thêm thủ công"). */
  secondary?: ReactNode;
}

/**
 * Reusable empty-state card matching the existing panel pattern
 * (see gpa-panel "Chưa có môn đang học"). Every empty panel should funnel
 * the user toward Import via the primary CTA.
 */
export default function EmptyState({
  icon = "📭",
  title,
  description,
  actionLabel,
  onAction,
  secondary,
}: EmptyStateProps) {
  return (
    <div className="es-card" style={{ textAlign: "center", padding: 40, color: "var(--es-muted)" }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontWeight: 600, marginBottom: 4, color: "var(--ink)" }}>{title}</div>
      {description && (
        <div
          style={{
            fontSize: 13,
            marginBottom: actionLabel && onAction ? 20 : 0,
            maxWidth: 380,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          {description}
        </div>
      )}
      {actionLabel && onAction && (
        <button className="es-btn es-btn-primary" onClick={onAction} style={{ margin: "0 auto" }}>
          {actionLabel}
        </button>
      )}
      {secondary && (
        <div style={{ fontSize: 12, marginTop: 12, color: "var(--es-muted)" }}>{secondary}</div>
      )}
    </div>
  );
}
