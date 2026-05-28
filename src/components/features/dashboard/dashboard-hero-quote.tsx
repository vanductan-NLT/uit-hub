"use client";

import { useMemo } from "react";

const QUOTES = [
  "Thành công không đến với những ai chờ đợi, mà đến với những ai không ngừng nỗ lực.",
  "Học không phải để biết nhiều, mà để hiểu sâu.",
  "Mỗi ngày học một điều mới là mỗi ngày bạn tiến gần hơn đến ước mơ.",
  "Đừng so sánh hành trình của bạn với người khác. Mỗi người có lộ trình riêng.",
  "Khó khăn chỉ là bài kiểm tra xem bạn có thực sự muốn điều đó hay không.",
  "Hôm nay bạn học, ngày mai bạn dạy người khác.",
  "Điểm số không định nghĩa bạn, nhưng nỗ lực thì có.",
  "Một giờ tập trung hôm nay bằng mười giờ lo lắng ngày mai.",
  "Kiến thức là thứ duy nhất càng chia sẻ càng nhiều.",
  "Bắt đầu là khó nhất. Một khi bắt đầu, mọi thứ trở nên dễ hơn.",
  "Người giỏi nhất trong phòng là người học nhiều nhất, không phải người nói nhiều nhất.",
  "Mỗi buổi sáng là một trang mới trong cuốn sách cuộc đời của bạn.",
];

interface Props {
  displayName: string;
  avatarUrl?: string;
  initials: string;
}

function timeGreeting() {
  const h = new Date().getHours();
  if (h < 6)  return { text: "Khuya rồi nè",        sub: "Nhớ nghỉ ngơi đủ giấc nhé",             emoji: "🌙" };
  if (h < 10) return { text: "Chào buổi sáng",       sub: "Một ngày mới, một cơ hội mới!",          emoji: "☀️" };
  if (h < 12) return { text: "Buổi sáng năng lượng", sub: "Cố lên, sắp đến trưa rồi!",             emoji: "⚡" };
  if (h < 14) return { text: "Giờ nghỉ trưa",        sub: "Nạp năng lượng để chiều tiếp tục nhé",  emoji: "🍱" };
  if (h < 18) return { text: "Chào buổi chiều",       sub: "Chiều tà rồi, còn bao nhiêu việc nữa?", emoji: "🌤️" };
  if (h < 22) return { text: "Buổi tối học tập",     sub: "Tối rồi đó, nên 'chill' một chút rồi tính tiếp", emoji: "🌆" };
  return       { text: "Khuya rồi",                   sub: "Đừng quên nghỉ ngơi, ngày mai còn học", emoji: "🌙" };
}

export default function DashboardHeroQuote({ displayName, avatarUrl, initials }: Props) {
  const g = timeGreeting();
  const quote = useMemo(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    return QUOTES[dayOfYear % QUOTES.length];
  }, []);


  return (
    <div className="es-dashboard-hero">
      {/* ── Row 1: Avatar + Greeting ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 16 }}>
        <div style={{
          width: 60, height: 60, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, var(--blue) 0%, var(--purple) 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, fontWeight: 800, color: "#fff",
          boxShadow: "0 4px 0 rgba(37,99,235,0.3), 0 8px 20px rgba(37,99,235,0.2)",
          overflow: "hidden", border: "3px solid #fff",
        }}>
          {avatarUrl
            ? <img src={avatarUrl} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} referrerPolicy="no-referrer" />
            : initials}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: "var(--ink)", letterSpacing: "-0.4px", lineHeight: 1.2 }}>
            {g.text}, <span style={{ color: "var(--blue)" }}>{displayName}</span>! {g.emoji}
          </div>
          <div style={{ fontSize: 12, color: "var(--es-muted)", marginTop: 4, fontWeight: 500 }}>
            {g.sub}
          </div>
        </div>
      </div>

      {/* ── Row 2: Quote — full width ── */}
      <div className="es-hero-quote">
        <span style={{
          fontSize: 36, lineHeight: 0.85, color: "var(--blue)", opacity: 0.3,
          fontFamily: "Georgia, serif", fontWeight: 900, flexShrink: 0,
        }}>&ldquo;</span>
        <div>
          <div style={{ fontSize: 13, fontStyle: "italic", fontWeight: 600, color: "var(--ink)", lineHeight: 1.65 }}>
            {quote}
          </div>
        </div>
      </div>
    </div>
  );
}
