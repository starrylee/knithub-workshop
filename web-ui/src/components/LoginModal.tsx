import { useState } from "react";
import { useAuth, User } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

interface LoginModalProps {
  onClose: () => void;
}

export default function LoginModal({ onClose }: LoginModalProps) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isRegister, setIsRegister] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // AC-3（决策 7）：空输入前端必填校验，不向后端发出请求
    if (!username.trim()) {
      setError("请输入用户名");
      return;
    }
    if (!password) {
      setError("请输入密码");
      return;
    }
    if (isRegister) {
      // 2026-09-08 需求：注册需二次输入密码；未填确认密码或两次不一致时前端拦截，不发起请求
      if (!confirmPassword) {
        setError("请输入确认密码");
        return;
      }
      if (password !== confirmPassword) {
        setError("两次输入的密码不一致");
        return;
      }
      try {
        const registered: User | null = await register(username, password);
        if (registered) {
          // 决策 14：注册成功仅关闭弹窗，停留在当前页（不跳转个人页）
          onClose();
          return;
        }
        setError("注册失败，请稍后重试");
      } catch (err) {
        // 后端明确提示原样展示（AC-2「用户名已被占用」、AC-3 密码规则）
        setError(err instanceof Error ? err.message : "注册失败，请稍后重试");
      }
      // 决策 15：注册失败保留已填用户名、清空密码（含确认密码）
      setPassword("");
      setConfirmPassword("");
      return;
    }
    const user: User | null = await login(username, password);
    if (user) {
      // 决策 6：主动登录成功跳转个人页（操作触发登录的续接逻辑随 US-05 接入）
      onClose();
      navigate(`/users/${user.username}`);
    } else {
      // AC-2：统一提示，不区分用户名或密码错误（防用户名枚举）
      setError("用户名或密码错误");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(44, 26, 14, 0.55)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl shadow-2xl p-8 relative"
        style={{ background: "var(--card)", border: "1.5px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-2xl leading-none"
          style={{ color: "var(--muted-foreground)" }}
        >
          ×
        </button>

        <div className="mb-6 text-center">
          <span className="text-3xl">🧶</span>
          <h2 className="text-2xl font-bold mt-2" style={{ fontFamily: "Lora, serif", color: "var(--foreground)" }}>
            {isRegister ? "加入 KnitHub" : "欢迎回来"}
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
            {isRegister ? "开启你的编织之旅" : "登录你的编织笔记本"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>
              用户名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="如 woolenwhimsy"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-2"
              style={{
                background: "var(--muted)",
                border: "1.5px solid var(--border)",
                color: "var(--foreground)",
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-2"
              style={{
                background: "var(--muted)",
                border: "1.5px solid var(--border)",
                color: "var(--foreground)",
              }}
            />
          </div>
          {isRegister && (
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>
                确认密码
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-2"
                style={{
                  background: "var(--muted)",
                  border: "1.5px solid var(--border)",
                  color: "var(--foreground)",
                }}
              />
            </div>
          )}

          {error && (
            <p className="text-sm px-3 py-2 rounded-lg" style={{ background: "#FDE8E0", color: "#B54B22", border: "1px solid #F4C9B8" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full py-2.5 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
          >
            {isRegister ? "注 册" : "登 录"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => { setIsRegister(!isRegister); setError(""); setConfirmPassword(""); }}
            className="text-sm underline"
            style={{ color: "var(--muted-foreground)" }}
          >
            {isRegister ? "已有账号？去登录" : "还没有账号？免费注册"}
          </button>
        </div>

        <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
          <p className="text-xs text-center" style={{ color: "var(--muted-foreground)" }}>
            演示账号：<strong>woolenwhimsy</strong> / knit123 · <strong>threadcountess</strong> / fiber456
          </p>
        </div>
      </div>
    </div>
  );
}
