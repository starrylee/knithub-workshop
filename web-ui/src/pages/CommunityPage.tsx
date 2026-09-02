import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import groups from "../data/group-list.json";

const categoryColors: Record<string, string> = {
  knitting: "#5B7FA6",
  crochet: "#8B6BAE",
  dyeing: "#B54B22",
  spinning: "#4E7251",
  community: "#C9973A",
};

const categoryLabels: Record<string, string> = {
  knitting: "编织",
  crochet: "钩织",
  dyeing: "染线",
  spinning: "纺纱",
  community: "社区",
};

export default function CommunityPage() {
  const { currentUser } = useAuth();
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");

  const joinedGroups = currentUser
    ? groups.filter((g) => g.members.includes(currentUser.id))
    : [];

  const filteredGroups = groups.filter((g) => {
    const matchesFilter = !filter || g.category === filter;
    const matchesSearch =
      !search ||
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.description.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const recommended = filteredGroups.filter((g) => !joinedGroups.includes(g));
  const joined = filteredGroups.filter((g) => joinedGroups.includes(g));

  const categories = ["", "knitting", "crochet", "dyeing", "spinning", "community"];

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div className="py-10" style={{ background: "var(--foreground)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#C9973A" }}>
            社区
          </p>
          <h1
            className="text-3xl sm:text-4xl font-bold mb-2"
            style={{ fontFamily: "Lora, serif", color: "#F7F1E8" }}
          >
            小组与论坛
          </h1>
          <p className="text-sm" style={{ color: "#9E8878" }}>
            找到你的手作部落，分享热爱，一同成长。
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Search & Filters */}
        <div
          className="rounded-xl p-4 mb-8 flex flex-wrap gap-3 items-center"
          style={{ background: "var(--card)", border: "1.5px solid var(--border)" }}
        >
          <div className="relative flex-1 min-w-48">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40"
              width="14" height="14" viewBox="0 0 20 20" fill="currentColor"
            >
              <path fillRule="evenodd" clipRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索小组..."
              className="w-full pl-8 pr-3 py-2 rounded-lg text-sm outline-none"
              style={{
                background: "var(--muted)",
                border: "1.5px solid var(--border)",
                color: "var(--foreground)",
              }}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                style={{
                  background: filter === cat ? "var(--primary)" : "var(--muted)",
                  color: filter === cat ? "var(--primary-foreground)" : "var(--muted-foreground)",
                  border: "1px solid var(--border)",
                }}
              >
                {cat === "" ? "全部" : categoryLabels[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Joined groups (logged in) */}
        {currentUser && joined.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold mb-5" style={{ fontFamily: "Lora, serif", color: "var(--foreground)" }}>
              我加入的小组
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {joined.map((group) => (
                <GroupCard key={group.id} group={group} isJoined />
              ))}
            </div>
          </section>
        )}

        {/* Recommended groups */}
        <section>
          <h2 className="text-xl font-bold mb-5" style={{ fontFamily: "Lora, serif", color: "var(--foreground)" }}>
            {currentUser ? "推荐小组" : "探索所有小组"}
          </h2>
          {filteredGroups.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>没有找到匹配的小组</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {(currentUser ? recommended : filteredGroups).map((group) => (
                <GroupCard key={group.id} group={group} isJoined={false} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function GroupCard({ group, isJoined }: { group: (typeof groups)[number]; isJoined: boolean }) {
  return (
    <Link
      to={`/community/groups/${group.id}`}
      className="group flex flex-col rounded-xl overflow-hidden hover:shadow-md transition-shadow"
      style={{ background: "var(--card)", border: "1.5px solid var(--border)" }}
    >
      <div className="relative aspect-[16/7] overflow-hidden" style={{ background: "var(--muted)" }}>
        <img
          src={group.image}
          alt={group.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(44,26,14,0.6) 0%, transparent 60%)" }} />
        <div className="absolute bottom-3 left-3 flex gap-2">
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
            style={{ background: categoryColors[group.category] + "CC" }}
          >
            {categoryLabels[group.category]}
          </span>
          {isJoined && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(78,114,81,0.9)", color: "#fff" }}>
              ✓ 已加入
            </span>
          )}
        </div>
      </div>
      <div className="p-4 flex-1">
        <h3 className="font-bold mb-1" style={{ fontFamily: "Lora, serif", color: "var(--foreground)" }}>
          {group.name}
        </h3>
        <p className="text-xs leading-relaxed line-clamp-2 mb-3" style={{ color: "var(--muted-foreground)" }}>
          {group.description}
        </p>
        <div className="flex gap-4 text-xs" style={{ color: "var(--muted-foreground)" }}>
          <span>👥 {group.memberCount.toLocaleString()} 成员</span>
          <span>💬 {group.postCount.toLocaleString()} 帖子</span>
        </div>
      </div>
    </Link>
  );
}
