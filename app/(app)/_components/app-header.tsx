"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function AppHeader({ username }: { readonly username: string }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-hairline-soft bg-background px-4">
      <Link className="font-display text-lg tracking-tight" href="/workspaces">
        ai-universe
      </Link>
      <div className="flex items-center gap-3">
        <span className="text-steel text-sm">{username}</span>
        <Button onClick={logout} size="sm" variant="outline">
          登出
        </Button>
      </div>
    </header>
  );
}
