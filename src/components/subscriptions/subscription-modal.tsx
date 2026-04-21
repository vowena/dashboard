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
  CalendarIcon,
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
    // Synthesize from subscription state since RPC retention may have rolled
    const synth: Array<{
      label: string;
      ts: number;
      amount?: number;
      tone: "success" | "info" | "error" | "muted";
    }> = [
      {
        label: "Subscribed",
        ts: subscription.createdAt,
        amount:
          subscription.periodsBilled > 0
            ? Number(subscription.plan?.amount || 0)
            : undefined,
        tone: "success",
      },
    ];
    if (subscription.periodsBilled > 1) {
      synth.push({
        label: `${subscription.periodsBilled - 1} additional charge${subscription.periodsBilled > 2 ? "s" : ""}`,
        ts: subscription.createdAt,
        amount:
          (subscription.periodsBilled - 1) *
          Number(subscription.plan?.amount || 0),
        tone: "info",
      });
    }
    if (subscription.cancelledAt > 0) {
      synth.push({
        label: "Cancelled",
        ts: subscription.cancelledAt,
        tone: "error",
      });
    }
    return (
      <div>
        <ul className="space-y-1">
          {synth.map((s, i) => (
            <li key={i} className="flex items-start gap-3 py-2">
              <CircleIcon tone={s.tone} />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-medium text-foreground">
                    {s.label}
                  </p>
                  <p className="text-xs text-muted shrink-0">
                    {new Date(s.ts * 1000).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {s.amount != null && s.amount > 0 && (
                  <p className="text-xs text-muted mt-0.5 font-mono">
                    {(s.amount / 1e7).toFixed(2)} USDC
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
        <p className="text-[10px] text-muted mt-4 italic">
          Live event log updates as new events occur. Older events may not be
          retained by the RPC.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-1">
      {events.map((ev, i) => {
        const time = new Date(ev.timestamp * 1000);
        const explorerHref = ev.txHash
          ? `https://stellar.expert/explorer/testnet/tx/${ev.txHash}`
          : `https://stellar.expert/explorer/testnet/ledger/${ev.ledger}`;
        const label = humanizeEventType(ev.type);
        return (
          <li
            key={`${ev.ledger}-${i}`}
            className="group flex items-start gap-3 py-2"
          >
            <CircleIcon tone={eventTone(ev.type)} />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted shrink-0">
                  {time.toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="flex items-baseline justify-between gap-3 mt-0.5">
                {ev.amount != null && ev.amount > 0 ? (
                  <p className="text-xs text-muted font-mono">
                    {(ev.amount / 1e7).toFixed(2)} USDC
                  </p>
                ) : (
                  <span />
                )}
                <a
                  href={explorerHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-medium text-muted hover:text-accent inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                >
                  View on Explorer
                  <ExternalLinkIcon size={9} />
                </a>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function CircleIcon({
  tone,
}: {
  tone: "success" | "info" | "error" | "muted";
}) {
  const cls =
    tone === "success"
      ? "bg-success"
      : tone === "info"
        ? "bg-accent"
        : tone === "error"
          ? "bg-error"
          : "bg-muted";
  return (
    <span className={`w-2 h-2 rounded-full mt-2 shrink-0 ${cls}`} />
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

function eventTone(t: string): "success" | "info" | "error" | "muted" {
  const lower = t.toLowerCase();
  if (lower.includes("failed") || lower.includes("cancelled")) return "error";
  if (lower.includes("paused") || lower.includes("expired")) return "muted";
  if (
    lower.includes("success") ||
    lower.includes("subscribed") ||
    lower.includes("created") ||
    lower.includes("reactivated")
  )
    return "success";
  return "info";
}
