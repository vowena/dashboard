import { cn } from "@/lib/utils";

type BadgeVariant = "active" | "paused" | "cancelled" | "expired" | "default";

const variantStyles: Record<BadgeVariant, string> = {
  active: "bg-success-subtle text-[#005C38] border-success/20",
  paused: "bg-warning/10 text-[#7A5A00] border-warning/20",
  cancelled: "bg-error/8 text-error border-error/15",
  expired: "bg-surface text-muted border-border",
  default: "bg-surface text-secondary border-border",
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium border",
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
}
