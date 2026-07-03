"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (loading) return;

    let shouldResetLoading = true;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      if (res.ok) {
        shouldResetLoading = false;
        window.location.assign("/workspaces");
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "注册失败");
    } catch {
      setError("网络异常，请稍后重试");
    } finally {
      if (shouldResetLoading) setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm border-beige-deep bg-cream">
      <CardHeader>
        <CardTitle className="font-display text-2xl">注册</CardTitle>
      </CardHeader>
      <CardContent>
        <form aria-busy={loading} className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="username">用户名（2–32 个字符）</Label>
            <Input
              autoComplete="username"
              id="username"
              maxLength={32}
              minLength={2}
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
              minLength={6}
              onChange={(e) => setPassword(e.target.value)}
              required
              type="password"
              value={password}
            />
          </div>
          {error ? (
            <p className="text-destructive text-sm" id="register-error" role="alert">
              {error}
            </p>
          ) : null}
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
