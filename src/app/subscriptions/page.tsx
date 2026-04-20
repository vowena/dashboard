"use client";

import { useState } from "react";
import Link from "next/link";
import { useWallet } from "@/components/wallet/wallet-provider";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { SubscriptionModal } from "@/components/subscriptions/subscription-modal";
import { VowenaLogo } from "@/components/vowena-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function SubscriptionsPage() {
  const { address, disconnect } = useWallet();
  const { data: subscriptions, isLoading } = useSubscriptions(address);
  const [selectedSubId, setSelectedSubId] = useState<number | null>(null);

  const selectedSub =
    selectedSubId && subscriptions
      ? subscriptions.find((s) => s.id === selectedSubId)
      : null;

  const activeCount =
    subscriptions?.filter((s) => s.status === "Active").length || 0;

  return (
    <>
      {/* Top bar */}
      <div className="sticky top-0 z-40 border-b border-border bg-elevated/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <VowenaLogo size="sm" />
            <nav className="hidden sm:flex items-center gap-6">
              <a href="/subscriptions" className="text-sm font-medium text-foreground hover:text-accent transition-colors">
                My Subscriptions
              </a>
              <a href="/workspaces" className="text-sm text-secondary hover:text-foreground transition-colors">
                Workspaces
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {address && (
              <>
                <div className="text-xs font-mono text-muted hidden sm:block">
                  {address.slice(0, 8)}...{address.slice(-8)}
                </div>
                <Button variant="ghost" size="sm" onClick={disconnect}>
                  Disconnect
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent mb-3">
            YOUR SUBSCRIPTIONS
          </p>
          <h1 className="text-4xl font-semibold text-foreground mb-4">
            Manage all your subscriptions
          </h1>
          <p className="text-secondary text-lg leading-relaxed">
            {activeCount} active{activeCount !== 1 ? " subscriptions" : " subscription"}
            {subscriptions?.length || 0 > activeCount
              ? ` • ${(subscriptions?.length || 0) - activeCount} inactive`
              : ""}
          </p>
        </div>

        {/* Subscriptions grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted">Loading subscriptions...</p>
          </div>
        ) : !subscriptions || subscriptions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted text-lg mb-4">
              No subscriptions found
            </p>
            <p className="text-secondary text-sm mb-6">
              Start by visiting apps that accept Vowena payments
            </p>
            <Link href="https://vowena.xyz" target="_blank">
              <Button variant="outline">Learn more at vowena.xyz</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {subscriptions.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setSelectedSubId(sub.id)}
                className="text-left rounded-xl border border-border bg-elevated hover:bg-surface hover:border-accent/50 transition-all duration-200 p-6 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-sm text-muted mb-1">Plan #{sub.planId}</p>
                    <h3 className="text-base font-semibold text-foreground group-hover:text-accent transition-colors">
                      Subscription {sub.id}
                    </h3>
                  </div>
                  <Badge
                    variant={
                      sub.status === "Active"
                        ? "active"
                        : sub.status === "Paused"
                          ? "paused"
                          : sub.status === "Cancelled"
                            ? "cancelled"
                            : "expired"
                    }
                  >
                    {sub.status}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-muted">Amount</span>
                    <span className="text-foreground font-mono">
                      {sub.plan?.amount
                        ? (Number(sub.plan.amount) / 1e7).toFixed(2)
                        : "0"}{" "}
                      USDC
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Period</span>
                    <span className="text-foreground font-mono">
                      {sub.plan?.period}s
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Periods billed</span>
                    <span className="text-foreground font-semibold">
                      {sub.periodsBilled}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-muted">
                  Next billing:{" "}
                  {new Date(sub.nextBillingTime * 1000).toLocaleDateString()}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Subscription modal */}
      <SubscriptionModal
        subscription={selectedSub || null}
        isOpen={selectedSubId !== null}
        onClose={() => setSelectedSubId(null)}
      />
    </>
  );
}
