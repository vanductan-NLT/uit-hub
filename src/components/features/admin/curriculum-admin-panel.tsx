"use client";

import { useEffect, useRef, useState } from "react";
import { parseUitCtdt, type CtdtParseResult } from "@/lib/parsers/uit-ctdt-parser";
import { upsertCurriculum, fetchCtdtFromUrl } from "@/lib/supabase/curriculum-api";
import { listCurricula } from "@/lib/data/curriculum-registry";
import { khoaLabel } from "@/lib/validation-utils";
import type { Curriculum } from "@/types/database";

const MAJORS = ["CNTT", "KTPM", "KHMT", "MMT&TT", "ATTT", "HTTT", "TTNT", "Khác"];

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 12px", borderRadius: "var(--r)",
  border: "1.5px solid var(--es-border)", fontFamily: "inherit",
  fontSize: 14, background: "var(--white)", color: "var(--ink)",
};

/**
 * Admin-only tool to populate the central curricula store. Admin picks
 * major + năm nhập học, then either pastes the public UIT per-major URL
 * (fetched + parsed server-side) or drops the saved HTML. Imports here bind
 * no user — any student with the matching major+year auto-resolves them.
 */
export default function CurriculumAdminPanel() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [major, setMajor] = useState("CNTT");
  const [intakeYear, setIntakeYear] = useState(new Date().getFullYear() - 1);
  const [url, setUrl] = useState("");

  const [result, setResult] = useState<CtdtParseResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [existing, setExisting] = useState<Curriculum[]>([]);

  useEffect(() => { refreshList(); }, []);
  function refreshList() { listCurricula().then(setExisting); }

  function parse(html: string) {
    setError(null);
    setDone(null);
    const r = parseUitCtdt(html, major, intakeYear);
    if (r.courses.length === 0) {
      setResult(null);
      setError(r.errors[0] ?? "Không tìm thấy môn học nào trong nội dung.");
    } else {
      setResult(r);
    }
  }

  async function handleFetchUrl() {
    if (!url.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetchCtdtFromUrl(url.trim());
      if (res.error || !res.html) setError(res.error ?? "Không tải được trang.");
      else parse(res.html);
    } finally {
      setBusy(false);
    }
  }

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => parse(e.target?.result as string);
    reader.readAsText(file, "utf-8");
  }

  async function handleImport() {
    if (!result) return;
    setBusy(true);
    setError(null);
    try {
      const res = await upsertCurriculum(result); // no userId → central only
      if (res.errors.length > 0) setError(res.errors.join(" · "));
      else {
        setDone(`${res.curriculumId} · ${res.coursesLinked} môn`);
        setResult(null);
        refreshList();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import thất bại.");
    } finally {
      setBusy(false);
    }
  }

  const bySemester = result?.courses.reduce<Record<number, number>>((acc, c) => {
    acc[c.suggested_semester] = (acc[c.suggested_semester] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="es-card" style={{ padding: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>🎓 Nạp CTĐT vào hệ thống</div>
      <div style={{ fontSize: 12, color: "var(--es-muted)", marginBottom: 16 }}>
        Sinh viên cùng ngành + năm nhập học sẽ tự nhận CTĐT này, không cần tự import.
      </div>

      {/* major / year selectors */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 120px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Ngành</div>
          <select value={major} onChange={(e) => setMajor(e.target.value)} style={inputStyle}>
            {MAJORS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div style={{ flex: "1 1 120px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Năm nhập học</div>
          <input type="number" min={2013} max={2030} value={intakeYear}
            onChange={(e) => setIntakeYear(parseInt(e.target.value) || intakeYear)} style={inputStyle} />
          <div style={{ fontSize: 11, color: "var(--es-muted)", marginTop: 4 }}>{khoaLabel(intakeYear)}</div>
        </div>
      </div>

      {/* paste URL */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Dán link CTĐT của ngành (student.uit.edu.vn)</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={url} onChange={(e) => setUrl(e.target.value)}
            placeholder="https://student.uit.edu.vn/content/cu-nhan-nganh-..." style={inputStyle} />
          <button className="es-btn es-btn-primary" onClick={handleFetchUrl} disabled={busy || !url.trim()}>
            {busy ? "..." : "Tải & phân tích"}
          </button>
        </div>
      </div>

      {/* file drop fallback */}
      <div
        style={{
          border: `2px dashed ${result ? "var(--green)" : "var(--es-border)"}`,
          borderRadius: "var(--r-xl)", padding: 16, textAlign: "center",
          cursor: "pointer", marginBottom: 14, background: "var(--bg)",
        }}
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, color: result ? "var(--green)" : "var(--ink)" }}>
          {result
            ? `${result.courses.length} môn · ${Object.keys(bySemester ?? {}).length} học kỳ`
            : "hoặc kéo thả / click chọn file HTML đã lưu"}
        </div>
        <input ref={fileRef} type="file" accept=".html,.htm" style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </div>

      {result && bySemester && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {Object.entries(bySemester).sort(([a], [b]) => Number(a) - Number(b)).map(([sem, count]) => (
            <span key={sem} style={{
              padding: "4px 10px", borderRadius: "var(--r-full)",
              background: "var(--blue-lt)", fontSize: 11, fontWeight: 700, color: "var(--blue)",
            }}>HK{sem}: {count}</span>
          ))}
        </div>
      )}

      {error && <div className="es-alert-strip warn" style={{ marginBottom: 12 }}><span>⚠️</span><span>{error}</span></div>}
      {done && <div className="es-alert-strip" style={{ marginBottom: 12 }}><span>✅</span><span>Đã nạp {done}</span></div>}

      {result && (
        <button className="es-btn es-btn-primary" onClick={handleImport} disabled={busy} style={{ marginBottom: 18 }}>
          {busy ? "Đang nạp..." : `📥 Nạp ${major} ${khoaLabel(intakeYear)}`}
        </button>
      )}

      {/* existing curricula */}
      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink2)", marginBottom: 8 }}>
        Đã có trong hệ thống ({existing.length})
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {existing.length === 0
          ? <span style={{ fontSize: 12, color: "var(--es-muted)" }}>Chưa có CTĐT nào.</span>
          : existing.map((c) => (
            <span key={c.id} style={{
              padding: "4px 10px", borderRadius: "var(--r-full)",
              background: "var(--es-bg-alt, #f1f3f5)", fontSize: 11, fontWeight: 600, color: "var(--ink)",
            }}>{c.major} · {khoaLabel(c.intake_year_from)}</span>
          ))}
      </div>
    </div>
  );
}
