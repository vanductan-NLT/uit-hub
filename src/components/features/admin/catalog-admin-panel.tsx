"use client";

import { useRef, useState } from "react";
import { parseUitCourseCatalog, type CatalogParseResult } from "@/lib/parsers/uit-course-catalog-parser";
import { upsertCatalogCourses } from "@/lib/supabase/curriculum-api";

export default function CatalogAdminPanel() {
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
    setDone(null);
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
      setResult(null);
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Import thất bại.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="es-card" style={{ maxWidth: 640 }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)", marginBottom: 4 }}>
        📚 Danh mục môn học
      </div>
      <div style={{ fontSize: 12, color: "var(--es-muted)", marginBottom: 20 }}>
        Nguồn: daa.uit.edu.vn/danh-muc-mon-hoc-dai-hoc · tiên quyết + tương đương
      </div>

      {/* 3-step guide */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        {[
          {
            n: 1,
            label: "Mở trang danh mục",
            detail: (
              <a
                href="https://daa.uit.edu.vn/danh-muc-mon-hoc-dai-hoc"
                target="_blank" rel="noopener noreferrer"
                style={{ color: "var(--blue)", textDecoration: "none", fontWeight: 600 }}
              >
                daa.uit.edu.vn/danh-muc-mon-hoc-dai-hoc ↗
              </a>
            ),
          },
          {
            n: 2,
            label: "Lưu trang về máy",
            detail: <span style={{ color: "var(--es-muted)" }}>Ctrl+S → chọn <strong>Webpage, HTML Only</strong> (.html)</span>,
          },
          {
            n: 3,
            label: "Kéo thả file vào đây",
            detail: <span style={{ color: "var(--es-muted)" }}>hoặc click vùng bên dưới để chọn file</span>,
          },
        ].map(({ n, label, detail }) => (
          <div key={n} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
              background: "var(--blue)", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700,
            }}>{n}</div>
            <div style={{ paddingTop: 2 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{label}</div>
              <div style={{ fontSize: 12, marginTop: 1 }}>{detail}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Drop zone */}
      <div
        style={{
          border: `2px dashed ${result ? "var(--green)" : "var(--es-border)"}`,
          borderRadius: "var(--r-xl)", padding: "20px",
          textAlign: "center", cursor: "pointer",
          marginBottom: 16, background: "var(--bg)",
          transition: "border-color 0.15s",
        }}
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
      >
        <div style={{ fontSize: 24, marginBottom: 6 }}>{result ? "✅" : "📄"}</div>
        <div style={{ fontWeight: 600, fontSize: 13, color: result ? "var(--green)" : "var(--ink)" }}>
          {result ? `${result.courses.length} môn học đã nhận diện` : "Kéo thả hoặc click để chọn file HTML"}
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

      {done && (
        <div className="es-alert-strip" style={{ marginBottom: 12, background: "var(--duo-green-lt)", borderColor: "var(--duo-green)22" }}>
          <span>✅</span><span>{done.upserted} môn học đã được cập nhật vào hệ thống.</span>
        </div>
      )}

      {parseError && (
        <div className="es-alert-strip warn" style={{ marginBottom: 12 }}>
          <span>⚠️</span><span>{parseError}</span>
        </div>
      )}

      {result && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            className="es-btn es-btn-primary"
            onClick={handleImport}
            disabled={importing}
          >
            {importing ? "Đang import..." : `📥 Import ${result.courses.length} môn`}
          </button>
        </div>
      )}
    </div>
  );
}
