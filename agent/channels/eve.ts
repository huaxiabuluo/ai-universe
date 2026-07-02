import { eveChannel } from "eve/channels/eve";
import { localDev, vercelOidc, type AuthFn } from "eve/channels/auth";
import { getSessionFromRequest } from "@/lib/auth/seal";

// 把应用登录态（iron-session cookie）映射成 eve principal。
// route auth 只负责"验出你是谁"；"你能进哪个 workspace"由应用层（lib/workspaces.ts）校验
// （见 eve docs: auth-and-route-protection.md「route auth does not enforce session ownership」）。
function appSession(): AuthFn<Request> {
  return async (request) => {
    const session = await getSessionFromRequest(request);
    if (!session) return null; // 跳过，交给下一条
    return {
      authenticator: "app",
      principalId: session.userId,
      principalType: "user",
      attributes: { username: session.username },
    };
  };
}

export default eveChannel({
  auth: [
    appSession(),
    // 让 eve TUI 和 Vercel 部署的内部调用访问 agent。
    vercelOidc(),
    // localhost 上对 server-to-server 调用与 REPL 开放；生产环境忽略。
    localDev(),
  ],
});
