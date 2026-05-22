"use client";

import { useRef, useState } from "react";
import { parseUitCourseCatalog, type CatalogParseResult } from "@/lib/parsers/uit-course-catalog-parser";
import { upsertCatalogCourses } from "@/lib/supabase/curriculum-api";

interface Props {
  onSuccess: () => void;
  onClose: () => void;
}

export default function ImportCatalogModal({ onSuccess, onClose }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<CatalogParseResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState<{ upserted: number } | null>(null);

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => parseHtml(e.target?.result as string);
    reader.readAsText(file, "utf-8");
  }

  function parseHtml(html: string) {
    setParseError(null);
    setResult(null);
    const r = parseUitCourseCatalog(html);
    if (r.courses.length === 0) {
      setParseError(r.errors[0] ?? "Không tìm thấy môn học nào trong file.");
    } else {
      setResult(r);
    }
  }

  async function handleImport() {
    if (!result) return;
    setImporting(true);
    try {
      const res = await upsertCatalogCourses(result.courses);
      if (res.errors.length > 0) setParseError(res.errors.join(" · "));
      setDone({ upserted: res.upserted });
      onSuccess();
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Import thất bại.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="es-logout-overlay" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--white)", borderRadius: "var(--r-2xl)",
          padding: 28, width: "min(520px, calc(100vw - 32px))",
          boxShadow: "var(--shadow-clay)",
          animation: "duo-bounce-in 0.3s cubic-bezier(0.34,1.56,0.64,1)",
          maxHeight: "90dvh", overflowY: "auto",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "var(--ink)" }}>📚 Import danh mục môn học</div>
            <div style={{ fontSize: 12, color: "var(--es-muted)", marginTop: 3 }}>
              Nguồn: daa.uit.edu.vn/danh-muc-mon-hoc-dai-hoc
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "var(--es-muted)" }}>×</button>
        </div>

        {!done ? (
          <>
            {/* File input */}
            <div
              style={{
                border: "2px dashed var(--es-border)", borderRadius: "var(--r-xl)",
                padding: "32px 20px", textAlign: "center", cursor: "pointer",
                marginBottom: 16, background: "var(--bg)",
              }}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
              <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ink)" }}>
                {result ? `✅ ${result.courses.length} môn học đã parse` : "Kéo thả file HTML hoặc click để chọn"}
              </div>
              <div style={{ fontSize: 12, color: "var(--es-muted)", marginTop: 4 }}>
                Lưu trang daa.uit.edu.vn/danh-muc-mon-hoc-dai-hoc → Save as HTML
              </div>
              <input ref={fileRef} type="file" accept=".html,.htm" style={{ display: "none" }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </div>

            {/* Preview */}
            {result && (
              <div className="es-card" style={{ padding: "14px 16px", marginBottom: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: "var(--ink)" }}>
                  Xem trước · {result.courses.length} môn
                  {result.skipped > 0 && <span style={{ color: "var(--es-muted)", fontWeight: 400 }}> · bỏ qua {result.skipped}</span>}
                </div>
                <div style={{ maxHeight: 160, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
                  {result.courses.slice(0, 10).map((c) => (
                    <div key={c.id} style={{ display: "flex", gap: 8, fontSize: 12 }}>
                      <span className="es-mono" style={{ color: "var(--blue)", flexShrink: 0, minWidth: 60 }}>{c.id}</span>
                      <span style={{ color: "var(--ink)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                      <span style={{ color: "var(--es-muted)", flexShrink: 0 }}>{c.credits}TC</span>
                      {c.prerequisites.length > 0 && <span style={{ color: "var(--amber)", flexShrink: 0 }}>↑{c.prerequisites.length}</span>}
                    </div>
                  ))}
                  {result.courses.length > 10 && (
                    <div style={{ fontSize: 11, color: "var(--es-muted)", textAlign: "center", paddingTop: 4 }}>
                      ... và {result.courses.length - 10} môn nữa
                    </div>
                  )}
                </div>
              </div>
            )}

            {parseError && (
              <div className="es-alert-strip warn" style={{ marginBottom: 12 }}>
                <span>⚠️</span><span>{parseError}</span>
              </div>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="es-btn es-btn-outline" onClick={onClose}>Huỷ</button>
              <button
                className="es-btn es-btn-primary"
                onClick={handleImport}
                disabled={!result || importing}
              >
                {importing ? "Đang import..." : `📥 Import ${result?.courses.length ?? 0} môn`}
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Import thành công!</div>
            <div style={{ fontSize: 13, color: "var(--es-muted)", marginBottom: 20 }}>
              {done.upserted} môn học đã được cập nhật vào hệ thống.
            </div>
            <button className="es-btn es-btn-primary" onClick={onClose}>Đóng</button>
          </div>
        )}
      </div>
    </div>
  );
}
