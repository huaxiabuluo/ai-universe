import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Newsreader } from "next/font/google";
import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import "./globals.css";

// Inter = UI 字体；Newsreader = PP Editorial Old 的免费 editorial 近衬线替代（DESIGN.md 展示字）；
// JetBrains Mono = 代码字体。变量名供 globals.css 的 --font-* 引用。
const sans = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const display = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  display: "swap",
});
const mono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ai-universe",
  description: "多工作空间的多人 + AI 协作平台",
};

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html className={cn(sans.variable, display.variable, mono.variable)} lang="zh-CN">
      <body>
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}
