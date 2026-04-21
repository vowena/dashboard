"use client";

import { useMemo } from "react";
import { useProjectSubscribers } from "@/hooks/useProjectSubscribers";
import type { NamedPlan } from "@/hooks/useProjects";
import type { Project } from "@/hooks/useProjects";
import { ExternalLinkIcon } from "@/components/ui/icons";

interface BillingTabProps {
  project: Project;
  plans: NamedPlan[];
}

const MONTH_SECONDS = 2_592_000; // 30 days

export function BillingTab({ project, plans }: BillingTabProps) {
  const { data: subscribers, isLoading } = useProjectSubscribers(
    project.merchant,
    plans,
  );

  const { mrr, totalRevenue, activeCount, failedCount, churnRate } =
    useMemo(() => {
      if (!subscribers || subscribers.length === 0) {
        return {
          mrr: 0,
          totalRevenue: 0,
          activeCount: 0,
          failedCount: 0,
          churnRate: 0,
        };
      }

      let mrrStroops = 0;
      let revenueStroops = 0;
      let active = 0;
      let failed = 0;
      let cancelled = 0;

      for (const sub of subscribers) {
        const amount = Number(sub.plan.amount);
        const period = Number(sub.plan.period) || 1;

        revenueStroops += amount * sub.periodsBilled;
        if (sub.status === "Active") {
          mrrStroops += (amount * MONTH_SECONDS) / period;
          active++;
        }
        if (sub.status === "Cancelled") cancelled++;
        if (sub.failedAt > 0) failed++;
      }

      const denom = active + cancelled;
      const churn = denom === 0 ? 0 : (cancelled / denom) * 100;

      return {
        mrr: mrrStroops / 1e7,
        totalRevenue: revenueStroops / 1e7,
        activeCount: active,
        failedCount: failed,
        churnRate: churn,
      };
    }, [subscribers]);

  const chargeFeed = useMemo(() => {
    if (!subscribers) return [];
    type Charge = {
      ts: number;
      amount: number;
      subscriber: string;
      planName: string;
      href: string;
      kind: "signup" | "charge";
    };
    const rows: Charge[] = [];

    for (const sub of subscribers) {
      const amount = Number(sub.plan.amount);
      const period = Number(sub.plan.period) || 0;
      const trial = sub.plan.trialPeriods ?? 0;
      const planName = sub.plan.name || `Plan ${sub.plan.id}`;
      // Link to the merchant's account on Explorer — merchant receives every
      // charge, so its activity view lists the actual charge transactions.
      const href = `https://stellar.expert/explorer/testnet/account/${sub.plan.merchant}`;
      const signupBilled = sub.periodsBilled > 0 && trial === 0;

      if (signupBilled) {
        rows.push({
          ts: sub.createdAt,
          amount,
          subscriber: sub.subscriber,
          planName,
          href,
          kind: "signup",
        });
      }

      const extras = Math.max(
        0,
        sub.periodsBilled - (signupBilled ? 1 : 0),
      );
      for (let i = 0; i < extras; i++) {
        rows.push({
          ts: sub.createdAt + (i + 1) * period,
          amount,
          subscriber: sub.subscriber,
          planName,
          href,
          kind: "charge",
        });
      }
    }

    return rows.sort((a, b) => b.ts - a.ts);
  }, [subscribers]);

  const stats = [
    {
      label: "Monthly Recurring Revenue",
      value: mrr.toFixed(2),
      suffix: "USDC",
    },
    {
      label: "Total Revenue",
      value: totalRevenue.toFixed(2),
      suffix: "USDC",
    },
    { label: "Active Subscribers", value: activeCount.toString() },
    { label: "Failed Charges", value: failedCount.toString() },
    {
      label: "Churn Rate",
      value: churnRate.toFixed(1),
      suffix: "%",
    },
  ];

  return (
    <div>
      <div className="mb-8 sm:mb-10 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
          Analytics
        </p>
        <h2 className="text-2xl sm:text-[1.75rem] font-semibold text-foreground tracking-tight">
          Billing
        </h2>
        <p className="text-sm text-secondary">
          Revenue and subscriber metrics computed from on-chain subscription
          state across {plans.length} plan{plans.length !== 1 ? "s" : ""}.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-elevated p-5"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted mb-3">
              {stat.label}
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-semibold text-foreground tabular-nums tracking-tight">
                {isLoading ? "—" : stat.value}
              </span>
              {stat.suffix && (
                <span className="text-xs text-muted font-mono">
                  {stat.suffix}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-elevated overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Recent charges
            </h3>
            <p className="text-[11px] text-muted mt-0.5">
              Newest first. Each row links to the underlying charge transaction
              on Stellar Explorer.
            </p>
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted tabular-nums">
            {chargeFeed.length} total
          </p>
        </div>

        {isLoading ? (
          <ChargeFeedSkeleton />
        ) : chargeFeed.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-muted">
              {subscribers && subscribers.length === 0
                ? "No subscribers yet. Share a plan link to start accepting payments."
                : "No charges processed yet."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {chargeFeed.map((row, i) => {
              const time = new Date(row.ts * 1000);
              return (
                <li key={i}>
                  <a
                    href={row.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between gap-4 px-6 py-3.5 hover:bg-surface/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-md bg-accent-subtle flex items-center justify-center text-accent font-semibold text-[11px] shrink-0">
                        {row.subscriber.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground group-hover:text-accent transition-colors truncate">
                          {row.kind === "signup"
                            ? "Subscribed & charged"
                            : "Charge succeeded"}
                          <span className="text-muted font-normal">
                            {" · "}
                            {row.planName}
                          </span>
                        </p>
                        <p className="text-[11px] text-muted font-mono mt-0.5 truncate">
                          {row.subscriber.slice(0, 6)}…
                          {row.subscriber.slice(-4)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="tabular-nums font-mono text-sm text-foreground">
                        {(row.amount / 1e7).toFixed(2)} USDC
                      </span>
                      <p className="text-xs text-muted tabular-nums">
                        {time.toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                      <ExternalLinkIcon
                        size={11}
                        className="text-muted group-hover:text-accent transition-colors"
                      />
                    </div>
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function ChargeFeedSkeleton() {
  return (
    <ul className="divide-y divide-border-subtle">
      {[1, 2, 3, 4].map((i) => (
        <li
          key={i}
          className="flex items-center gap-4 px-6 py-3.5 animate-pulse"
        >
          <div className="w-8 h-8 rounded-md bg-surface shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-40 bg-surface rounded" />
            <div className="h-3 w-28 bg-surface rounded" />
          </div>
          <div className="h-3 w-20 bg-surface rounded" />
        </li>
      ))}
    </ul>
  );
}
