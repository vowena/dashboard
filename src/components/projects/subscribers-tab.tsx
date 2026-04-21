"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";

import { useProjectSubscribers, type SubscriberRow } from "@/hooks/useProjectSubscribers";
import { encodePlanId } from "@/lib/plan-id-codec";
import type { NamedPlan } from "@/hooks/useProjects";
import { SubscriberDetailModal } from "@/components/projects/subscriber-detail-modal";
import { cancelSubscription } from "@/lib/contract";
import { formatChainError } from "@/lib/chain-errors";

interface SubscribersTabProps {
  project: { merchant: string };
  plans: NamedPlan[];
}

const FILTERS = ["All", "Active", "Paused", "Cancelled", "Expired"] as const;
type FilterValue = (typeof FILTERS)[number];

export function SubscribersTab({ project, plans }: SubscribersTabProps) {
  const [filter, setFilter] = useState<FilterValue>("All");
  const [planFilter, setPlanFilter] = useState<number | "all">("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: allSubscribers, isLoading, refetch } = useProjectSubscribers(
    project.merchant,
    plans,
  );

  // Apply plan filter first, status filter second
  const subscribers = useMemo(() => {
    if (!allSubscribers) return undefined;
    if (planFilter === "all") return allSubscribers;
    return allSubscribers.filter((s) => s.plan.id === planFilter);
  }, [allSubscribers, planFilter]);

  const counts = useMemo(() => {
    const c = { All: 0, Active: 0, Paused: 0, Cancelled: 0, Expired: 0 };
    if (!subscribers) return c;
    c.All = subscribers.length;
    for (const s of subscribers) {
      if (s.status in c) c[s.status as keyof typeof c]++;
    }
    return c;
  }, [subscribers]);

  const filtered = useMemo(() => {
    if (!subscribers) return [];
    if (filter === "All") return subscribers;
    return subscribers.filter((s) => s.status === filter);
  }, [subscribers, filter]);

  const selected = subscribers?.find((s) => s.id === selectedId) || null;

  const handleCancel = async (subId: number) => {
    if (!confirm("Cancel this subscription? The subscriber will stop being billed.")) return;
    try {
      await cancelSubscription({
        caller: project.merchant,
        subId,
      });
      setSelectedId(null);
      refetch();
    } catch (err) {
      alert(formatChainError(err, "Cancel failed"));
    }
  };

  return (
    <div>
      <div className="mb-8 sm:mb-10 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
          Customers
        </p>
        <h2 className="text-2xl sm:text-[1.75rem] font-semibold text-foreground tracking-tight">
          Subscribers
        </h2>
        <p className="text-sm text-secondary">
          {plans.length === 0
            ? "Create a plan first — subscribers will appear here once they sign up."
            : `Reading subscribers across ${plans.length} plan${plans.length !== 1 ? "s" : ""}.`}
        </p>
      </div>

      {plans.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          {/* Status filter chips */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-surface w-fit overflow-x-auto">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                  filter === f
                    ? "bg-elevated text-foreground shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {f}
                <span
                  className={`text-[10px] tabular-nums ${
                    filter === f ? "text-muted" : "text-muted/70"
                  }`}
                >
                  {counts[f]}
                </span>
              </button>
            ))}
          </div>

          {/* Plan filter dropdown */}
          {plans.length > 1 && (
            <div className="flex items-center gap-2">
              <label
                htmlFor="plan-filter"
                className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted shrink-0"
              >
                Plan
              </label>
              <select
                id="plan-filter"
                value={planFilter === "all" ? "all" : String(planFilter)}
                onChange={(e) =>
                  setPlanFilter(
                    e.target.value === "all" ? "all" : Number(e.target.value),
                  )
                }
                className="h-8 rounded-md border border-border bg-elevated px-2.5 text-xs focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none max-w-[180px] truncate"
              >
                <option value="all">All plans</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name || `Plan ${p.id}`}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <SubscribersSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState
          message={
            plans.length === 0
              ? "Create a plan to start accepting subscribers"
              : filter === "All"
                ? "No subscribers yet"
                : `No ${filter.toLowerCase()} subscribers`
          }
        />
      ) : (
        <div className="rounded-xl border border-border bg-elevated overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="border-b border-border bg-surface/30">
                <tr className="text-left">
                  <Th>Subscriber</Th>
                  <Th>Plan</Th>
                  <Th>Status</Th>
                  <Th align="right">Periods</Th>
                  <Th align="right">Total paid</Th>
                  <Th align="right">Next billing</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sub) => (
                  <SubscriberRowRender
                    key={sub.id}
                    sub={sub}
                    onClick={() => setSelectedId(sub.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <SubscriberDetailModal
        subscriber={selected}
        isOpen={selectedId !== null}
        onClose={() => setSelectedId(null)}
        onCancel={handleCancel}
      />
    </div>
  );
}

function SubscriberRowRender({
  sub,
  onClick,
}: {
  sub: SubscriberRow;
  onClick: () => void;
}) {
  const amount = (Number(sub.plan.amount) / 1e7).toFixed(2);
  const totalPaid = (
    (Number(sub.plan.amount) * sub.periodsBilled) / 1e7
  ).toFixed(2);
  const nextBilling = new Date(sub.nextBillingTime * 1000);

  return (
    <tr
      onClick={onClick}
      className="border-b border-border-subtle last:border-0 hover:bg-surface/40 transition-colors cursor-pointer"
    >
      <Td>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-7 h-7 rounded-md bg-accent-subtle flex items-center justify-center text-accent font-semibold text-[10px] shrink-0">
            {sub.subscriber.slice(0, 2).toUpperCase()}
          </div>
          <span className="font-mono text-xs truncate">
            {sub.subscriber.slice(0, 6)}…{sub.subscriber.slice(-4)}
          </span>
        </div>
      </Td>
      <Td>
        <div>
          <p className="text-sm font-medium text-foreground">
            {sub.plan.name || `Plan ${encodePlanId(sub.plan.id)}`}
          </p>
          <p className="text-[10px] text-muted font-mono">
            {amount} USDC every {formatPeriodShort(sub.plan.period)}
          </p>
        </div>
      </Td>
      <Td>
        <Badge variant={statusVariant(sub.status)}>{sub.status}</Badge>
      </Td>
      <Td align="right">
        <span className="tabular-nums">{sub.periodsBilled}</span>
      </Td>
      <Td align="right">
        <span className="tabular-nums font-mono text-xs">
          {totalPaid} USDC
        </span>
      </Td>
      <Td align="right">
        <span className="text-xs text-muted">
          {sub.status === "Active"
            ? nextBilling.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })
            : "—"}
        </span>
      </Td>
    </tr>
  );
}

function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted text-${align}`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <td className={`px-4 py-3 text-${align} text-foreground`}>{children}</td>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-border border-dashed bg-surface/30 p-12 text-center">
      <p className="text-sm text-secondary">{message}</p>
    </div>
  );
}

function SubscribersSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-elevated overflow-hidden">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-4 py-3 border-b border-border-subtle last:border-0 animate-pulse"
        >
          <div className="w-7 h-7 rounded-md bg-surface" />
          <div className="h-3 w-32 bg-surface rounded" />
          <div className="h-3 w-24 bg-surface rounded ml-auto" />
        </div>
      ))}
    </div>
  );
}

function statusVariant(status: string) {
  switch (status) {
    case "Active":
      return "active";
    case "Paused":
      return "paused";
    case "Cancelled":
      return "cancelled";
    default:
      return "expired";
  }
}

function formatPeriodShort(seconds: number): string {
  if (seconds === 60) return "min";
  if (seconds === 3600) return "hr";
  if (seconds === 86400) return "day";
  if (seconds === 604800) return "wk";
  if (seconds === 2592000) return "mo";
  if (seconds === 31536000) return "yr";
  return `${seconds}s`;
}
