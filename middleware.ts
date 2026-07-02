import { NextResponse, type NextRequest } from "next/server";

// 与 lib/auth/session.ts 的 SESSION_COOKIE 保持一致。
const SESSION_COOKIE = "ai-universe-session";

// 粗粒度守卫：受保护路径若无 session cookie 则跳登录。
// 真正的鉴权在各 API 与 eve AuthFn 内解密校验（cookie 存在 ≠ 有效）。
export function middleware(request: NextRequest) {
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

// 排除：登录/注册页、auth API、eve 路由、Next 静态资源、带点的静态文件。
export const config = {
  matcher: ["/((?!login|register|api/auth|eve|_next|favicon.ico|.*\\..*).*)"],
};
