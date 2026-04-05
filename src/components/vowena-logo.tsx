"use client";

export function VowenaSymbol({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M44 18C44 18 28 22 24 40C20 58 36 62 36 62" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" fill="none"/>
      <path d="M36 62C36 62 52 58 56 40C60 22 44 18 44 18" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" fill="none" opacity="0.4"/>
      <circle cx="40" cy="40" r="3" fill="currentColor"/>
    </svg>
  );
}

export function VowenaWordmark({ className }: { className?: string }) {
  return (
    <span className={className} style={{ letterSpacing: "-0.03em" }}>
      vowena
    </span>
  );
}

export function VowenaLogo({ size = "default" }: { size?: "sm" | "default" | "lg" }) {
  const sizeMap = {
    sm: { icon: "w-5 h-5", text: "text-sm" },
    default: { icon: "w-6 h-6", text: "text-base" },
    lg: { icon: "w-8 h-8", text: "text-xl" },
  };
  const s = sizeMap[size];

  return (
    <div className="flex items-center gap-2">
      <VowenaSymbol className={`${s.icon} text-accent`} />
      <VowenaWordmark className={`${s.text} font-semibold text-foreground`} />
    </div>
  );
}
