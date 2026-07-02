import { defineTool } from "eve/tools";
import { z } from "zod";

// 模型通过文件名把它识别为 `query_internal_api`。
// 它调用运营方自己的 API，经环境变量配置（不在 sandbox 内运行）。
export default defineTool({
  description:
    "Query the operator's own internal API for live data (orders, metrics, records, etc.). " +
    "Pass a relative path and optional query parameters; returns parsed JSON. " +
    "Requires OWN_API_BASE_URL to be set (and optionally OWN_API_TOKEN).",
  inputSchema: z.object({
    path: z
      .string()
      .min(1)
      .describe("Relative API path, must start with '/', e.g. '/orders/123' or '/metrics'."),
    query: z
      .record(z.string(), z.string())
      .optional()
      .describe("Optional query string parameters."),
  }),
  async execute({ path, query }) {
    const base = process.env.OWN_API_BASE_URL;
    if (!base) {
      throw new Error(
        "OWN_API_BASE_URL is not set. Configure it before calling query_internal_api.",
      );
    }

    const url = new URL(path, base);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        url.searchParams.set(key, value);
      }
    }

    const headers: Record<string, string> = {};
    if (process.env.OWN_API_TOKEN) {
      headers.authorization = `Bearer ${process.env.OWN_API_TOKEN}`;
    }

    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`Internal API ${res.status}: ${await res.text()}`);
    }

    const contentType = res.headers.get("content-type") ?? "";
    return contentType.includes("application/json")
      ? await res.json()
      : { text: await res.text() };
  },
});
