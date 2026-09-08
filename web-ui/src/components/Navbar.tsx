import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoginModal from "./LoginModal";

/**
 * 顶部导航（FT-01-US-05，口径 A 需求变更后）：
 * - 「首页」为公开落地页，未登录可直接访问；
 * - 「图案库 / 我的项目 / 社区 / 关于」均为受限入口（authRequired）——
 *   未登录点击时拦截跳转并弹出登录弹窗（停留当前页、不发生页面拦截跳转），
 *   登录成功后自动续接到各自目标页面（登录续接，FT-01-US-05）。
 */
const navLinks: {
  label: string;
  href: string | null;
  authRequired?: boolean;
}[] = [
  { label: "首页", href: "/" },
  { label: "图案库", href: "/patterns", authRequired: true },
  { label: "我的项目", href: null, authRequired: true },
  { label: "社区", href: "/community", authRequired: true },
  { label: "关于", href: "/about", authRequired: true },
];

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const [showLogin, setShowLogin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // 操作触发登录的续接目标：null 表示缺省（登录后进入个人页）
  const [loginRedirect, setLoginRedirect] = useState<string | null>(null);

  function getHref(link: (typeof navLinks)[number]) {
    if (link.label === "我的项目") return currentUser ? `/users/${currentUser.username}` : "#";
    return link.href || "#";
  }

  function openLoginWithRedirect(link: (typeof navLinks)[number]) {
    // 「我的项目」登录后进个人页（loginRedirect=null 走 LoginModal 默认行为）；
    // 其余受限入口登录后自动续接到其目标公开页。
    setLoginRedirect(link.label === "我的项目" ? null : link.href);
    setShowLogin(true);
  }

  function handleNavLinkClick(e: React.MouseEvent, link: (typeof navLinks)[number]) {
    if (!link.authRequired) return; // 公开项（首页）：保持默认导航
    if (!currentUser) {
      // 未登录访客点击受限入口：拦截页面跳转，弹出登录弹窗（停留当前页）
      e.preventDefault();
      openLoginWithRedirect(link);
    }
    // 已登录用户点击受限入口：走默认 Link 导航直达
  }

  return (
    <>
      <header
        className="sticky top-0 z-40 w-full"
        style={{ background: "var(--card)", borderBottom: "1.5px solid var(--border)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="text-2xl">🧶</span>
            <span
              className="text-xl font-bold tracking-tight"
              style={{ fontFamily: "Lora, serif", color: "var(--primary)" }}
            >
              KnitHub
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = link.href && location.pathname === link.href;
              const href = getHref(link);
              return (
                <Link
                  key={link.label}
                  to={href}
                  onClick={link.authRequired ? (e) => handleNavLinkClick(e, link) : undefined}
                  className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                  style={{
                    color: isActive ? "var(--primary)" : "var(--foreground)",
                    background: isActive ? "var(--muted)" : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.background = "var(--muted)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Auth area */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <Link
                  to={`/users/${currentUser.username}`}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.displayName}
                    className="w-8 h-8 rounded-full object-cover"
                    style={{ border: "2px solid var(--border)" }}
                  />
                  <span className="text-sm font-medium hidden sm:block" style={{ color: "var(--foreground)" }}>
                    {currentUser.displayName}
                  </span>
                </Link>
                <button
                  onClick={logout}
                  className="text-sm px-3 py-1.5 rounded-md font-medium transition-colors"
                  style={{ color: "var(--muted-foreground)", background: "var(--muted)" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--border)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--muted)")}
                >
                  退出
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setLoginRedirect(null); // 主动登录：成功后进入个人页
                  setShowLogin(true);
                }}
                className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
              >
                登录 / 注册
              </button>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-1.5 rounded-md"
              style={{ background: "var(--muted)" }}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                {menuOpen
                  ? <path fillRule="evenodd" clipRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
                  : <path fillRule="evenodd" clipRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                }
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden px-4 pb-4 space-y-1" style={{ background: "var(--card)", borderTop: "1px solid var(--border)" }}>
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={getHref(link)}
                onClick={(e) => {
                  setMenuOpen(false);
                  handleNavLinkClick(e, link);
                }}
                className="block px-3 py-2 rounded-md text-sm font-medium"
                style={{ color: "var(--foreground)" }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      {showLogin && <LoginModal onClose={() => { setLoginRedirect(null); setShowLogin(false); }} redirectTo={loginRedirect} />}
    </>
  );
}
