"use client";

import { useState, useEffect } from "react";
import type { StudyResourceWithCourse } from "@/types/database";
import { getMySubmissions, getResourceFileUrl } from "@/lib/supabase/resources-api";

const STATUS_CFG = {
  pending:   { cls: "es-badge-amber", label: "⏳ Chờ duyệt" },
  published: { cls: "es-badge-green", label: "✅ Đã duyệt" },
  rejected:  { cls: "es-badge-red",   label: "❌ Từ chối" },
} as const;

interface Props {
  userId: string;
  refreshKey?: number;
}

export default function MySubmissionsSection({ userId, refreshKey }: Props) {
  const [items, setItems] = useState<StudyResourceWithCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    getMySubmissions(userId)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [userId, refreshKey]);

  if (loading || items.length === 0) return null;

  const pendingCount = items.filter((i) => i.status === "pending").length;

  return (
    <div className="es-card" style={{ marginBottom: 16, padding: "10px 14px" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          width: "100%", background: "none", border: "none", cursor: "pointer",
          padding: 0, color: "var(--ink)",
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 13 }}>
          📤 Đóng góp của tôi
          {pendingCount > 0 && (
            <span className="es-badge es-badge-amber" style={{ marginLeft: 8 }}>
              {pendingCount} chờ duyệt
            </span>
          )}
        </span>
        <span style={{ fontSize: 11, color: "var(--es-muted)" }}>{open ? "▲" : "▼"} {items.length} tài nguyên</span>
      </button>

      {open && (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
          {items.map((r) => {
            const cfg = STATUS_CFG[r.status as keyof typeof STATUS_CFG];
            const href = r.file_path ? getResourceFileUrl(r.file_path) : (r.url ?? undefined);
            return (
              <div
                key={r.id}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "7px 10px",
                  borderRadius: "var(--r-sm)", background: "var(--es-bg-alt)",
                  border: "1px solid var(--es-border)", fontSize: 13,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {r.title}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--es-muted)", marginTop: 1 }}>
                    {r.course?.id} · {r.resource_type}
                  </div>
                  {r.status === "rejected" && r.admin_note && (
                    <div style={{ fontSize: 11, color: "var(--red)", marginTop: 2 }}>
                      Lý do: {r.admin_note}
                    </div>
                  )}
                </div>
                <span className={`es-badge ${cfg.cls}`} style={{ flexShrink: 0 }}>{cfg.label}</span>
                {href && (
                  <a href={href} target="_blank" rel="noopener noreferrer"
                    className="es-btn es-btn-sm es-btn-ghost" style={{ flexShrink: 0 }}>
                    🔗
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
