// 页面底部标志性 sunset 渐变带（DESIGN.md: sunset-stripe-band）。
// 依据 AGENTS.md UI 规则，每个页面底部必须出现此组件。
import { cn } from "@/lib/utils";

export function SunsetStripe({ className }: { readonly className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("h-12 w-full", className)}
      style={{
        background:
          "linear-gradient(90deg, #fa520f 0%, #ffa110 28%, #ffb83e 52%, #ffd900 78%, #fff8e0 100%)",
      }}
    />
  );
}
