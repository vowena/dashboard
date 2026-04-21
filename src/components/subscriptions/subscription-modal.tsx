"use client";

import { useState, useEffect } from "react";
import { Subscription } from "@/hooks/useSubscriptions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { encodePlanId } from "@/lib/plan-id-codec";
import { useSubscriptionEvents } from "@/hooks/useSubscriptionEvents";
import {
  CloseIcon,
  CopyIcon,
  CheckIcon,
  ExternalLinkIcon,
} from "@/components/ui/icons";

interface SubscriptionModalProps {
  subscription: Subscription | null;
  isOpen: boolean;
  onClose: () => void;
  onCancel?: () => Promise<void>;
}

export function SubscriptionModal({
  subscription,
  isOpen,
  onClose,
  onCancel,
}: SubscriptionModalProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "history" | "details"
  >("overview");
  const [isLoading, setIsLoading] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen || !subscription) return null;

  const now = Math.floor(Date.now() / 1000);
  const nextBillingIn = subscription.nextBillingTime - now;
  const nextBillingCountdown = formatDuration(Math.abs(nextBillingIn));

  const handleCancel = async () => {
    if (!onCancel) return;
    setIsLoading(true);
    try {
      await onCancel();
      onClose();
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const amount = subscription.plan?.amount
    ? (Number(subscription.plan.amount) / 1e7).toFixed(2)
    : "0.00";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
        <div
          className="w-full max-w-2xl max-h-[88vh] flex flex-col rounded-2xl border border-border bg-elevated shadow-2xl pointer-events-auto animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-5 flex items-start justify-between border-b border-border">
            <div className="flex items-start gap-4 min-w-0">
              <div className="w-11 h-11 rounded-lg bg-accent-subtle flex items-center justify-center text-accent font-semibold text-sm shrink-0">
                {(subscription.projectName?.[0] || "•").toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted mb-1 truncate">
                  {subscription.projectName || "Project"}
                </p>
                <h2 className="text-lg font-semibold text-foreground tracking-tight truncate">
                  {subscription.planName || "Subscription"}
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  subscription.status === "Active"
                    ? "active"
                    : subscription.status === "Paused"
                      ? "paused"
                      : subscription.status === "Cancelled"
                        ? "cancelled"
                        : "expired"
                }
              >
                {subscription.status}
              </Badge>
              <button
                onClick={onClose}
                className="text-muted hover:text-foreground hover:bg-surface rounded-md p-2 transition-colors"
                aria-label="Close"
              >
                <CloseIcon size={16} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6 flex gap-6 border-b border-border">
            {(["overview", "history", "details"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-0 text-sm font-medium border-b-2 transition-colors -mb-px ${
                  activeTab === tab
                    ? "text-foreground border-accent"
                    : "text-muted border-transparent hover:text-secondary"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Hero amount */}
                <div className="rounded-xl bg-surface p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted mb-2">
                    Amount per period
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-semibold text-foreground tracking-tight tabular-nums">
                      {amount}
                    </span>
                    <span className="text-sm text-muted font-mono">USDC</span>
                    <span className="text-sm text-muted">
                      / {subscription.plan?.period || 0}s
                    </span>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-4">
                  <Stat
                    label="Periods billed"
                    value={subscription.periodsBilled.toString()}
                  />
                  <Stat
                    label="Next billing"
                    value={nextBillingIn > 0 ? nextBillingCountdown : "Due now"}
                  />
                  <Stat
                    label="Created"
                    value={new Date(
                      subscription.createdAt * 1000,
                    ).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  />
                  <Stat
                    label="Trial periods"
                    value={subscription.plan?.trialPeriods?.toString() || "0"}
                  />
                  {subscription.cancelledAt > 0 && (
                    <Stat
                      label="Cancelled"
                      value={new Date(
                        subscription.cancelledAt * 1000,
                      ).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    />
                  )}
                </div>
              </div>
            )}

            {activeTab === "history" && (
              <SubHistoryView subscription={subscription} />
            )}

            {activeTab === "details" && (
              <div className="space-y-1">
                {subscription.projectName && (
                  <DetailRow label="Project" value={subscription.projectName} />
                )}
                {subscription.planName && (
                  <DetailRow label="Plan" value={subscription.planName} />
                )}
                <DetailRow
                  label="Subscription ID"
                  value={`sub_${encodePlanId(subscription.id)}`}
                />
                <DetailRow
                  label="Plan ID"
                  value={encodePlanId(subscription.planId)}
                />
                <DetailRow
                  label="Your wallet"
                  value={subscription.subscriber}
                  copyable
                  external={`https://stellar.expert/explorer/testnet/account/${subscription.subscriber}`}
                />
                {subscription.plan?.merchant && (
                  <DetailRow
                    label="Merchant"
                    value={subscription.plan.merchant}
                    copyable
                    external={`https://stellar.expert/explorer/testnet/account/${subscription.plan.merchant}`}
                  />
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
            {subscription.status === "Active" && (
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={isLoading}
              >
                {isLoading ? "Cancelling…" : "Cancel subscription"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted mb-1.5">
        {label}
      </p>
      <p className="text-sm text-foreground font-medium">{value}</p>
    </div>
  );
}

function DetailRow({
  label,
  value,
  copyable,
  external,
}: {
  label: string;
  value: string;
  copyable?: boolean;
  external?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-border-subtle last:border-b-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted shrink-0 mr-4">
        {label}
      </p>
      <div className="flex items-center gap-2 min-w-0">
        <p className="text-xs font-mono text-foreground truncate">{value}</p>
        {copyable && (
          <button
            onClick={handleCopy}
            className="text-muted hover:text-foreground transition-colors p-1 rounded shrink-0"
            aria-label="Copy"
          >
            {copied ? (
              <CheckIcon size={12} className="text-success" />
            ) : (
              <CopyIcon size={12} />
            )}
          </button>
        )}
        {external && (
          <a
            href={external}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted hover:text-foreground transition-colors p-1 rounded shrink-0"
            aria-label="Open in explorer"
          >
            <ExternalLinkIcon size={12} />
          </a>
        )}
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400)
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  return `${Math.floor(seconds / 86400)}d`;
}

function SubHistoryView({ subscription }: { subscription: Subscription }) {
  const { data: events, isLoading } = useSubscriptionEvents(subscription.id);

  if (isLoading) {
    return (
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
    );
  }

  if (!events || events.length === 0) {
    // RPC retention has rolled past the actual events. Synthesize a row PER
    // billed period so users see every charge as its own entry, not a
    // consolidated "N additional charges" lump.
    const items = synthesizeEntries(subscription);
    return (
      <div>
        <ul className="space-y-0.5">
          {items.map((item, i) => (
            <li key={i}>
              {item.href ? (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between gap-3 py-3 px-3 -mx-3 rounded-lg hover:bg-surface transition-colors"
                >
                  <SynthRowBody item={item} />
                </a>
              ) : (
                <div className="flex items-center justify-between gap-3 py-3 px-3 -mx-3">
                  <SynthRowBody item={item} />
                </div>
              )}
            </li>
          ))}
        </ul>
        <p className="text-[10px] text-muted mt-4 italic">
          Live event log was past its retention window. Rows are reconstructed
          from on-chain state and link to the merchant account where the
          underlying charge transactions are listed.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-0.5">
      {events.map((ev, i) => {
        const time = new Date(ev.timestamp * 1000);
        const explorerHref = ev.txHash
          ? `https://stellar.expert/explorer/testnet/tx/${ev.txHash}`
          : `https://stellar.expert/explorer/testnet/ledger/${ev.ledger}`;
        const label = humanizeEventType(ev.type);
        return (
          <li key={`${ev.ledger}-${i}`}>
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
                {ev.amount != null && ev.amount > 0 && (
                  <p className="text-xs text-muted font-mono mt-0.5">
                    {(ev.amount / 1e7).toFixed(2)} USDC
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
  );
}

interface SynthEntry {
  label: string;
  ts: number;
  amount?: number;
  href?: string;
  /** "signup", "charge", "cancelled" — lets the row show a subtle type chip */
  kind: "signup" | "charge" | "cancelled";
}

/**
 * When RPC event retention has rolled past the real events we can still give
 * the subscriber a row-per-charge view by walking `periodsBilled`. Each row
 * links to the subscriber's account on Stellar Explorer so they can inspect
 * the underlying transaction.
 */
function synthesizeEntries(subscription: Subscription): SynthEntry[] {
  // Link fallback to the merchant's account on Explorer — that account
  // receives every charge, so its activity feed is the most direct view of
  // the actual charge transactions when the specific tx hashes aren't in
  // scope anymore.
  const merchant = subscription.plan?.merchant;
  const href = merchant
    ? `https://stellar.expert/explorer/testnet/account/${merchant}`
    : undefined;
  const amount = Number(subscription.plan?.amount || 0);
  const period = Number(subscription.plan?.period || 0);
  const entries: SynthEntry[] = [];

  const trialPeriods = subscription.plan?.trialPeriods ?? 0;
  const signupBilled =
    subscription.periodsBilled > 0 && trialPeriods === 0;
  entries.push({
    label: signupBilled ? "Subscribed & charged" : "Subscribed",
    ts: subscription.createdAt,
    amount: signupBilled ? amount : undefined,
    href,
    kind: "signup",
  });

  const extraCharges = Math.max(
    0,
    subscription.periodsBilled - (signupBilled ? 1 : 0),
  );
  for (let i = 0; i < extraCharges; i++) {
    const ts = subscription.createdAt + (i + 1) * period;
    entries.push({
      label: "Charge succeeded",
      ts,
      amount,
      href,
      kind: "charge",
    });
  }

  if (subscription.cancelledAt > 0) {
    entries.push({
      label: "Cancelled",
      ts: subscription.cancelledAt,
      href,
      kind: "cancelled",
    });
  }

  return entries.sort((a, b) => b.ts - a.ts);
}

function SynthRowBody({ item }: { item: SynthEntry }) {
  const time = new Date(item.ts * 1000);
  return (
    <>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground group-hover:text-accent transition-colors truncate">
          {item.label}
        </p>
        {item.amount != null && item.amount > 0 && (
          <p className="text-xs text-muted font-mono mt-0.5">
            {(item.amount / 1e7).toFixed(2)} USDC
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
        {item.href && (
          <ExternalLinkIcon
            size={11}
            className="text-muted group-hover:text-accent transition-colors"
          />
        )}
      </div>
    </>
  );
}

function humanizeEventType(t: string): string {
  const lower = t.toLowerCase();
  if (lower.includes("charge_success") || lower === "charge")
    return "Charge succeeded";
  if (lower.includes("charge_failed")) return "Charge failed";
  if (lower.includes("paused")) return "Paused";
  if (lower.includes("cancelled")) return "Cancelled";
  if (lower.includes("reactivated")) return "Reactivated";
  if (lower.includes("created") || lower.includes("subscribed"))
    return "Subscribed";
  if (lower.includes("expired")) return "Expired";
  if (lower.includes("refund")) return "Refund issued";
  return t || "Event";
}
