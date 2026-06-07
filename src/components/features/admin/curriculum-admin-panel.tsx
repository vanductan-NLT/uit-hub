"use client";

import { useEffect, useRef, useState } from "react";
import { parseUitCtdt, type CtdtParseResult } from "@/lib/parsers/uit-ctdt-parser";
import { upsertCurriculum, fetchCtdtFromUrl } from "@/lib/supabase/curriculum-api";
import { listCurricula } from "@/lib/data/curriculum-registry";
import { khoaLabel } from "@/lib/validation-utils";
import type { Curriculum } from "@/types/database";

const MAJORS = ["CNTT", "KTPM", "KHMT", "MMT&TT", "ATTT", "HTTT", "TTNT", "Khác"];
type HeDaoTao = "chinh-quy" | "tu-xa";

function buildCtdtUrl(year: number, he: HeDaoTao): string {
  if (he === "tu-xa") return `https://student.uit.edu.vn/tu-xa/ctdt-khoa-${year}`;
  const seg = year >= 2025 ? "cqui" : "chuong-trinh-dao-tao";
  return `https://student.uit.edu.vn/${seg}/ctdt-khoa-${year}`;
}

// Best-effort slug → major mapping (UIT slugs are irregular; this is advisory)
const SLUG_TO_MAJOR: [string, string][] = [
  ["khoa-hoc-may-tinh", "KHMT"],
  ["cong-nghe-thong-tin", "CNTT"],
  ["ky-thuat-phan-mem", "KTPM"],
  ["an-toan-thong-tin", "ATTT"],
  ["toan-thong-tin", "ATTT"],   // irregular slug used in some years
  ["he-thong-thong-tin", "HTTT"],
  ["mang-may-tinh", "MMT&TT"],
  ["tri-tue-nhan-tao", "TTNT"],
];

function detectFromUrl(url: string): { major?: string; year?: number; he?: HeDaoTao } {
  const lower = url.toLowerCase();
  const yearMatch = lower.match(/khoa-\d+-(\d{4})/);
  const year = yearMatch ? parseInt(yearMatch[1]) : undefined;
  const major = SLUG_TO_MAJOR.find(([slug]) => lower.includes(slug))?.[1];
  const he: HeDaoTao | undefined = lower.includes("/tu-xa/") ? "tu-xa"
    : (lower.includes("/cqui/") || lower.includes("/chuong-trinh-dao-tao/")) ? "chinh-quy"
    : undefined;
  return { major, year, he };
}

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
  const [he, setHe] = useState<HeDaoTao>("chinh-quy");
  const [detected, setDetected] = useState<{ major?: string; year?: number }>({});

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

  const needsManual = !url.trim() || !detected.major || !detected.year;

  return (
    <div className="es-card" style={{ maxWidth: 680, padding: 24 }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>🎓 Nạp CTĐT vào hệ thống</div>
        <div style={{ fontSize: 12, color: "var(--es-muted)", marginTop: 3 }}>
          Sinh viên cùng ngành + năm nhập học sẽ tự nhận CTĐT này, không cần tự import.
        </div>
      </div>

      {/* Hệ đào tạo toggle */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--es-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Hệ đào tạo</div>
        <div style={{ display: "flex", border: "1.5px solid var(--es-border)", borderRadius: "var(--r)", overflow: "hidden", width: "fit-content" }}>
          {(["chinh-quy", "tu-xa"] as HeDaoTao[]).map((val) => (
            <button key={val} onClick={() => setHe(val)} style={{
              padding: "6px 16px", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "inherit",
              background: he === val ? "var(--blue)" : "var(--white)",
              color: he === val ? "#fff" : "var(--es-muted)",
              borderRight: val === "chinh-quy" ? "1.5px solid var(--es-border)" : "none",
            }}>
              {val === "chinh-quy" ? "Chính quy" : "Từ xa"}
            </button>
          ))}
        </div>
      </div>

      {/* URL input */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--es-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Dán link CTĐT của ngành</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={url} onChange={(e) => {
            const v = e.target.value; setUrl(v);
            const d = detectFromUrl(v); setDetected(d);
            if (d.major && MAJORS.includes(d.major)) setMajor(d.major);
            if (d.year && d.year >= 2013 && d.year <= 2030) setIntakeYear(d.year);
            if (d.he) setHe(d.he);
          }} placeholder="https://student.uit.edu.vn/content/cu-nhan-nganh-..." style={inputStyle} />
          <button className="es-btn es-btn-primary" onClick={handleFetchUrl} disabled={busy || !url.trim()}>
            {busy ? "..." : "Tải & phân tích"}
          </button>
        </div>
        {/* feedback row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
          {url.trim() ? (
            detected.major || detected.year
              ? <span style={{ fontSize: 12, fontWeight: 600, color: "var(--duo-green, #16a34a)" }}>✓ Phát hiện: {detected.major ?? "?"} · {detected.year ? khoaLabel(detected.year) : "?"}{detected.he ? ` · ${detected.he === "tu-xa" ? "Từ xa" : "Chính quy"}` : ""}</span>
              : <span style={{ fontSize: 12, color: "var(--amber)" }}>⚠ Không nhận ra ngành/năm — chọn thủ công bên dưới</span>
          ) : <span />}
          <a href={buildCtdtUrl(intakeYear, he)} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 11, color: "var(--blue)", textDecoration: "none", whiteSpace: "nowrap" }}>
            Tra cứu student.uit.edu.vn ↗
          </a>
        </div>
      </div>

      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0" }}>
        <div style={{ flex: 1, height: 1, background: "var(--es-border)" }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--es-muted)" }}>HOẶC</span>
        <div style={{ flex: 1, height: 1, background: "var(--es-border)" }} />
      </div>

      {/* File drop */}
      <div onClick={() => fileRef.current?.click()} onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        style={{ border: `2px dashed ${result ? "var(--duo-green)" : "var(--es-border)"}`, borderRadius: "var(--r-xl)",
          padding: "14px 20px", textAlign: "center", cursor: "pointer", background: "var(--bg)", marginBottom: needsManual ? 12 : 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: result ? "var(--duo-green)" : "var(--ink)" }}>
          {result ? `✓ ${result.courses.length} môn · ${Object.keys(bySemester ?? {}).length} học kỳ` : "Kéo thả file HTML đã lưu"}
        </div>
        {!result && <div style={{ fontSize: 11, color: "var(--es-muted)", marginTop: 2 }}>hoặc click để chọn file</div>}
        <input ref={fileRef} type="file" accept=".html,.htm" style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </div>

      {/* Manual selectors — only when URL didn't fully detect */}
      {needsManual && (
        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 140px" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--es-muted)", marginBottom: 4 }}>Ngành</div>
            <select value={major} onChange={(e) => setMajor(e.target.value)} style={{ ...inputStyle, fontSize: 13 }}>
              {MAJORS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div style={{ flex: "1 1 140px" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--es-muted)", marginBottom: 4 }}>Năm nhập học</div>
            <input type="number" min={2013} max={2030} value={intakeYear}
              onChange={(e) => setIntakeYear(parseInt(e.target.value) || intakeYear)} style={{ ...inputStyle, fontSize: 13 }} />
            <div style={{ fontSize: 11, color: "var(--es-muted)", marginTop: 3 }}>{khoaLabel(intakeYear)}</div>
          </div>
        </div>
      )}

      {/* Semester preview */}
      {result && bySemester && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {Object.entries(bySemester).sort(([a], [b]) => Number(a) - Number(b)).map(([sem, count]) => (
            <span key={sem} style={{ padding: "4px 10px", borderRadius: "var(--r-full)", background: "var(--blue-lt)", fontSize: 11, fontWeight: 700, color: "var(--blue)" }}>
              HK{sem}: {count}
            </span>
          ))}
        </div>
      )}

      {error && <div className="es-alert-strip warn" style={{ marginBottom: 12 }}><span>⚠️</span><span>{error}</span></div>}
      {done && <div className="es-alert-strip" style={{ marginBottom: 12 }}><span>✅</span><span>Đã nạp {done}</span></div>}

      {result && (
        <button className="es-btn es-btn-primary" onClick={handleImport} disabled={busy} style={{ marginBottom: 24 }}>
          {busy ? "Đang nạp..." : `📥 Nạp ${major} ${khoaLabel(intakeYear)}`}
        </button>
      )}

      {/* Existing curricula */}
      <div style={{ borderTop: "1px solid var(--es-border)", paddingTop: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--es-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
          Đã có trong hệ thống ({existing.length})
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {existing.length === 0
            ? <span style={{ fontSize: 12, color: "var(--es-muted)" }}>Chưa có CTĐT nào.</span>
            : existing.map((c) => (
              <span key={c.id} style={{ padding: "4px 10px", borderRadius: "var(--r-full)", background: "var(--es-bg-alt, #f1f3f5)", fontSize: 11, fontWeight: 600, color: "var(--ink)" }}>
                {c.major} · {khoaLabel(c.intake_year_from)}
              </span>
            ))}
        </div>
      </div>
    </div>
  );
}
