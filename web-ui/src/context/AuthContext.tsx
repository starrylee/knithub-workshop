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
  register: (username: string, password: string) => Promise<User | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  login: async () => null,
  register: async () => null,
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

  /**
   * 注册（FT-01-US-01）：调后端 /api/v1/auth/register，成功即进入登录态
   * （服务端同时下发会话 Cookie sid，与登录一致）。失败返回 null。
   */
  async function register(username: string, password: string): Promise<User | null> {
    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        // 后端已给出明确文案（409「用户名已被占用」/ 400 密码规则），原样上抛给调用方展示
        const payload = await res.json().catch(() => null);
        throw new Error((payload && payload.message) || "注册失败，请稍后重试");
      }
      const user: User = await res.json();
      setCurrentUser(user);
      return user;
    } catch (err) {
      throw err instanceof Error ? err : new Error("注册失败，请稍后重试");
    }
  }

  // TODO FT-01-US-04: 登出调后端销毁会话；当前仅清前端态
  function logout() {
    setCurrentUser(null);
  }

  return (
    <AuthContext.Provider value={{ currentUser, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
