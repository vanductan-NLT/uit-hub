/** Stats strip — mirrors Duolingo's social proof numbers */
const STATS = [
  { val: "500+",   label: "Tài nguyên sẵn có",       icon: "📚" },
  { val: "+0.35",  label: "GPA trung bình cải thiện", icon: "📈" },
  { val: "0 đồng",label: "Hoàn toàn miễn phí",       icon: "🎁" },
];

export default function LandingStatsRow() {
  return (
    <section className="lp-stats">
      <div className="lp-stats-inner">
        {STATS.map((s) => (
          <div key={s.label} className="lp-stat">
            <div className="lp-stat-icon" aria-hidden="true">{s.icon}</div>
            <div className="lp-stat-val">{s.val}</div>
            <div className="lp-stat-label">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
