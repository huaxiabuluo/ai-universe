"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction, type AuthFormState } from "../actions";

const initialState: AuthFormState = { error: null };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <Card className="w-full max-w-sm border-beige-deep bg-cream">
      <CardHeader>
        <CardTitle className="font-display text-2xl">登录</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} aria-busy={pending} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">用户名</Label>
            <Input
              autoComplete="username"
              id="username"
              maxLength={32}
              minLength={2}
              name="username"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <Input
              autoComplete="current-password"
              id="password"
              minLength={6}
              name="password"
              required
              type="password"
            />
          </div>
          {state.error ? (
            <p aria-live="polite" className="text-destructive text-sm" id="login-error" role="alert">
              {state.error}
            </p>
          ) : null}
          <Button className="w-full" disabled={pending} type="submit">
            {pending ? "登录中…" : "登录"}
          </Button>
        </form>
        <p className="mt-4 text-center text-steel text-sm">
          还没有账号？
          <Link className="text-primary" href="/register">
            注册
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
