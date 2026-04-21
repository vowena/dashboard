"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CloseIcon,
  CheckIcon,
  CalendarIcon,
  ExternalLinkIcon,
  AlertTriangleIcon,
  CircleDotIcon,
} from "@/components/ui/icons";
import type { SubscriberRow } from "@/hooks/useProjectSubscribers";
import {
  useSubscriptionEvents,
  type SubscriptionEvent,
} from "@/hooks/useSubscriptionEvents";
import { encodePlanId } from "@/lib/plan-id-codec";

interface SubscriberDetailModalProps {
  subscriber: SubscriberRow | null;
  isOpen: boolean;
  onClose: () => void;
  onCancel?: (subId: number) => Promise<void>;
  onRefund?: (subId: number) => void;
}

export function SubscriberDetailModal({
  subscriber,
  isOpen,
  onClose,
  onCancel,
  onRefund,
}: SubscriberDetailModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  const { data: events, isLoading: eventsLoading } = useSubscriptionEvents(
    isOpen && subscriber ? subscriber.id : null,
  );

  if (!isOpen || !subscriber) return null;

  const amount = (Number(subscriber.plan.amount) / 1e7).toFixed(2);
  const totalPaid = (
    (Number(subscriber.plan.amount) * subscriber.periodsBilled) / 1e7
  ).toFixed(2);
  const now = Math.floor(Date.now() / 1000);
  const nextBillingIn = subscriber.nextBillingTime - now;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none overflow-y-auto">
        <div
          className="w-full max-w-2xl my-auto rounded-2xl border border-border bg-elevated shadow-2xl pointer-events-auto animate-in fade-in zoom-in-95 duration-200 max-h-[88vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 sm:px-8 py-6 flex items-start justify-between border-b border-border-subtle shrink-0">
            <div className="flex items-start gap-4 min-w-0">
              <div className="w-11 h-11 rounded-lg bg-accent-subtle flex items-center justify-center text-accent font-semibold text-sm shrink-0">
                {subscriber.subscriber.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted mb-1">
                  Subscriber
                </p>
                <h2 className="text-base font-semibold text-foreground tracking-tight font-mono break-all">
                  {subscriber.subscriber.slice(0, 8)}…
                  {subscriber.subscriber.slice(-8)}
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant={statusVariant(subscriber.status)}>
                {subscriber.status}
              </Badge>
              <button
                onClick={onClose}
                className="text-muted hover:text-foreground hover:bg-surface rounded-md p-2 transition-colors -m-2"
                aria-label="Close"
              >
                <CloseIcon size={16} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            {/* Top stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border-subtle border-b border-border-subtle">
              <Stat label="Amount" value={`${amount}`} suffix="USDC" />
              <Stat
                label="Total paid"
                value={`${totalPaid}`}
                suffix="USDC"
              />
              <Stat
                label="Periods"
                value={subscriber.periodsBilled.toString()}
              />
              <Stat
                label="Next billing"
                value={
                  nextBillingIn > 0
                    ? formatRelative(nextBillingIn)
                    : "Due now"
                }
              />
            </div>

            {/* Plan info */}
            <div className="px-6 sm:px-8 py-5 border-b border-border-subtle">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted mb-2">
                Subscribed to
              </p>
              <p className="text-sm font-medium text-foreground">
                {subscriber.plan.name || `Plan ${encodePlanId(subscriber.plan.id)}`}
                {" · "}
                {amount} USDC every {formatPeriod(subscriber.plan.period)}
              </p>
              {subscriber.plan.trialPeriods > 0 && (
                <p className="text-xs text-muted mt-1">
                  {subscriber.plan.trialPeriods}{" "}
                  {formatPeriod(subscriber.plan.period)} trial
                </p>
              )}
            </div>

            {/* Event timeline */}
            <div className="px-6 sm:px-8 py-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted mb-4">
                Activity
              </p>

              {eventsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-3 animate-pulse">
                      <div className="w-2 h-2 rounded-full bg-surface mt-2 shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-32 bg-surface rounded" />
                        <div className="h-3 w-48 bg-surface rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !events || events.length === 0 ? (
                <EventTimelineFallback subscriber={subscriber} />
              ) : (
                <ul className="space-y-1">
                  {events.map((ev, i) => (
                    <EventRow key={`${ev.ledger}-${i}`} event={ev} />
                  ))}
                </ul>
              )}
            </div>

            {/* Details */}
            <div className="px-6 sm:px-8 py-5 border-t border-border-subtle space-y-3">
              <DetailRow
                label="Subscription ID"
                value={`sub_${encodePlanId(subscriber.id)}`}
              />
              <DetailRow
                label="Subscriber wallet"
                value={subscriber.subscriber}
                href={`https://stellar.expert/explorer/testnet/account/${subscriber.subscriber}`}
              />
              <DetailRow
                label="Created"
                value={formatDate(subscriber.createdAt)}
              />
              {subscriber.cancelledAt > 0 && (
                <DetailRow
                  label="Cancelled"
                  value={formatDate(subscriber.cancelledAt)}
                />
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 sm:px-8 py-4 border-t border-border-subtle bg-surface/30 flex items-center justify-end gap-3 rounded-b-2xl shrink-0">
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
            {subscriber.status === "Active" && onRefund && (
              <Button variant="outline" onClick={() => onRefund(subscriber.id)}>
                Refund
              </Button>
            )}
            {subscriber.status === "Active" && onCancel && (
              <Button
                variant="destructive"
                onClick={() => onCancel(subscriber.id)}
              >
                Cancel subscription
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <div className="bg-elevated px-5 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted mb-2">
        {label}
      </p>
      <div className="flex items-baseline gap-1">
        <span className="text-base font-semibold text-foreground tabular-nums">
          {value}
        </span>
        {suffix && (
          <span className="text-[10px] text-muted font-mono">{suffix}</span>
        )}
      </div>
    </div>
  );
}

function EventRow({ event }: { event: SubscriptionEvent }) {
  const { label } = formatEvent(event);
  const time = new Date(event.timestamp * 1000);
  const explorerHref = event.txHash
    ? `https://stellar.expert/explorer/testnet/tx/${event.txHash}`
    : `https://stellar.expert/explorer/testnet/ledger/${event.ledger}`;

  return (
    <li>
      <a
        href={explorerHref}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center justify-between gap-3 py-3 px-3 -mx-3 rounded-lg hover:bg-surface transition-colors"
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground group-hover:text-accent transition-colors truncate">
            {label}
          </p>
          {event.amount != null && event.amount > 0 && (
            <p className="text-xs text-muted font-mono mt-0.5">
              {(event.amount / 1e7).toFixed(2)} USDC
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <p className="text-xs text-muted">
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
}

function EventTimelineFallback({ subscriber }: { subscriber: SubscriberRow }) {
  // RPC retention has rolled past the real events. Synthesize one row per
  // billed period from on-chain subscription state. Link every row to the
  // merchant's account on Explorer — that account receives every charge so
  // its activity feed is the direct view of the actual charge transactions.
  const href = `https://stellar.expert/explorer/testnet/account/${subscriber.plan.merchant}`;
  const amount = Number(subscriber.plan.amount);
  const period = Number(subscriber.plan.period);
  const trialPeriods = subscriber.plan.trialPeriods ?? 0;

  type Row = {
    label: string;
    ts: number;
    amount?: number;
    kind: "signup" | "charge" | "cancelled";
  };
  const rows: Row[] = [];

  const signupBilled = subscriber.periodsBilled > 0 && trialPeriods === 0;
  rows.push({
    label: signupBilled ? "Subscribed & charged" : "Subscribed",
    ts: subscriber.createdAt,
    amount: signupBilled ? amount : undefined,
    kind: "signup",
  });

  const extraCharges = Math.max(
    0,
    subscriber.periodsBilled - (signupBilled ? 1 : 0),
  );
  for (let i = 0; i < extraCharges; i++) {
    rows.push({
      label: "Charge succeeded",
      ts: subscriber.createdAt + (i + 1) * period,
      amount,
      kind: "charge",
    });
  }

  if (subscriber.cancelledAt > 0) {
    rows.push({
      label: "Cancelled",
      ts: subscriber.cancelledAt,
      kind: "cancelled",
    });
  }

  rows.sort((a, b) => b.ts - a.ts);

  return (
    <div>
      <ul className="space-y-0.5">
        {rows.map((row, i) => {
          const time = new Date(row.ts * 1000);
          return (
            <li key={i}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between gap-3 py-3 px-3 -mx-3 rounded-lg hover:bg-surface transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground group-hover:text-accent transition-colors truncate">
                    {row.label}
                  </p>
                  {row.amount != null && row.amount > 0 && (
                    <p className="text-xs text-muted font-mono mt-0.5">
                      {(row.amount / 1e7).toFixed(2)} USDC
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <p className="text-xs text-muted">
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
      <p className="text-[10px] text-muted mt-4 italic">
        Live event log past its retention window. Rows are reconstructed from
        on-chain state and link to the merchant account where the underlying
        charge transactions are listed.
      </p>
    </div>
  );
}

function DetailRow({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <span className="font-mono text-xs text-foreground break-all">{value}</span>
  );
  return (
    <div className="flex items-start justify-between gap-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted shrink-0 mt-0.5">
        {label}
      </p>
      {href ? (
        <Link
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-right hover:text-accent transition-colors min-w-0"
        >
          {content}
          <ExternalLinkIcon size={11} className="shrink-0 text-muted" />
        </Link>
      ) : (
        <div className="text-right min-w-0">{content}</div>
      )}
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

function formatPeriod(seconds: number): string {
  if (seconds === 60) return "minute";
  if (seconds === 3600) return "hour";
  if (seconds === 86400) return "day";
  if (seconds === 604800) return "week";
  if (seconds === 2592000) return "month";
  if (seconds === 31536000) return "year";
  return `${seconds}s`;
}

function formatRelative(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

function formatDate(unix: number): string {
  return new Date(unix * 1000).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatEvent(event: SubscriptionEvent) {
  const lower = event.type.toLowerCase();
  if (lower.includes("charge_success") || lower.includes("charge"))
    return {
      label: "Charge succeeded",
      icon: <CheckIcon size={14} />,
      color: "text-success",
    };
  if (lower.includes("charge_failed") || lower.includes("failed"))
    return {
      label: "Charge failed",
      icon: <AlertTriangleIcon size={14} />,
      color: "text-error",
    };
  if (lower.includes("paused"))
    return {
      label: "Subscription paused",
      icon: <AlertTriangleIcon size={14} />,
      color: "text-warning",
    };
  if (lower.includes("cancelled"))
    return {
      label: "Subscription cancelled",
      icon: <CloseIcon size={14} />,
      color: "text-error",
    };
  if (lower.includes("reactivated"))
    return {
      label: "Subscription reactivated",
      icon: <CheckIcon size={14} />,
      color: "text-success",
    };
  if (lower.includes("created") || lower.includes("subscribed"))
    return {
      label: "Subscribed",
      icon: <CheckIcon size={14} />,
      color: "text-success",
    };
  if (lower.includes("expired"))
    return {
      label: "Subscription expired",
      icon: <CalendarIcon size={14} />,
      color: "text-muted",
    };
  if (lower.includes("refund"))
    return {
      label: "Refund issued",
      icon: <CircleDotIcon size={14} />,
      color: "text-accent",
    };
  return {
    label: event.type || "Event",
    icon: <CircleDotIcon size={14} />,
    color: "text-muted",
  };
}
