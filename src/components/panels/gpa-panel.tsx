"use client";

import { useState } from "react";

const subjects = [
  { name: "CTDL&GT", tc: "4TC", gk: 6.2, bt: 7.0, needStr: "≥ 7.0", needOk: false, forecast: "B", badge: "amber" },
  { name: "Lập trình Web", tc: "3TC", gk: 8.5, bt: 9.0, needStr: "≥ 7.5", needOk: true, forecast: "A", badge: "green" },
  { name: "Đại số TT", tc: "3TC", gk: 5.5, bt: 6.0, needStr: "≥ 8.0", needOk: false, forecast: "B–", badge: "amber" },
  { name: "Vật lý ĐC", tc: "3TC", gk: 7.0, bt: 7.5, needStr: "≥ 6.5", needOk: true, forecast: "B+", badge: "blue" },
  { name: "Nhập môn CNPM", tc: "4TC", gk: 7.8, bt: 8.0, needStr: "≥ 7.0", needOk: true, forecast: "A–", badge: "green" },
];

export default function GpaPanel({ onNav }: { onNav: (p: string) => void }) {
  return (
    <>
      <div className="es-topbar">
        <div className="es-topbar-left">
          <div className="es-topbar-title">Dự báo GPA</div>
          <div className="es-topbar-sub">HK2 2024–2025 · Dựa trên điểm thành phần đã có</div>
        </div>
        <div className="es-topbar-right">
          <span className="es-badge es-badge-amber">⚠️ 2 môn cần chú ý</span>
        </div>
      </div>

      <div className="es-content">
        <div className="es-grid-2" style={{ alignItems: "start" }}>
          <div>
            <div className="es-card" style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--es-muted)" }}>GPA tích lũy hiện tại</span>
                <span className="es-badge es-badge-green">Khá</span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginBottom: 4 }}>
                <div className="es-gpa-number">3.28</div>
                <div className="es-gpa-max">/4.0</div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div className="es-prog-wrap" style={{ height: 8 }}><div className="es-prog-fill green" style={{ width: "82%" }} /></div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  { label: "Dự báo cuối HK", val: "3.31", bg: "var(--green-lt)", color: "var(--green)" },
                  { label: "Mục tiêu GPA", val: "3.50", bg: "var(--blue-lt)", color: "var(--blue)" },
                  { label: "Cần cải thiện", val: "+0.19", bg: "var(--amber-lt)", color: "var(--amber)" },
                ].map((item) => (
                  <div key={item.label} style={{ flex: 1, textAlign: "center", padding: 8, background: item.bg, borderRadius: "var(--r-sm)" }}>
                    <div style={{ fontSize: 11, color: item.color, fontWeight: 600 }}>{item.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: item.color }}>{item.val}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="es-forecast-card warn">
              <div className="es-forecast-icon">⚡</div>
              <div style={{ flex: 1 }}>
                <div className="es-forecast-title">CTDL&GT — Cần 7.0+ ở cuối kỳ để đạt B</div>
                <div className="es-forecast-desc">Điểm GK: 6.2 · BT: 7.0 · Trọng số cuối kỳ: 50%</div>
              </div>
              <button className="es-forecast-action" onClick={() => onNav("exam")}>Lên lịch ôn →</button>
            </div>
            <div className="es-forecast-card ok">
              <div className="es-forecast-icon">✅</div>
              <div style={{ flex: 1 }}>
                <div className="es-forecast-title">Lập trình Web — Đang đúng hướng đạt A</div>
                <div className="es-forecast-desc">Điểm GK: 8.5 · BT: 9.0 · Cần 7.5+ cuối kỳ</div>
              </div>
              <button className="es-forecast-action">Duy trì →</button>
            </div>
            <div className="es-forecast-card warn">
              <div className="es-forecast-icon">⚠️</div>
              <div style={{ flex: 1 }}>
                <div className="es-forecast-title">Đại số tuyến tính — Có thể rớt xuống C</div>
                <div className="es-forecast-desc">Điểm GK: 5.5 · BT: 6.0 · Cần 8.0+ để giữ B</div>
              </div>
              <button className="es-forecast-action" onClick={() => onNav("resources")}>Tìm tài nguyên →</button>
            </div>
          </div>

          <div className="es-card">
            <div className="es-section-hdr">
              <div>
                <div className="es-section-title">Chi tiết từng môn</div>
                <div className="es-section-sub">Dựa trên điểm đã có + dự báo cuối kỳ</div>
              </div>
            </div>
            <table className="es-score-table">
              <thead>
                <tr>
                  <th>Môn học</th><th>GK</th><th>BT</th><th>CK cần</th><th>Dự báo</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((s) => (
                  <tr key={s.name}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: "var(--es-muted)" }}>{s.tc}</div>
                    </td>
                    <td>{s.gk}</td>
                    <td>{s.bt}</td>
                    <td><span className={s.needOk ? "score-ok" : "score-need"}>{s.needStr}</span></td>
                    <td><span className={`es-badge es-badge-${s.badge}`}>{s.forecast}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="es-divider" />
            <div style={{ fontSize: 12, color: "var(--es-muted)", display: "flex", alignItems: "center", gap: 6 }}>
              <span>💡</span>
              <span>Trọng số: GK 30% · BT 20% · CK 50%. Tự cập nhật điểm để dự báo chính xác hơn.</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
