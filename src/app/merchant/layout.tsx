"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { VowenaLogo } from "@/components/vowena-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { useWallet } from "@/components/wallet/wallet-provider";

const merchantNav = [
  { href: "/merchant", label: "Overview", icon: OverviewIcon },
  { href: "/merchant/plans", label: "Plans", icon: PlansIcon },
  { href: "/merchant/subscribers", label: "Subscribers", icon: SubscribersIcon },
  { href: "/merchant/billing", label: "Billing", icon: BillingIcon },
  { href: "/merchant/keeper", label: "Keeper", icon: KeeperIcon },
];

function OverviewIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function PlansIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function SubscribersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function BillingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function KeeperIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { address } = useWallet();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="sticky top-0 flex h-screen w-[220px] shrink-0 flex-col border-r border-border bg-elevated">
        <div className="flex h-14 items-center border-b border-border px-5">
          <Link href="/">
            <VowenaLogo size="sm" />
          </Link>
        </div>

        <nav className="flex flex-1 flex-col p-3">
          <p className="px-3 pt-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            Merchant
          </p>
          <div className="flex flex-col gap-0.5">
            {merchantNav.map((item) => {
              const isActive = item.href === "/merchant"
                ? pathname === "/merchant"
                : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors",
                    isActive
                      ? "bg-accent-subtle text-accent font-medium"
                      : "text-secondary hover:bg-surface hover:text-foreground",
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="mt-6">
            <p className="px-3 pt-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
              Subscriber
            </p>
            <Link
              href="/merchant/subscriptions"
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors",
                pathname === "/merchant/subscriptions"
                  ? "bg-accent-subtle text-accent font-medium"
                  : "text-secondary hover:bg-surface hover:text-foreground",
              )}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              </svg>
              My subscriptions
            </Link>
          </div>
        </nav>

        <div className="border-t border-border p-3 flex items-center justify-between">
          <div className="min-w-0">
            {address && (
              <p className="font-mono text-[10px] text-muted truncate">
                {address.slice(0, 6)}...{address.slice(-4)}
              </p>
            )}
            <p className="text-[10px] text-muted/60">Stellar Testnet</p>
          </div>
          <ThemeToggle />
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="mx-auto max-w-5xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
