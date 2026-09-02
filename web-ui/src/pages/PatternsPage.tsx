import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import patterns from "../data/pattern-list.json";

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

const craftOptions = [
  { value: "", label: "全部工艺" },
  { value: "knitting", label: "编织" },
  { value: "crochet", label: "钩织" },
];

const difficultyOptions = [
  { value: "", label: "全部难度" },
  { value: "beginner", label: "入门" },
  { value: "intermediate", label: "进阶" },
  { value: "advanced", label: "高级" },
];

const categoryOptions = [
  { value: "", label: "全部类目" },
  { value: "sweater", label: "毛衣" },
  { value: "hat", label: "帽子" },
  { value: "scarf", label: "围巾" },
  { value: "socks", label: "袜子" },
  { value: "blanket", label: "毯子" },
  { value: "shawl", label: "披肩" },
  { value: "accessories", label: "配件" },
  { value: "baby", label: "婴幼儿" },
];

const priceOptions = [
  { value: "", label: "全部" },
  { value: "free", label: "仅免费" },
  { value: "paid", label: "仅付费" },
];

export default function PatternsPage() {
  const [search, setSearch] = useState("");
  const [craft, setCraft] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [category, setCategory] = useState("");
  const [priceFilter, setPriceFilter] = useState("");
  const [sortBy, setSortBy] = useState("favorites");

  const filtered = useMemo(() => {
    let list = [...patterns];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.designer.toLowerCase().includes(q) ||
          p.tags.some((t) => t.includes(q))
      );
    }
    if (craft) list = list.filter((p) => p.craft === craft);
    if (difficulty) list = list.filter((p) => p.difficulty === difficulty);
    if (category) list = list.filter((p) => p.category === category);
    if (priceFilter === "free") list = list.filter((p) => p.isFree);
    if (priceFilter === "paid") list = list.filter((p) => !p.isFree);

    if (sortBy === "favorites") list.sort((a, b) => b.favorites - a.favorites);
    else if (sortBy === "projects") list.sort((a, b) => b.projectCount - a.projectCount);
    else if (sortBy === "newest") list.sort((a, b) => b.publishedDate.localeCompare(a.publishedDate));
    else if (sortBy === "rating") list.sort((a, b) => b.rating - a.rating);

    return list;
  }, [search, craft, difficulty, category, priceFilter, sortBy]);

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div className="py-10" style={{ background: "var(--foreground)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#C9973A" }}>
            图案库
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ fontFamily: "Lora, serif", color: "#F7F1E8" }}>
            发现你的下一个项目
          </h1>
          <p className="text-sm" style={{ color: "#9E8878" }}>
            来自全球设计师的 380,000+ 编织与钩织图案
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Search & Filters */}
        <div
          className="rounded-xl p-5 mb-8 space-y-4"
          style={{ background: "var(--card)", border: "1.5px solid var(--border)" }}
        >
          {/* Search bar */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40"
              width="16" height="16" viewBox="0 0 20 20" fill="currentColor"
              style={{ color: "var(--foreground)" }}
            >
              <path fillRule="evenodd" clipRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索图案名称、设计师、标签..."
              className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm outline-none"
              style={{
                background: "var(--muted)",
                border: "1.5px solid var(--border)",
                color: "var(--foreground)",
              }}
            />
          </div>

          {/* Filter row */}
          <div className="flex flex-wrap gap-3">
            {[
              { value: craft, onChange: setCraft, options: craftOptions },
              { value: difficulty, onChange: setDifficulty, options: difficultyOptions },
              { value: category, onChange: setCategory, options: categoryOptions },
              { value: priceFilter, onChange: setPriceFilter, options: priceOptions },
            ].map((filter, i) => (
              <select
                key={i}
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value)}
                className="px-3 py-2 rounded-lg text-sm outline-none cursor-pointer"
                style={{
                  background: "var(--muted)",
                  border: "1.5px solid var(--border)",
                  color: "var(--foreground)",
                }}
              >
                {filter.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ))}

            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>排序：</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 rounded-lg text-sm outline-none cursor-pointer"
                style={{
                  background: "var(--muted)",
                  border: "1.5px solid var(--border)",
                  color: "var(--foreground)",
                }}
              >
                <option value="favorites">最多收藏</option>
                <option value="projects">最多项目</option>
                <option value="newest">最新上架</option>
                <option value="rating">评分最高</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results count */}
        <p className="text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>
          共找到 <strong style={{ color: "var(--foreground)" }}>{filtered.length}</strong> 个图案
        </p>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((pattern) => (
              <Link
                key={pattern.id}
                to={`/patterns/${pattern.id}`}
                className="group block rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200"
                style={{ background: "var(--card)", border: "1.5px solid var(--border)" }}
              >
                <div className="relative aspect-[4/3] overflow-hidden" style={{ background: "var(--muted)" }}>
                  <img
                    src={pattern.image}
                    alt={pattern.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 flex gap-1.5">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                      style={{ background: difficultyColors[pattern.difficulty] + "DD" }}
                    >
                      {difficultyLabels[pattern.difficulty]}
                    </span>
                  </div>
                  <div className="absolute top-2 right-2">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                      style={{ background: pattern.isFree ? "rgba(78,114,81,0.9)" : "rgba(44,26,14,0.78)" }}
                    >
                      {pattern.isFree ? "免费" : `$${pattern.price}`}
                    </span>
                  </div>
                </div>
                <div className="p-3.5">
                  <h3
                    className="font-bold text-sm mb-0.5 line-clamp-1 group-hover:opacity-80 transition-opacity"
                    style={{ fontFamily: "Lora, serif", color: "var(--foreground)" }}
                  >
                    {pattern.name}
                  </h3>
                  <p className="text-xs mb-2.5" style={{ color: "var(--muted-foreground)" }}>
                    by {pattern.designer}
                  </p>
                  <div className="flex items-center justify-between text-xs" style={{ color: "var(--muted-foreground)" }}>
                    <span>❤️ {pattern.favorites.toLocaleString()}</span>
                    <span>{pattern.craft === "knitting" ? "🪡 编织" : "🪝 钩织"}</span>
                    <span>⭐ {pattern.rating}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "Lora, serif" }}>
              没有找到匹配的图案
            </h3>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              试试调整筛选条件或更换搜索关键词
            </p>
            <button
              onClick={() => { setSearch(""); setCraft(""); setDifficulty(""); setCategory(""); setPriceFilter(""); }}
              className="mt-4 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
            >
              清除所有筛选
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
