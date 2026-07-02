import { eveChannel } from "eve/channels/eve";
import { localDev, placeholderAuth, vercelOidc } from "eve/channels/auth";

export default eveChannel({
  auth: [
    // 让 eve TUI 和你的 Vercel 部署能访问已部署的 agent。
    vercelOidc(),
    // 在 localhost 上对 `eve dev` 和 REPL 开放；生产环境忽略。
    localDev(),
    // 该占位鉴权在生产环境不会允许浏览器请求。
    // 请替换为你应用的鉴权提供方（如 Auth.js 或 Clerk），
    // 或对公开 demo 使用 none()。
    placeholderAuth(),
  ],
});
