import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import Navbar from "../components/Navbar";

/** AC-3 探针：模拟下游模块（FT-02/03/04）经 useAuth 读取当前用户上下文。 */
function CurrentUserProbe() {
  const { currentUser, initializing } = useAuth();
  if (initializing) return <span>LOADING</span>;
  if (!currentUser) return <span>GUEST</span>;
  return (
    <span>{`${currentUser.username} | ${currentUser.displayName} | ${currentUser.avatar}`}</span>
  );
}

function renderProbe() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <CurrentUserProbe />
      </AuthProvider>
    </MemoryRouter>
  );
}

/**
 * FT-01-US-03 登录态保持与当前用户上下文 —— 前端组件级验收。
 *
 * 示例数据（PO 已定级为演示数据）：woolenwhimsy / displayName "Sarah Chen"，
 * 见 LoginModal 演示账号与 server/data/users.json（id=2）。
 */

const woolenwhimsyUser = {
  id: 2,
  username: "woolenwhimsy",
  displayName: "Sarah Chen",
  avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80",
};

const ME_URL = "/api/v1/auth/me";

beforeEach(() => {
  vi.unstubAllGlobals();
});

function renderNavbar() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Navbar />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("AC-1/AC-2: 页面加载时经会话恢复接口回到登录态", () => {
  it("会话有效（GET /api/v1/auth/me 返回 woolenwhimsy）时，Navbar 显示用户名，全程无登录弹窗", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => woolenwhimsyUser,
    });
    vi.stubGlobal("fetch", fetchMock);

    renderNavbar();

    // 恢复完成后显示 displayName 与头像区，而不是游客按钮或登录弹窗
    expect(await screen.findByText("Sarah Chen")).toBeInTheDocument();
    expect(screen.queryByText("登录 / 注册")).not.toBeInTheDocument();
    expect(screen.queryByText("欢迎回来")).not.toBeInTheDocument();
    // 恢复动作确实向后端询问了会话（请求了 me 接口）
    expect(fetchMock.mock.calls[0][0]).toBe(ME_URL);
  });
});

describe("AC-4: 会话恢复完成前 Navbar 不闪现游客控件", () => {
  it("恢复请求 pending 期间，导航栏不显示“登录 / 注册”也不显示用户名/退出；恢复完成后直接显示用户", async () => {
    let resolveMe: (value: { ok: boolean; json: () => Promise<unknown> }) => void = () => {};
    const pending = new Promise<{ ok: boolean; json: () => Promise<unknown> }>((resolve) => {
      resolveMe = resolve;
    });
    const fetchMock = vi.fn().mockReturnValue(pending);
    vi.stubGlobal("fetch", fetchMock);

    renderNavbar();

    // 恢复未完成：没有游客按钮、没有用户名/退出（不闪游客态）
    expect(screen.queryByText("登录 / 注册")).not.toBeInTheDocument();
    expect(screen.queryByText("Sarah Chen")).not.toBeInTheDocument();
    expect(screen.queryByText("退出")).not.toBeInTheDocument();

    // 后端应答会话有效 → 完成恢复，出现用户名
    resolveMe({ ok: true, json: async () => woolenwhimsyUser });
    expect(await screen.findByText("Sarah Chen")).toBeInTheDocument();
    expect(screen.queryByText("登录 / 注册")).not.toBeInTheDocument();
  });
});

describe("AC-3: 下游模块经 AuthContext 读取当前用户上下文", () => {
  it("AC-3a: 会话有效时读取到 username/displayName/avatar", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => woolenwhimsyUser,
    });
    vi.stubGlobal("fetch", fetchMock);

    renderProbe();

    const identity = `${woolenwhimsyUser.username} | ${woolenwhimsyUser.displayName} | ${woolenwhimsyUser.avatar}`;
    expect(await screen.findByText(identity)).toBeInTheDocument();
  });

  it("AC-3b/AC-5: 会话失效（401）时读取为空，下游识别为游客", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 401 });
    vi.stubGlobal("fetch", fetchMock);

    renderProbe();

    // 先处于 LOADING，恢复完成（401 → null）后为 GUEST
    expect(await screen.findByText("GUEST")).toBeInTheDocument();
    expect(fetchMock.mock.calls[0][0]).toBe(ME_URL);
  });
});
