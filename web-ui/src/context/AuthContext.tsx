import { createContext, useContext, useState, ReactNode } from "react";

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
  login: (username: string, password: string) => Promise<User | null>;
  /** 登出：返回是否成功（后端确认销毁会话后本地才清态；失败返回 false 且登录态不变）。 */
  logout: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  login: async () => null,
  logout: async () => false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

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

  // FT-01-US-04（AC-1）：登出为前后端双向——先调 POST /api/v1/auth/logout，
  // 服务端确认销毁会话并下发清除 Cookie 后才清空本地登录态（杜绝"假登出"）。
  // 后端登出失败（网络异常/非 2xx）时不改本地态、返回 false，由调用方提示
  // "登出失败，请重试"（失败回滚，登录态与当前会话保持有效）。
  async function logout(): Promise<boolean> {
    try {
      const res = await fetch("/api/v1/auth/logout", { method: "POST" });
      if (!res.ok) {
        return false;
      }
      setCurrentUser(null);
      return true;
    } catch {
      return false;
    }
  }

  return (
    <AuthContext.Provider value={{ currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
