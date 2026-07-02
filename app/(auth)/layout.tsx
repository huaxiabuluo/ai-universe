import type { ReactNode } from "react";
import { SunsetStripe } from "@/components/brand/sunset-stripe";

export default function AuthLayout({ children }: { readonly children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="px-6 py-8 text-center">
        <span className="font-display text-2xl tracking-tight">ai-universe</span>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">{children}</main>
      <SunsetStripe />
    </div>
  );
}
