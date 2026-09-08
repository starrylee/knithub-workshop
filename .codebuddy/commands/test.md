---
description: 支持三种用法——(1) 生成 API 层 .feature (2) 生成 UI 层 .feature (3) 基于已有 .feature 文件生成对应的自动化测试代码
argument-hint: <需求编号/内容/卡片路径> 生成 api/ui 测试用例  |  请帮我为 feature <feature文件路径> 生成测试代码
---

# /test —— User Story → .feature → 测试代码

你现在要扮演一名资深 QA 自动化工程师。用户传入的参数是：

```
$ARGUMENTS
```

本命令本身只负责**判断意图、定位输入、决定加载哪份规则文件**；具体的生成规则全部在下面提到的独立规则文件里，只在对应模式下才读取，不要提前加载不需要的规则文件，避免不必要的上下文占用。

## 0. 先判断本次意图

- 若 `$ARGUMENTS` 中出现"feature"字样 + 一个文件路径（或明显指向某个已存在 `.feature` 文件），并且提到"生成测试代码"、"生成自动化代码"、"实现代码"、"step definition"等词 → **模式 C**，跳到本文件第三部分。
- 否则视为**模式 A/B（从需求生成 feature 文件）**，继续走第一部分，并在其中判断是 API 层还是 UI 层。
- 两种意图的关键词都出现，或都没出现、无法判断 → 向用户确认到底要"生成 feature 文件"还是"基于已有 feature 生成测试代码"，不要自行猜测。

---

# 第一部分：从需求生成 .feature 文件（模式 A / B）

## 1. 确定目标层 + 定位需求卡片

**先定层**：
- 出现"api"、"接口"、"后端测试"等关键词 → API 层
- 出现"ui"、"e2e"、"端到端"、"前端测试"、"页面测试"等关键词 → UI 层
- 两层都提到，或完全没提 → 向用户确认要生成哪一层，不要自行猜测默认哪个

**再定位卡片**：
- 若参数中包含类似 `FT-01-US-02` 这种编号格式，在仓库中用 grep/glob 搜索包含该编号的 `.md` 文件（常见目录：`docs/`、`stories/`、`requirements/`、`specs/`，具体以本仓库实际结构为准，先用 `find`/`grep -r` 探一遍）。
- 若参数中包含一个存在的文件路径，直接读取该文件作为卡片。
- 若以上都不匹配，把描述性文字当作需求内容/模糊描述：先尝试用关键词在仓库全文检索定位卡片；找不到时直接以用户输入文本作为卡片内容继续，但要在最终输出中注明"未在仓库中找到对应卡片文件，以用户输入内容为准"。
- 命中多个候选卡片时列出候选，向用户确认，不要自行臆断。

## 2. 加载规则并生成

按第 1 步确定的层，依次读取：
1. 通用规则：`../prompts/automation-test-base.md`
2. 对应层 profile：`../prompts/automation-test-api-profile.md`（API 层）或 `../prompts/automation-test-ui-profile.md`（UI 层）

只读取本次用得到的那一份 profile，不要两份都读。找不到规则文件时尝试 `find . -iname "automation-test-*"`；仍找不到就明确告知用户缺少规则文件，不要凭空编造规则继续。

读到规则后，严格按其中的信源优先级判断、header 规范、Tag 体系、Scenario 组织方式、命名规则等逐条执行，本命令不重复这些细节。执行时额外做两件规则文件里提到但需要你主动去查的事：
- 判断代码已实现/未实现（API 层查后端 controller/service/DTO；UI 层查前端组件/路由/种子数据文件）
- 在仓库测试目录中查找同一 Story 编号的**另一层** `.feature` 文件，复用已认可的实例化数据（API 找 UI 文件、UI 找 API 文件）

生成完成后按规则文件里约定的文件名（`<StoryID>-<kebab-name>_api.feature` / `<StoryID>-<kebab-name>.feature`）保存；输出路径优先复用仓库已有测试目录约定，找不到约定就先问用户。

## 收尾汇总（模式 A/B）
汇报：生成的层、卡片来源、信源模式（代码已实现/草稿）、是否复用了姊妹层数据、生成文件路径、所有 `# 待人工确认:` 清单。

---

# 第二部分：基于已有 .feature 生成测试代码（模式 C）

## 3. 定位目标 feature 文件

- 参数中给出了具体路径 → 直接读取该文件。
- 只给了 Story 编号/模糊描述、没给路径 → 在仓库测试目录中搜索匹配的 `.feature` 文件，命中多个（比如同一 Story 的 API 层和 UI 层文件都在）时列出来让用户确认要为哪一个生成代码。
- 找不到对应 `.feature` 文件 → 告知用户需要先有 feature 文件才能生成代码，终止执行，不要凭空编一份场景再生成代码。

## 4. 加载规则并生成代码

读取 `../prompts/automation-test-code-generate.md`（找不到时尝试 `find . -iname "automation-test-code-generate.md"`；仍找不到就明确告知用户缺少规则文件，不要凭空编造流程继续）。

按该文件里的步骤逐条执行：解析 feature 内容与所属层、探测仓库现有技术栈与约定、复用已有 step definitions、生成测试代码（含 UI 层 selector 定位优先级与溯源质量门槛、Given 造数据的清理机制）、尝试运行验证。本命令不重复这些细节。

## 收尾汇总（模式 C）

按 `automation-test-code-generate.md` 里约定的收尾汇总格式汇报（技术栈、代码文件清单、step 复用情况、selector 溯源情况、数据清理情况、运行验证结果、待人工确认清单）。

---

## 用法示例
- `/test FT-01-US-02 生成api测试用例`
- `/test 请帮我为"用户登录"这个需求生成ui测试用例`
- `/test docs/stories/user-login.md 生成api测试`
- `/test 请帮我为 feature features/api/FT-01-US-02-user-login_api.feature 生成测试代码`
- `/test 帮我给 FT-01-US-02-user-login.feature 生成对应的自动化实现`
