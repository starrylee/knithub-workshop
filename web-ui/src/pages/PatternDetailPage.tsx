import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoginModal from "../components/LoginModal";
import patterns from "../data/pattern-list.json";
import projects from "../data/project-list.json";
import users from "../data/user-list.json";

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

export default function PatternDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);
  const [addedToQueue, setAddedToQueue] = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  const pattern = patterns.find((p) => p.id === id);
  if (!pattern) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">😕</div>
        <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: "Lora, serif" }}>找不到该图案</h2>
        <Link to="/patterns" className="text-sm" style={{ color: "var(--primary)" }}>← 返回图案库</Link>
      </div>
    );
  }

  const allImages = [pattern.image, ...pattern.galleryImages];
  const publishedProjects = projects.filter(
    (proj) => proj.patternId === pattern.id && proj.isPublished
  );

  function handleQueueAction() {
    if (!currentUser) { setShowLogin(true); return; }
    setAddedToQueue(true);
  }

  function handleStartProject() {
    if (!currentUser) { setShowLogin(true); return; }
    navigate(`/users/${currentUser.username}?tab=projects&new=${pattern!.id}`);
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-2">
        <div className="flex items-center gap-2 text-xs" style={{ color: "var(--muted-foreground)" }}>
          <Link to="/" className="hover:opacity-80">首页</Link>
          <span>/</span>
          <Link to="/patterns" className="hover:opacity-80">图案库</Link>
          <span>/</span>
          <span style={{ color: "var(--foreground)" }}>{pattern.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid lg:grid-cols-[1fr_400px] gap-8 xl:gap-12">
          {/* Left: Images */}
          <div>
            <div
              className="rounded-xl overflow-hidden aspect-[4/3] mb-3"
              style={{ background: "var(--muted)" }}
            >
              <img
                src={allImages[activeImg]}
                alt={pattern.name}
                className="w-full h-full object-cover"
              />
            </div>
            {allImages.length > 1 && (
              <div className="flex gap-2">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className="rounded-lg overflow-hidden w-16 h-16 shrink-0"
                    style={{
                      border: activeImg === i ? "2.5px solid var(--primary)" : "2px solid var(--border)",
                    }}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Info */}
          <div>
            <div className="flex gap-2 flex-wrap mb-3">
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
                style={{ background: difficultyColors[pattern.difficulty] }}
              >
                {difficultyLabels[pattern.difficulty]}
              </span>
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
                style={{ background: pattern.craft === "knitting" ? "#5B7FA6" : "#8B6BAE" }}
              >
                {pattern.craft === "knitting" ? "🪡 编织" : "🪝 钩织"}
              </span>
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: pattern.isFree ? "#4E7251" : "var(--foreground)", color: "#fff" }}
              >
                {pattern.isFree ? "免费图案" : `付费 $${pattern.price}`}
              </span>
            </div>

            <h1
              className="text-3xl sm:text-4xl font-bold mb-2 leading-tight"
              style={{ fontFamily: "Lora, serif", color: "var(--foreground)" }}
            >
              {pattern.name}
            </h1>
            <p className="text-base mb-1" style={{ color: "var(--muted-foreground)" }}>
              by <span className="font-semibold" style={{ color: "var(--foreground)" }}>{pattern.designer}</span>
            </p>

            {/* Stats row */}
            <div
              className="flex gap-5 py-3 my-4 text-sm"
              style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}
            >
              <div className="text-center">
                <div className="font-bold" style={{ color: "var(--foreground)" }}>❤️ {pattern.favorites.toLocaleString()}</div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>收藏</div>
              </div>
              <div className="text-center">
                <div className="font-bold" style={{ color: "var(--foreground)" }}>🧶 {pattern.projectCount.toLocaleString()}</div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>项目</div>
              </div>
              <div className="text-center">
                <div className="font-bold" style={{ color: "var(--foreground)" }}>⭐ {pattern.rating}</div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>评分</div>
              </div>
            </div>

            <p className="text-sm leading-relaxed mb-5" style={{ color: "var(--muted-foreground)" }}>
              {pattern.description}
            </p>

            {/* Specs */}
            <div
              className="rounded-xl p-4 mb-5 space-y-2 text-sm"
              style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
            >
              {[
                ["纱线重量", pattern.yarnWeight],
                ["针号 / 钩号", pattern.needleSize],
                ["密度", pattern.gauge],
                ["用纱量", pattern.yardage],
                ["尺码", pattern.sizes.join(" · ")],
                ["语言", pattern.languages.join(" · ")],
              ].map(([label, val]) => (
                <div key={label} className="flex gap-3">
                  <span className="w-20 shrink-0 font-medium" style={{ color: "var(--foreground)" }}>{label}</span>
                  <span style={{ color: "var(--muted-foreground)" }}>{val}</span>
                </div>
              ))}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {pattern.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2.5 py-1 rounded-full"
                  style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3">
              {currentUser ? (
                <>
                  <button
                    onClick={handleQueueAction}
                    className="w-full py-3 rounded-lg font-semibold text-sm transition-opacity"
                    style={{
                      background: addedToQueue ? "var(--muted)" : "var(--accent)",
                      color: addedToQueue ? "var(--muted-foreground)" : "var(--accent-foreground)",
                      border: "1.5px solid var(--border)",
                    }}
                    disabled={addedToQueue}
                  >
                    {addedToQueue ? "✓ 已加入队列" : "加入项目队列"}
                  </button>
                  <button
                    onClick={handleStartProject}
                    className="w-full py-3 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90"
                    style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
                  >
                    开始新项目 →
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowLogin(true)}
                  className="w-full py-3 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90"
                  style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
                >
                  登录后加入队列 / 开始项目
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Gallery from community */}
        {publishedProjects.length > 0 && (
          <div className="mt-14">
            <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: "Lora, serif", color: "var(--foreground)" }}>
              基于此图案的作品画廊
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {publishedProjects.map((proj) => {
                const author = users.find((u) => u.id === proj.userId);
                return (
                  <div
                    key={proj.id}
                    className="rounded-xl overflow-hidden"
                    style={{ background: "var(--card)", border: "1.5px solid var(--border)" }}
                  >
                    {proj.photos[0] && (
                      <img
                        src={proj.photos[0]}
                        alt={proj.patternName}
                        className="w-full aspect-[4/3] object-cover"
                      />
                    )}
                    <div className="p-3">
                      <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                        {proj.patternName}
                      </p>
                      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                        by {author?.displayName || "Unknown"} · {proj.size}
                      </p>
                      {proj.notes && (
                        <p className="text-xs mt-2 line-clamp-2" style={{ color: "var(--muted-foreground)" }}>
                          {proj.notes}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
}
