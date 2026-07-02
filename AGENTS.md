# eve Agent App（AI 规则主文件）

本项目基于 eve 框架。在动手写代码之前，先从已安装的 eve 包文档中阅读相关指南。
大多数安装里，文档位于 `node_modules/eve/docs/`；在 workspace 或本地包安装时，先
定位已安装的 `eve` 包，再读它的 `docs/` 目录。如果包内文档不可用，以
https://eve.dev/docs 作为备选。先读包内文档的 `README.md`，再读你正在添加功能对应的
指南（如 `connections`、`channels/slack`、`guides/auth-and-route-protection`）。

## 项目约定

- **语言**：代码注释和本文件（AGENTS.md）一律使用中文。
- **模型 / Provider**：agent 使用 Anthropic 兼容的 GLM 网关（非 Vercel AI Gateway），
  凭证从 `.env.local` 读取。两个易踩的坑——`baseURL` 必须带 `/v1`、需显式设
  `modelContextWindowTokens`——已写在 `agent/agent.ts` 注释里，改动前先看那里。
- **依赖**：新增 npm 包若被 `minimumReleaseAge` 拦截（发布时间过新），把包加入
  `pnpm-workspace.yaml` 的 `minimumReleaseAgeExclude`。

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:code-organization-rules -->
# Code Organization Rules

开发时避免单文件或单个函数承担过多职责。Next.js 业务代码优先按职责在 `components`、`lib`、`hooks` 或路由私有目录中共置与抽象；可将单文件约 500 行、普通函数约 60-120 行作为审视是否拆分的软提醒点，但以职责清晰、可读性和可测试性为准，不做机械限制。
<!-- END:code-organization-rules -->

<!-- BEGIN:git-commit-rules -->
# Git Commit Rules

提交信息使用中文 Conventional Commit 风格，简要说明主要变更：

```text
<type>(<scope>): <中文摘要>
```

示例：`chore(prettier): 增加代码格式化配置`

如有必要，可在提交标题后添加正文，简要列举主要变更概要。
<!-- END:git-commit-rules -->
