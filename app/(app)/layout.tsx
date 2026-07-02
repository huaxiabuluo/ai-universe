import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { SunsetStripe } from "@/components/brand/sunset-stripe";
import { getSession } from "@/lib/auth/session";
import { AppHeader } from "./_components/app-header";

export default async function AppLayout({ children }: { readonly children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader username={session.username} />
      <main className="flex flex-1 flex-col">{children}</main>
      <SunsetStripe />
    </div>
  );
}
