import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

// 根路径按登录态分发：已登录去工作空间，未登录去登录页（middleware 也会兜底）。
export default async function Page() {
  const session = await getSession();
  redirect(session ? "/workspaces" : "/login");
}
