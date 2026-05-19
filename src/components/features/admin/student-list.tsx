"use client";

import { useState, useEffect, useMemo } from "react";
import { getStudentsWithProgress, type StudentWithProgress } from "@/lib/supabase/admin-api";

export default function StudentList() {
  const [students, setStudents] = useState<StudentWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getStudentsWithProgress()
      .then(setStudents)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return students;
    const q = search.toLowerCase();
    return students.filter(
      (s) =>
        s.full_name?.toLowerCase().includes(q) ||
        s.student_id?.toLowerCase().includes(q) ||
        s.major?.toLowerCase().includes(q)
    );
  }, [students, search]);

  if (loading) {
    return <div style={{ textAlign: "center", padding: 40, color: "var(--es-muted)" }}>Đang tải...</div>;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: "var(--es-muted)" }}>{students.length} sinh viên đã đăng ký</div>
        <input
          placeholder="Tìm theo tên hoặc MSSV..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "6px 12px", borderRadius: "var(--r-sm)",
            border: "1px solid var(--es-border)", fontFamily: "inherit",
            fontSize: 13, width: 240, outline: "none",
            background: "var(--white)", color: "var(--ink)",
          }}
        />
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--es-muted)" }}>Không tìm thấy sinh viên.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="es-admin-table">
            <thead>
              <tr>
                <th>MSSV</th>
                <th>Họ tên</th>
                <th>Ngành</th>
                <th>Khóa</th>
                <th>Đã hoàn thành</th>
                <th>Đang học</th>
                <th>Tín chỉ</th>
                <th>GPA (10)</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontFamily: "var(--mono)", fontWeight: 500 }}>{s.student_id ?? "—"}</td>
                  <td>{s.full_name ?? "—"}</td>
                  <td>{s.major}</td>
                  <td>{s.intake_year ?? "—"}</td>
                  <td>
                    <span className="es-badge es-badge-green">{s.completed_count} môn</span>
                  </td>
                  <td>
                    {s.in_progress_count > 0 && (
                      <span className="es-badge es-badge-blue">{s.in_progress_count} môn</span>
                    )}
                  </td>
                  <td>{s.total_credits}/{s.total_credits_required}</td>
                  <td>
                    {s.gpa10 != null ? (
                      <span className={`es-grade-pill ${s.gpa10 >= 8.5 ? "grade-a" : s.gpa10 >= 7.0 ? "grade-b" : "grade-c"}`}>
                        {s.gpa10.toFixed(2)}
                      </span>
                    ) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
