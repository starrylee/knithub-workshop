import { createContext, useContext, useEffect, useState, ReactNode } from "react";

/** 会话恢复端点（FT-01-US-03）：返回当前会话用户；无/失效会话 → 非 2xx。 */
const ME_URL = "/api/v1/auth/me";

/**
 * 当前登录用户（POST /api/v1/auth/login 成功响应，camelCase 报文）。
 */
export interface User {
  id: number;
  username: string;
  displayName: string;
  avatar: string;
}

interface AuthContextType {
  currentUser: User | null;
  /** 会话恢复是否进行中（FT-01-US-03 AC-4）：完成前 UI 不应按游客态渲染。 */
  initializing: boolean;
  login: (username: string, password: string) => Promise<User | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  initializing: false,
  login: async () => null,
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  // FT-01-US-03（AC-1/AC-2）: 页面加载（含刷新/重开浏览器）时恢复会话——
  // 查询 me 端点：有效会话 → 回到登录态；无会话/请求失败 → 游客态（null）。
  // initializing（AC-4）：恢复完成前保持 true，UI 不按游客态渲染。
  useEffect(() => {
    let cancelled = false;
    fetch(ME_URL)
      .then((res) => (res.ok ? res.json() : null))
      .then((user: User | null) => {
        if (!cancelled) setCurrentUser(user);
      })
      .catch(() => {
        if (!cancelled) setCurrentUser(null);
      })
      .finally(() => {
        if (!cancelled) setInitializing(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * 登录（FT-01-US-02）：调后端 /api/v1/auth/login，成功时服务端建立内存会话，
   * 浏览器收到 HttpOnly Cookie sid（同源经 Vite proxy，无需显式携带凭据）。
   * 失败（凭据错误/网络异常）返回 null，由调用方统一提示。
   */
  async function login(username: string, password: string): Promise<User | null> {
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        return null;
      }
      const user: User = await res.json();
      setCurrentUser(user);
      return user;
    } catch {
      return null;
    }
  }

  // TODO FT-01-US-04: 登出调后端销毁会话；当前仅清前端态
  function logout() {
    setCurrentUser(null);
  }

  return (
    <AuthContext.Provider value={{ currentUser, initializing, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
