"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (res.ok) {
      router.push("/workspaces");
      router.refresh();
      return;
    }
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setError(data.error ?? "注册失败");
    setLoading(false);
  }

  return (
    <Card className="w-full max-w-sm border-beige-deep bg-cream">
      <CardHeader>
        <CardTitle className="font-display text-2xl">注册</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="username">用户名（2–32 个字符）</Label>
            <Input
              autoComplete="username"
              id="username"
              onChange={(e) => setUsername(e.target.value)}
              required
              value={username}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">密码（至少 6 位）</Label>
            <Input
              autoComplete="new-password"
              id="password"
              onChange={(e) => setPassword(e.target.value)}
              required
              type="password"
              value={password}
            />
          </div>
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          <Button className="w-full" disabled={loading} type="submit">
            {loading ? "创建中…" : "创建账号"}
          </Button>
        </form>
        <p className="mt-4 text-center text-steel text-sm">
          已有账号？
          <Link className="text-primary" href="/login">
            登录
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
