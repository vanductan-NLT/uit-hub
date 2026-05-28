"use client";

import { useState } from "react";
import type { Course } from "@/types/database";
import { submitResource, uploadResourceFile } from "@/lib/supabase/resources-api";
import { validateResourceFile } from "@/lib/validation-utils";

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

type InputMode = "url" | "file";

export default function SubmitResourceModal({ userId, courses, onClose, onSubmitted }: Props) {
  const [courseId, setCourseId] = useState("");
  const [type, setType] = useState("slide");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [source, setSource] = useState("");

  const [mode, setMode] = useState<InputMode>("url");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0] ?? null;
    setFile(null);
    setFileError(null);
    if (!picked) return;
    const result = validateResourceFile(picked);
    if (!result.valid) {
      setFileError(result.error);
      e.target.value = "";
      return;
    }
    setFile(picked);
  }

  async function handleSubmit() {
    if (!courseId || !title.trim()) {
      setError("Vui lòng điền đầy đủ: Môn học và Tiêu đề.");
      return;
    }
    if (mode === "url" && !url.trim()) {
      setError("Vui lòng nhập URL tài nguyên.");
      return;
    }
    if (mode === "file" && !file) {
      setError("Vui lòng chọn file để upload.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      let filePath: string | null = null;

      if (mode === "file" && file) {
        setUploadProgress(true);
        filePath = await uploadResourceFile(file, userId);
        setUploadProgress(false);
      }

      await submitResource({
        course_id: courseId,
        title: title.trim(),
        description: description.trim() || null,
        url: mode === "url" ? url.trim() : null,
        file_path: filePath,
        resource_type: type,
        source: source.trim() || null,
        submitted_by: userId,
      });
      onSubmitted();
      setDone(true);
    } catch (err) {
      setUploadProgress(false);
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="es-logout-overlay" onClick={onClose}>
        <div className="es-logout-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6, color: "var(--ink)" }}>Đã gửi thành công!</div>
          <div style={{ fontSize: 13, color: "var(--es-muted)", marginBottom: 4 }}>
            Tài nguyên <strong style={{ color: "var(--ink)" }}>{title}</strong> đang chờ admin duyệt.
          </div>
          <div style={{ fontSize: 12, color: "var(--es-muted)", marginBottom: 20, lineHeight: 1.6 }}>
            Bạn có thể theo dõi trạng thái ở mục <strong>Đóng góp của tôi</strong> ngay bên dưới bộ lọc.
          </div>
          <button className="es-btn es-btn-primary" onClick={onClose}>Đóng</button>
        </div>
      </div>
    );
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

          {/* URL / File toggle */}
          <div style={{ display: "flex", gap: 6 }}>
            <button
              type="button"
              onClick={() => { setMode("url"); setFile(null); setFileError(null); }}
              style={{
                flex: 1, padding: "6px 0", borderRadius: "var(--r-sm)", fontSize: 13, fontWeight: 600,
                border: `1.5px solid ${mode === "url" ? "var(--blue)" : "var(--es-border)"}`,
                background: mode === "url" ? "var(--blue-lt)" : "transparent",
                color: mode === "url" ? "var(--blue)" : "var(--es-muted)",
                cursor: "pointer",
              }}
            >
              🔗 Nhập URL
            </button>
            <button
              type="button"
              onClick={() => { setMode("file"); setUrl(""); }}
              style={{
                flex: 1, padding: "6px 0", borderRadius: "var(--r-sm)", fontSize: 13, fontWeight: 600,
                border: `1.5px solid ${mode === "file" ? "var(--blue)" : "var(--es-border)"}`,
                background: mode === "file" ? "var(--blue-lt)" : "transparent",
                color: mode === "file" ? "var(--blue)" : "var(--es-muted)",
                cursor: "pointer",
              }}
            >
              📎 Upload file
            </button>
          </div>

          {mode === "url" ? (
            <input
              placeholder="URL tài nguyên *"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="es-input"
              type="url"
            />
          ) : (
            <div>
              <label
                style={{
                  display: "block", padding: "10px 12px", borderRadius: "var(--r-sm)",
                  border: "1.5px dashed var(--es-border)", cursor: "pointer",
                  background: "var(--es-bg-alt)", textAlign: "center", fontSize: 13,
                  color: file ? "var(--ink)" : "var(--es-muted)",
                }}
              >
                {file ? `📎 ${file.name}` : "Chọn file PDF, PPTX, PPT, DOCX, DOC (tối đa 50MB)"}
                <input
                  type="file"
                  accept=".pdf,.pptx,.ppt,.docx,.doc"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
              </label>
              {fileError && (
                <div style={{ color: "var(--red)", fontSize: 12, marginTop: 4 }}>{fileError}</div>
              )}
            </div>
          )}

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
          <button className="es-btn es-btn-outline" onClick={onClose} disabled={submitting}>Huỷ</button>
          <button className="es-btn es-btn-primary" onClick={handleSubmit} disabled={submitting}>
            {uploadProgress ? "Đang upload..." : submitting ? "Đang gửi..." : "Gửi đóng góp"}
          </button>
        </div>
      </div>
    </div>
  );
}
