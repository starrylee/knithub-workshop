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
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  login: async () => null,
  logout: () => {},
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

  // TODO FT-01-US-04: 登出调后端销毁会话；当前仅清前端态
  function logout() {
    setCurrentUser(null);
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
