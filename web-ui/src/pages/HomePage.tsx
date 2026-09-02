import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoginModal from "../components/LoginModal";
import patterns from "../data/pattern-list.json";

const featuredPatterns = patterns.slice(0, 6);

const stats = [
  { label: "注册会员", value: "1,240,000+", icon: "👤" },
  { label: "图案总数", value: "380,000+", icon: "📋" },
  { label: "已发布项目", value: "4,200,000+", icon: "🎁" },
  { label: "活跃小组", value: "12,000+", icon: "💬" },
];

const features = [
  {
    icon: "📓",
    title: "记录你的编织项目",
    desc: "为每个项目创建专属笔记本——记录进度、添加照片、写下笔记，全部集中在一处。",
  },
  {
    icon: "🧵",
    title: "管理你的纱线库存",
    desc: "再也不会忘记自己买了什么纱线。详细记录品牌、颜色、克重，随时查阅你的 Stash。",
  },
  {
    icon: "📐",
    title: "发现数十万图案",
    desc: "来自全球设计师的编织与钩织图案，免费与付费兼备，一键加入你的项目队列。",
  },
  {
    icon: "🌿",
    title: "加入手作社区",
    desc: "在小组和论坛中与志同道合的手作人交流，参与 KAL 活动，分享你的创作。",
  },
];

export default function HomePage() {
  const { currentUser } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ minHeight: "580px" }}>
        <div
          className="absolute inset-0 bg-center bg-cover"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1550376026-7375b92bb318?w=1600&h=900&fit=crop&auto=format')",
          }}
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(44,26,14,0.82) 0%, rgba(44,26,14,0.45) 60%, rgba(44,26,14,0.15) 100%)" }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 flex items-center" style={{ minHeight: "580px" }}>
          <div className="max-w-xl py-16">
            <span
              className="inline-block text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-6"
              style={{ background: "rgba(201, 151, 58, 0.25)", color: "#F5D68A", border: "1px solid rgba(201,151,58,0.4)" }}
            >
              手作者的在线家园
            </span>
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6"
              style={{ fontFamily: "Lora, serif", color: "#F7F1E8" }}
            >
              编织你的
              <br />
              <span style={{ color: "#F5B97A" }}>每一针</span>，
              <br />
              每一段故事
            </h1>
            <p className="text-base sm:text-lg leading-relaxed mb-8" style={{ color: "#D4C4B0" }}>
              KnitHub 是为编织者、钩织者、纺纱者和织布者打造的在线社区。记录项目、管理纱线库存、发现数十万图案，与全球手作人共同分享这份温柔的热爱。
            </p>
            <div className="flex flex-wrap gap-3">
              {currentUser ? (
                <Link
                  to={`/users/${currentUser.username}`}
                  className="px-6 py-3 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90"
                  style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
                >
                  进入我的笔记本 →
                </Link>
              ) : (
                <button
                  onClick={() => setShowLogin(true)}
                  className="px-6 py-3 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90"
                  style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
                >
                  免费加入 KnitHub
                </button>
              )}
              <Link
                to="/patterns"
                className="px-6 py-3 rounded-lg font-semibold text-sm transition-colors"
                style={{ background: "rgba(247,241,232,0.12)", color: "#F7F1E8", border: "1.5px solid rgba(247,241,232,0.3)" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(247,241,232,0.2)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(247,241,232,0.12)")}
              >
                浏览图案库
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-14" style={{ background: "var(--foreground)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="text-center py-4">
                <div className="text-3xl mb-2">{s.icon}</div>
                <div
                  className="text-3xl sm:text-4xl font-bold mb-1"
                  style={{ fontFamily: "Lora, serif", color: "#F5B97A" }}
                >
                  {s.value}
                </div>
                <div className="text-sm" style={{ color: "#9E8878" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16" style={{ background: "var(--background)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ fontFamily: "Lora, serif", color: "var(--foreground)" }}>
              你的手作，有了更好的去处
            </h2>
            <p className="text-base max-w-2xl mx-auto" style={{ color: "var(--muted-foreground)" }}>
              从第一针到成品，KnitHub 陪你记录编织路上的每一个里程碑。
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-xl group hover:-translate-y-1 transition-transform duration-200"
                style={{ background: "var(--card)", border: "1.5px solid var(--border)" }}
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-base mb-2" style={{ fontFamily: "Lora, serif", color: "var(--foreground)" }}>
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Patterns */}
      <section className="py-16" style={{ background: "var(--muted)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--accent)" }}>
                精选图案
              </p>
              <h2 className="text-3xl font-bold" style={{ fontFamily: "Lora, serif", color: "var(--foreground)" }}>
                近期热门 & 新上架
              </h2>
            </div>
            <Link
              to="/patterns"
              className="text-sm font-semibold hidden sm:block hover:opacity-80 transition-opacity"
              style={{ color: "var(--primary)" }}
            >
              查看全部 →
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredPatterns.map((pattern) => (
              <PatternCard key={pattern.id} pattern={pattern} />
            ))}
          </div>

          <div className="text-center mt-8 sm:hidden">
            <Link
              to="/patterns"
              className="text-sm font-semibold"
              style={{ color: "var(--primary)" }}
            >
              查看全部图案 →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section
        className="py-16 relative overflow-hidden"
        style={{ background: "var(--primary)" }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <h2
            className="text-3xl sm:text-4xl font-bold mb-4"
            style={{ fontFamily: "Lora, serif", color: "#FDF8F1" }}
          >
            准备好开启你的编织之旅了吗？
          </h2>
          <p className="text-base mb-8" style={{ color: "rgba(253,248,241,0.8)" }}>
            加入全球超过 120 万手作人的大家庭，免费记录你的每一件作品。
          </p>
          {currentUser ? (
            <Link
              to={`/users/${currentUser.username}`}
              className="inline-block px-8 py-3 rounded-lg font-bold text-sm"
              style={{ background: "#FDF8F1", color: "var(--primary)" }}
            >
              进入我的笔记本
            </Link>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              className="px-8 py-3 rounded-lg font-bold text-sm transition-opacity hover:opacity-90"
              style={{ background: "#FDF8F1", color: "var(--primary)" }}
            >
              立即免费注册
            </button>
          )}
        </div>
      </section>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
}

function PatternCard({ pattern }: { pattern: (typeof patterns)[number] }) {
  return (
    <Link
      to={`/patterns/${pattern.id}`}
      className="group block rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-200"
      style={{ background: "var(--card)", border: "1.5px solid var(--border)" }}
    >
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        <img
          src={pattern.image}
          alt={pattern.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 left-3">
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: difficultyColors[pattern.difficulty] + "DD",
              color: "#fff",
            }}
          >
            {difficultyLabels[pattern.difficulty]}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{
              backdropFilter: "blur(6px)",
              background: pattern.isFree ? "rgba(78,114,81,0.9)" : "rgba(44,26,14,0.75)",
              color: "#fff",
            }}
          >
            {pattern.isFree ? "免费" : `$${pattern.price}`}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-sm mb-1 group-hover:text-primary transition-colors line-clamp-1" style={{ fontFamily: "Lora, serif", color: "var(--foreground)" }}>
          {pattern.name}
        </h3>
        <p className="text-xs mb-3" style={{ color: "var(--muted-foreground)" }}>by {pattern.designer}</p>
        <div className="flex items-center justify-between text-xs" style={{ color: "var(--muted-foreground)" }}>
          <span className="flex items-center gap-1">
            <span>❤️</span> {pattern.favorites.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <span>🧶</span> {pattern.craft === "knitting" ? "编织" : "钩织"}
          </span>
          <span className="flex items-center gap-1">
            <span>⭐</span> {pattern.rating}
          </span>
        </div>
      </div>
    </Link>
  );
}

const difficultyColors: Record<string, string> = {
  beginner: "#4E7251",
  intermediate: "#C9973A",
  advanced: "#B54B22",
};

const difficultyLabels: Record<string, string> = {
  beginner: "入门",
  intermediate: "进阶",
  advanced: "高级",
};
