import { cn } from "@/lib/utils";

type BadgeVariant = "active" | "paused" | "cancelled" | "expired" | "default";

const variantStyles: Record<BadgeVariant, string> = {
  active: "bg-emerald-900/50 text-emerald-400 border-emerald-800",
  paused: "bg-yellow-900/50 text-yellow-400 border-yellow-800",
  cancelled: "bg-red-900/50 text-red-400 border-red-800",
  expired: "bg-zinc-800/50 text-zinc-400 border-zinc-700",
  default: "bg-zinc-800/50 text-zinc-300 border-zinc-700",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
}
