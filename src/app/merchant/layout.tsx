"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

function VowenaSymbol() {
  return (
    <svg className="w-6 h-6 text-accent" viewBox="0 0 72 72" fill="none">
      <path d="M12 16C12 16 24 48 36 56C48 48 60 16 60 16" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="36" cy="56" r="4" fill="currentColor"/>
      <path d="M36 56C36 56 28 52 22 42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.4"/>
      <path d="M36 56C36 56 44 52 50 42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.4"/>
    </svg>
  );
}

const navItems = [
  { href: "/merchant", label: "Overview" },
  { href: "/merchant/plans", label: "Plans" },
  { href: "/merchant/subscribers", label: "Subscribers" },
  { href: "/merchant/billing", label: "Billing" },
  { href: "/merchant/keeper", label: "Keeper" },
];

export default function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col border-r border-border bg-elevated">
        <div className="flex h-14 items-center gap-2.5 border-b border-border px-5">
          <Link href="/" className="flex items-center gap-2">
            <VowenaSymbol />
            <span className="text-sm font-semibold text-foreground" style={{ letterSpacing: "-0.03em" }}>
              vowena
            </span>
          </Link>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 p-3">
          <p className="px-3 pt-2 pb-2 text-[11px] font-semibold uppercase tracking-widest text-muted">
            Merchant
          </p>
          {navItems.map((item) => {
            const isActive =
              item.href === "/merchant"
                ? pathname === "/merchant"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-accent-subtle text-accent font-medium"
                    : "text-secondary hover:bg-surface hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-4">
          <p className="text-[11px] text-muted">Stellar Testnet</p>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-background">
        <div className="mx-auto max-w-5xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
