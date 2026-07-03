"use server";

import { redirect } from "next/navigation";
import { AuthError, login, register } from "@/lib/auth";
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
  const username = formValue(formData.get("username"));
  const password = formValue(formData.get("password"));
  if (!username || !password) return { error: "缺少用户名或密码" };

  try {
    const user = mode === "login" ? await login(username, password) : await register(username, password);
    await saveSession(user);
    return null;
  } catch (error) {
    if (error instanceof AuthError) return { error: error.message };
    throw error;
  }
}

function formValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}
