"use client";

import { useState } from "react";
import type { Course } from "@/types/database";
import { submitResource } from "@/lib/supabase/resources-api";

interface Props {
  userId: string;
  courses: Course[];
  onClose: () => void;
  onSubmitted: () => void;
}

const resourceTypes = [
  { value: "video", label: "📺 Video" },
  { value: "slide", label: "📄 Slide & PDF" },
  { value: "exercise", label: "📝 Bài tập" },
  { value: "exam", label: "🔗 Đề thi cũ" },
];

export default function SubmitResourceModal({ userId, courses, onClose, onSubmitted }: Props) {
  const [courseId, setCourseId] = useState("");
  const [type, setType] = useState("slide");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [source, setSource] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!courseId || !title.trim() || !url.trim()) {
      setError("Vui lòng điền đầy đủ: Môn học, Tiêu đề, và URL.");
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      await submitResource({
        course_id: courseId,
        title: title.trim(),
        description: description.trim() || null,
        url: url.trim(),
        resource_type: type,
        source: source.trim() || null,
        submitted_by: userId,
      });
      onSubmitted();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="es-logout-overlay" onClick={onClose}>
      <div
        className="es-logout-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 480, textAlign: "left" }}
      >
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", marginBottom: 14 }}>
          📤 Đóng góp tài nguyên
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="es-input">
            <option value="">Chọn môn học *</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.id} – {c.name}</option>
            ))}
          </select>

          <select value={type} onChange={(e) => setType(e.target.value)} className="es-input">
            {resourceTypes.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          <input
            placeholder="Tiêu đề *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="es-input"
          />

          <input
            placeholder="URL tài nguyên *"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="es-input"
            type="url"
          />

          <input
            placeholder="Nguồn (YouTube, GitHub, UIT Drive...)"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="es-input"
          />

          <textarea
            placeholder="Mô tả ngắn (tùy chọn)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="es-input"
            rows={2}
            style={{ resize: "vertical" }}
          />
        </div>

        {error && (
          <div style={{ color: "var(--red)", fontSize: 12, marginTop: 8 }}>{error}</div>
        )}

        <div style={{ fontSize: 11, color: "var(--es-muted)", marginTop: 8 }}>
          Tài nguyên sẽ được admin duyệt trước khi hiển thị.
        </div>

        <div className="es-logout-btns" style={{ marginTop: 14 }}>
          <button className="es-btn es-btn-outline" onClick={onClose}>Huỷ</button>
          <button className="es-btn es-btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Đang gửi..." : "Gửi đóng góp"}
          </button>
        </div>
      </div>
    </div>
  );
}
