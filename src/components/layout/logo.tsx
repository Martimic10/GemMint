import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  markClassName?: string;
  /** Icon mark only — no wordmark (collapsed sidebar, etc.) */
  markOnly?: boolean;
  /** Use white wordmark for dark backgrounds */
  light?: boolean;
}

export function Logo({
  className,
  markClassName,
  markOnly = false,
  light = false,
}: LogoProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center",
        markOnly ? "justify-center" : "gap-2.5",
        className
      )}
    >
      <Image
        src="/GemMint-logo.png"
        alt=""
        width={markOnly ? 36 : 32}
        height={markOnly ? 36 : 32}
        className={cn(
          "object-contain",
          markOnly ? "h-9 w-9" : "h-8 w-8",
          markClassName
        )}
        aria-hidden="true"
        priority
      />
      {markOnly ? null : (
        <span
          className={cn(
            "font-display text-lg font-bold tracking-tight",
            light ? "text-white" : "text-foreground"
          )}
        >
          GemMint
        </span>
      )}
    </span>
  );
}
