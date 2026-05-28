"use client";

import { useState, useEffect, useMemo } from "react";
import type { Course, StudyResourceWithCourse, ResourceStatus } from "@/types/database";
import {
  getAllResourcesAdmin,
  updateResourceStatus,
  upsertResourceAdmin,
  deleteResource,
  getResourceFileUrl,
  uploadResourceFile,
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

export default function ResourceManager({ userId, allCourses }: Props) {
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
                  <a href={r.file_path ? getResourceFileUrl(r.file_path) : (r.url ?? "#")} target="_blank" rel="noopener noreferrer" className="es-btn es-btn-sm es-btn-ghost">🔗</a>
                  <button className="es-btn es-btn-sm es-btn-ghost" onClick={() => handleDelete(r.id)} style={{ color: "var(--red)" }}>🗑</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAdd && (
        <AddResourceModal
          userId={userId}
          allCourses={allCourses}
          onClose={() => setShowAdd(false)}
          onSaved={fetchAll}
        />
      )}
    </div>
  );
}

function AddResourceModal({ userId, allCourses, onClose, onSaved }: { userId: string; allCourses: Course[]; onClose: () => void; onSaved: () => void }) {
  const [courseId, setCourseId] = useState("");
  const [type, setType] = useState("slide");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [source, setSource] = useState("");
  const [mode, setMode] = useState<"url" | "file">("url");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = courseId && title.trim() && (mode === "url" ? url.trim() : !!file);

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      let filePath: string | null = null;
      const finalUrl = mode === "url" ? url.trim() : null;

      if (mode === "file" && file) {
        filePath = await uploadResourceFile(file, userId);
      }

      await upsertResourceAdmin({
        course_id: courseId,
        title: title.trim(),
        description: description.trim() || null,
        url: finalUrl,
        file_path: filePath,
        resource_type: type,
        source: source.trim() || null,
        status: "published",
      });
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi khi lưu");
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
          <input placeholder="Nguồn" value={source} onChange={(e) => setSource(e.target.value)} className="es-input" />
          <textarea placeholder="Mô tả" value={description} onChange={(e) => setDescription(e.target.value)} className="es-input" rows={2} />

          {/* URL / File toggle */}
          <div style={{ display: "flex", gap: 6 }}>
            {(["url", "file"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`es-btn es-btn-sm ${mode === m ? "es-btn-primary" : "es-btn-outline"}`}
              >
                {m === "url" ? "🔗 Link URL" : "📎 Upload file"}
              </button>
            ))}
          </div>

          {mode === "url" ? (
            <input placeholder="URL *" value={url} onChange={(e) => setUrl(e.target.value)} className="es-input" type="url" />
          ) : (
            <div
              style={{
                border: "2px dashed var(--es-border)", borderRadius: "var(--r-sm)",
                padding: "20px 16px", textAlign: "center", cursor: "pointer",
                background: "var(--es-bg-alt)", fontSize: 13, color: "var(--es-muted)",
              }}
              onClick={() => document.getElementById("admin-file-upload")?.click()}
            >
              {file ? (
                <span style={{ color: "var(--ink)", fontWeight: 600 }}>📄 {file.name}</span>
              ) : (
                "Click để chọn file PDF *"
              )}
              <input
                id="admin-file-upload"
                type="file"
                accept=".pdf,.ppt,.pptx,.doc,.docx"
                style={{ display: "none" }}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
          )}

          {error && <div style={{ fontSize: 12, color: "var(--red)" }}>⚠️ {error}</div>}
        </div>
        <div className="es-logout-btns" style={{ marginTop: 14 }}>
          <button className="es-btn es-btn-outline" onClick={onClose}>Huỷ</button>
          <button className="es-btn es-btn-primary" onClick={handleSave} disabled={saving || !canSave}>
            {saving ? "Đang lưu..." : "Lưu & Xuất bản"}
          </button>
        </div>
      </div>
    </div>
  );
}
