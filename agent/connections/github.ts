import { connect } from "@vercel/connect/eve";
import { defineMcpClientConnection } from "eve/connections";

// GitHub 官方 remote MCP server。模型通过内置 `connection_search` 发现工具，
// 并以 `github__<tool>` 的形式调用（如 `github__get_issue`）。URL 与 token 不会暴露给模型。
//
// "github/ai-universe" 是你在 Vercel 中注册的 Vercel Connect connector UID。
// connect() 默认为用户级交互式 OAuth：每个终端用户授权自己的 GitHub 账号，
// eve 会暂停当前轮次、走完授权流程后再恢复。若要使用单一共享 GitHub App 凭证
// （让 agent 以自身身份行动），改为：
//   auth: connect({ connector: "github/ai-universe", principalType: "app" })
export default defineMcpClientConnection({
  url: "https://api.githubcopilot.com/mcp/",
  description:
    "GitHub: read repositories, issues, pull requests, commits, and more via the official GitHub MCP server.",
  auth: connect("github/ai-universe"),
});
