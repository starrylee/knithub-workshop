import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer
      className="mt-auto pt-12 pb-8"
      style={{ background: "#2C1A0E", color: "#C8B99E" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-8" style={{ borderBottom: "1px solid #4A3020" }}>
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🧶</span>
              <span className="text-lg font-bold" style={{ fontFamily: "Lora, serif", color: "#F7F1E8" }}>
                KnitHub
              </span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "#9E8878" }}>
              The home for knitters, crocheters, spinners, and weavers. Record your craft, share your makes.
            </p>
            <div className="flex gap-3 mt-4">
              {["Instagram", "Mastodon", "Pinterest"].map((soc) => (
                <button
                  key={soc}
                  className="text-xs px-2.5 py-1 rounded"
                  style={{ background: "#3A2214", color: "#C8B99E", border: "1px solid #4A3020" }}
                  title={soc}
                >
                  {soc === "Instagram" ? "📸" : soc === "Mastodon" ? "🐘" : "📌"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#F7F1E8" }}>
              探索
            </h4>
            <ul className="space-y-2 text-sm">
              {["图案库", "设计师", "纱线品牌", "最新上架"].map((item) => (
                <li key={item}>
                  <Link to="/patterns" className="hover:opacity-80 transition-opacity" style={{ color: "#9E8878" }}>
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#F7F1E8" }}>
              社区
            </h4>
            <ul className="space-y-2 text-sm">
              {["小组与论坛", "KAL 活动", "设计师专区", "新手指引"].map((item) => (
                <li key={item}>
                  <Link to="/community" className="hover:opacity-80 transition-opacity" style={{ color: "#9E8878" }}>
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#F7F1E8" }}>
              关于
            </h4>
            <ul className="space-y-2 text-sm">
              {[
                { label: "关于我们", href: "/about" },
                { label: "帮助中心", href: "/about" },
                { label: "社区准则", href: "/about" },
                { label: "联系方式", href: "/about" },
              ].map((item) => (
                <li key={item.label}>
                  <Link to={item.href} className="hover:opacity-80 transition-opacity" style={{ color: "#9E8878" }}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs" style={{ color: "#6B5040" }}>
            © 2024 KnitHub. All rights reserved. Made with 🧶 and love.
          </p>
          <div className="flex gap-4 text-xs" style={{ color: "#6B5040" }}>
            <Link to="/about" className="hover:opacity-80">隐私政策</Link>
            <Link to="/about" className="hover:opacity-80">使用条款</Link>
            <Link to="/about" className="hover:opacity-80">Cookie 设置</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
