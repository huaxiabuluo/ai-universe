"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AuthError, login, register } from "@/lib/auth";
import { crossOriginError, isRateLimited, parseAuthInput, validateAuthInput } from "@/lib/auth/request";
import { saveSession } from "@/lib/auth/session";

export type AuthFormState = {
  error: string | null;
};

export async function loginAction(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const result = await authenticate("login", formData);
  if (result?.error) return result;
  redirect("/workspaces");
}

export async function registerAction(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const result = await authenticate("register", formData);
  if (result?.error) return result;
  redirect("/workspaces");
}

async function authenticate(
  mode: "login" | "register",
  formData: FormData,
): Promise<AuthFormState | null> {
  const requestHeaders = await headers();
  const originError = crossOriginError(requestHeaders);
  if (originError) return { error: originError };
  if (isRateLimited(requestHeaders, mode)) return { error: "请求过于频繁，请稍后重试" };

  const input = parseAuthInput({
    username: formData.get("username"),
    password: formData.get("password"),
  });
  const inputError = validateAuthInput(input, mode);
  if (inputError) return { error: inputError };

  try {
    const user = mode === "login" ? await login(input.username, input.password) : await register(input.username, input.password);
    await saveSession(user);
    return null;
  } catch (error) {
    if (error instanceof AuthError) return { error: error.message };
    throw error;
  }
}
