"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

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
    <div className="flex min-h-screen bg-zinc-900">
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950">
        <div className="flex h-16 items-center gap-2 border-b border-zinc-800 px-6">
          <span className="text-lg font-bold text-white">Vowena</span>
          <span className="text-xs text-zinc-500">Merchant</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-4">
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
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-indigo-600/20 text-indigo-400"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-zinc-800 p-4">
          <p className="text-xs text-zinc-600">Stellar Recurring Payments</p>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
