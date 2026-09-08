# knithub-workshop

KnitHub ——「织友」专属编织社区站点 MVP。前后端分离 + BDD 自动化测试的完整工程。

## 目录结构

```
knithub-workshop/
├── server/            Spring Boot 3.5.6（Java 21）REST 后端，端口 8080
│                      REST API 前缀 /api/v1；JSON 文件持久化（PG 兼容数据模型）
├── web-ui/            React 19 + Vite 8 + TypeScript + Tailwind CSS v4 前端，端口 5174
│                      dev 时将 /api 请求代理到 http://localhost:8080
└── test-automation/   Python Behave（BDD）测试：Playwright UI 测试 + requests API 测试
```

## 环境要求

- **JDK 21**、**Maven 3.9+**（后端）
- **Node.js 20.19+ / 22.12+** 与 **pnpm 8+/9**（前端）
- Python 3.10+（仅运行自动化测试时需要）

## 快速启动

### 1. 启动后端（默认端口 8080）

```bash
cd server
mvn spring-boot:run
```

- 数据目录 `server/data/` 下已有种子数据；若文件缺失，应用首启会自动创建空 JSON 数组（不会覆盖已有数据）。
- 无法访问 Maven Central 时，可通过 `-s <settings.xml>` 指定镜像（如阿里云 public：`https://maven.aliyun.com/repository/public`）。

### 2. 启动前端（默认端口 5174）

```bash
cd web-ui
pnpm install
pnpm run dev
```

浏览器访问 <http://localhost:5174>。Vite 会把 `/api/*` 代理到 `localhost:8080`，因此**需先启动后端**，登录等接口才能用。

### 3. 种子账号

`server/data/users.json` 中预置账号（密码为 BCrypt 哈希存储）：

| 用户名          | 密码      | 显示名      |
| --------------- | --------- | ----------- |
| `woolenwhimsy`  | `knit123` | Sarah Chen  |
| `zhinv`         | —         | 织友        |
| `threadcountess`| —         | Emma Rivera |

> 后端当前只实现了登录（`POST /api/v1/auth/login`），其他账号若需登录可查看对应 BCrypt 哈希值确认密码。

## 运行自动化测试（可选）

```bash
cd test-automation
python -m pip install -r requirements.txt
python -m playwright install chromium      # 首次需安装浏览器
behave                                    # 运行全部 feature
```

测试默认命中 `features/` 下的 UI（`@layer:e2e`）与 API 用例，需前后端已启动。

## 数据与实现说明

- 后端持久化为 JSON 文件（`server/data/users.json / projects.json / likes.json / comments.json`），领域模型按 PostgreSQL 兼容设计（snake_case 存储、ISO 8601 时间），未来可平滑迁移到 PG。
- 前端除登录调用真实后端外，其余内容（图纸 / 社区 / 小组 / 论坛 / 毛线囤货等）暂由 `web-ui/src/data/*.json` mock 数据驱动。
- 功能按需求卡片迭代（如 `FT-01` 用户认证）；尚未实现的端点以代码内 `TODO FT-xx-US-xx` 标注。

## 当前功能状态

| 模块       | 状态                                     |
| ---------- | ---------------------------------------- |
| 用户登录   | ✅ 后端 + 前端 + UI/API 测试已打通        |
| 注册/登出/会话恢复 | ⏳ 代码 TODO 占位             |
| 图纸/社区/个人主页 | 🖼 前端页面 + mock 数据，可浏览  |
