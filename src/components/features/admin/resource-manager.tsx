"use client";

import { useState, useEffect, useMemo } from "react";
import type { Course, StudyResourceWithCourse, ResourceStatus } from "@/types/database";
import {
  getAllResourcesAdmin,
  updateResourceStatus,
  upsertResourceAdmin,
  deleteResource,
} from "@/lib/supabase/resources-api";

const statusBadge: Record<string, { cls: string; label: string }> = {
  published: { cls: "es-badge-green", label: "Đã duyệt" },
  pending: { cls: "es-badge-amber", label: "Chờ duyệt" },
  rejected: { cls: "es-badge-red", label: "Từ chối" },
};

const typeLabels: Record<string, string> = {
  video: "📺 Video",
  slide: "📄 Slide",
  exercise: "📝 Bài tập",
  exam: "🔗 Đề thi",
};

interface Props {
  userId: string;
  allCourses: Course[];
}

export default function ResourceManager({ allCourses }: Props) {
  const [resources, setResources] = useState<StudyResourceWithCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ResourceStatus | "all">("all");
  const [showAdd, setShowAdd] = useState(false);

  async function fetchAll() {
    setLoading(true);
    try { setResources(await getAllResourcesAdmin()); } catch (e) { console.error(e); }
    setLoading(false);
  }

  useEffect(() => { fetchAll(); }, []);

  const filtered = useMemo(
    () => statusFilter === "all" ? resources : resources.filter((r) => r.status === statusFilter),
    [resources, statusFilter]
  );

  async function handleApprove(id: string) {
    await updateResourceStatus(id, "published");
    fetchAll();
  }

  async function handleReject(id: string) {
    const note = prompt("Lý do từ chối (tùy chọn):");
    await updateResourceStatus(id, "rejected", note ?? undefined);
    fetchAll();
  }

  async function handleDelete(id: string) {
    if (!confirm("Xóa tài nguyên này?")) return;
    await deleteResource(id);
    fetchAll();
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div className="es-resource-filters">
          {(["all", "published", "pending", "rejected"] as const).map((s) => (
            <button
              key={s}
              className={`es-filter-btn${statusFilter === s ? " active" : ""}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === "all" ? "Tất cả" : statusBadge[s].label}
              {s !== "all" && ` (${resources.filter((r) => r.status === s).length})`}
            </button>
          ))}
        </div>
        <button className="es-btn es-btn-primary es-btn-sm" onClick={() => setShowAdd(true)}>
          + Thêm tài nguyên
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--es-muted)" }}>Đang tải...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--es-muted)" }}>Không có tài nguyên.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((r) => {
            const sb = statusBadge[r.status];
            return (
              <div key={r.id} className="es-card-sm" style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "var(--ink)" }}>
                    {typeLabels[r.resource_type] ?? r.resource_type} · {r.title}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--es-muted)", marginTop: 2 }}>
                    {r.course?.id} – {r.course?.name} · {r.source ?? "N/A"}
                  </div>
                  {r.admin_note && (
                    <div style={{ fontSize: 11, color: "var(--red)", marginTop: 2 }}>
                      Admin: {r.admin_note}
                    </div>
                  )}
                </div>
                <span className={`es-badge ${sb.cls}`}>{sb.label}</span>
                <div style={{ display: "flex", gap: 4 }}>
                  {r.status === "pending" && (
                    <>
                      <button className="es-btn es-btn-sm es-btn-outline" onClick={() => handleApprove(r.id)} style={{ color: "var(--green)" }}>✓</button>
                      <button className="es-btn es-btn-sm es-btn-outline" onClick={() => handleReject(r.id)} style={{ color: "var(--red)" }}>✗</button>
                    </>
                  )}
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="es-btn es-btn-sm es-btn-ghost">🔗</a>
                  <button className="es-btn es-btn-sm es-btn-ghost" onClick={() => handleDelete(r.id)} style={{ color: "var(--red)" }}>🗑</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAdd && (
        <AddResourceModal
          allCourses={allCourses}
          onClose={() => setShowAdd(false)}
          onSaved={fetchAll}
        />
      )}
    </div>
  );
}

function AddResourceModal({ allCourses, onClose, onSaved }: { allCourses: Course[]; onClose: () => void; onSaved: () => void }) {
  const [courseId, setCourseId] = useState("");
  const [type, setType] = useState("slide");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [source, setSource] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!courseId || !title.trim() || !url.trim()) return;
    setSaving(true);
    try {
      await upsertResourceAdmin({
        course_id: courseId,
        title: title.trim(),
        description: description.trim() || null,
        url: url.trim(),
        resource_type: type,
        source: source.trim() || null,
        status: "published",
      });
      onSaved();
      onClose();
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  }

  return (
    <div className="es-logout-overlay" onClick={onClose}>
      <div className="es-logout-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480, textAlign: "left" }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: "var(--ink)" }}>Thêm tài nguyên</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="es-input">
            <option value="">Chọn môn học *</option>
            {allCourses.map((c) => <option key={c.id} value={c.id}>{c.id} – {c.name}</option>)}
          </select>
          <select value={type} onChange={(e) => setType(e.target.value)} className="es-input">
            {Object.entries(typeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <input placeholder="Tiêu đề *" value={title} onChange={(e) => setTitle(e.target.value)} className="es-input" />
          <input placeholder="URL *" value={url} onChange={(e) => setUrl(e.target.value)} className="es-input" type="url" />
          <input placeholder="Nguồn" value={source} onChange={(e) => setSource(e.target.value)} className="es-input" />
          <textarea placeholder="Mô tả" value={description} onChange={(e) => setDescription(e.target.value)} className="es-input" rows={2} />
        </div>
        <div className="es-logout-btns" style={{ marginTop: 14 }}>
          <button className="es-btn es-btn-outline" onClick={onClose}>Huỷ</button>
          <button className="es-btn es-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu & Xuất bản"}
          </button>
        </div>
      </div>
    </div>
  );
}
