import { createContext, useContext, useState, useEffect, ReactNode } from "react";

/**
 * 当前登录用户（POST /api/v1/auth/login 与 GET /api/v1/auth/me 的 UserResponse，
 * camelCase 报文）。
 */
export interface User {
  id: number;
  username: string;
  displayName: string;
  avatar: string;
}

interface AuthContextType {
  currentUser: User | null;
  /** 启动恢复中（/auth/me 完成前为 true，避免刷新后先闪「未登录」）。 */
  booting: boolean;
  login: (username: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  booting: true,
  login: async () => null,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [booting, setBooting] = useState(true);

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

  /**
   * 应用启动/刷新时用 Cookie sid 恢复登录态（FT-01-US-03 /auth/me）：
   * 会话有效则直接还原 currentUser，实现「刷新不掉登录态」。
   */
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/v1/auth/me");
        if (res.ok) {
          const user: User = await res.json();
          if (active) setCurrentUser(user);
        }
      } catch {
        // 后端不可达等网络异常：静默按未登录处理
      } finally {
        if (active) setBooting(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  /**
   * 登出（FT-01-US-04）：调后端销毁会话并清除 sid Cookie；无论成败都清理
   * 前端登录态，保证界面一定回到未登录。
   */
  async function logout(): Promise<void> {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
    } catch {
      // 网络异常也照常清理本地登录态
    }
    setCurrentUser(null);
  }

  return (
    <AuthContext.Provider value={{ currentUser, booting, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
