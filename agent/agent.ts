import { createAnthropic } from "@ai-sdk/anthropic";
import { defineAgent } from "eve";

// Anthropic 兼容 provider，通过环境变量指向运营方的网关。
// - baseURL：@ai-sdk/anthropic 会在 baseURL 后追加 `/messages`，所以 baseURL 必须
//   已含 `/v1`。ANTHROPIC_BASE_URL 是主机根（与 Claude Code 用法一致），这里补 `/v1`
//   后得到 `.../v1/messages`。
// - authToken：以 `Authorization: Bearer` 发送，正是网关期望的方式
//   （用 authToken 而非 apiKey；apiKey 会改发 x-api-key）。
// 这些变量由 eve dev/runtime 从 .env.local（已 gitignore）加载。
const provider = createAnthropic({
  baseURL: `${process.env.ANTHROPIC_BASE_URL}/v1`,
  authToken: process.env.ANTHROPIC_AUTH_TOKEN,
});

export default defineAgent({
  // GLM-4.7（200K 上下文）。需要更强推理时改成 "glm-5.2[1m]"。
  model: provider("glm-4.7"),
  // GLM 模型不在 AI Gateway 目录中，因此直接把上下文窗口告诉 eve。
  // 否则 compaction 会因缺少 Gateway 上下文窗口元数据而编译失败。
  modelContextWindowTokens: 200_000,
});
