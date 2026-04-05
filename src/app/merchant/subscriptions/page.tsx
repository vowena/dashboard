"use client";

import { useState } from "react";
import { useWallet } from "@/components/wallet/wallet-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SubscriptionStatus = "Active" | "Paused" | "Cancelled" | "Expired";

interface BillingRecord {
  id: number;
  period: number;
  amount: string;
  date: string;
  txHash: string;
}

interface SubscriptionEntry {
  id: number;
  planId: number;
  planName: string;
  merchantAddress: string;
  token: string;
  amount: string;
  period: string;
  status: SubscriptionStatus;
  nextBillingDate: string;
  totalPaid: string;
  periodsBilled: number;
  migrationTarget: number;
  migrationPlanName?: string;
  billingHistory: BillingRecord[];
}

// ---------------------------------------------------------------------------
// Placeholder data
// ---------------------------------------------------------------------------

const PLACEHOLDER_SUBSCRIPTIONS: SubscriptionEntry[] = [
  {
    id: 1,
    planId: 101,
    planName: "Pro Monthly",
    merchantAddress: "GBXYZ...Q4R7MERCHANT1AAAAAAAAAAAAAAAAAAAAAA",
    token: "USDC",
    amount: "9.99",
    period: "Monthly",
    status: "Active",
    nextBillingDate: "2026-05-01",
    totalPaid: "29.97",
    periodsBilled: 3,
    migrationTarget: 0,
    billingHistory: [
      { id: 1, period: 1, amount: "9.99", date: "2026-02-01", txHash: "abc123...def" },
      { id: 2, period: 2, amount: "9.99", date: "2026-03-01", txHash: "ghi456...jkl" },
      { id: 3, period: 3, amount: "9.99", date: "2026-04-01", txHash: "mno789...pqr" },
    ],
  },
  {
    id: 2,
    planId: 202,
    planName: "Storage Basic",
    merchantAddress: "GCABC...D5E6MERCHANT2BBBBBBBBBBBBBBBBBBBBBB",
    token: "XLM",
    amount: "50.00",
    period: "Weekly",
    status: "Active",
    nextBillingDate: "2026-04-11",
    totalPaid: "500.00",
    periodsBilled: 10,
    migrationTarget: 203,
    migrationPlanName: "Storage Plus",
    billingHistory: [
      { id: 4, period: 9, amount: "50.00", date: "2026-03-28", txHash: "stu012...vwx" },
      { id: 5, period: 10, amount: "50.00", date: "2026-04-04", txHash: "yza345...bcd" },
    ],
  },
  {
    id: 3,
    planId: 303,
    planName: "API Access",
    merchantAddress: "GDEFG...H8I9MERCHANT3CCCCCCCCCCCCCCCCCCCCCC",
    token: "USDC",
    amount: "25.00",
    period: "Monthly",
    status: "Cancelled",
    nextBillingDate: "-",
    totalPaid: "75.00",
    periodsBilled: 3,
    migrationTarget: 0,
    billingHistory: [
      { id: 6, period: 1, amount: "25.00", date: "2026-01-15", txHash: "efg678...hij" },
      { id: 7, period: 2, amount: "25.00", date: "2026-02-15", txHash: "klm901...nop" },
      { id: 8, period: 3, amount: "25.00", date: "2026-03-15", txHash: "qrs234...tuv" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

function badgeVariant(
  status: SubscriptionStatus,
): "active" | "paused" | "cancelled" | "expired" {
  switch (status) {
    case "Active":
      return "active";
    case "Paused":
      return "paused";
    case "Cancelled":
      return "cancelled";
    case "Expired":
      return "expired";
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SubscriptionsPage() {
  const { address, isConnected } = useWallet();
  const [subscriptions, setSubscriptions] = useState<SubscriptionEntry[]>(
    PLACEHOLDER_SUBSCRIPTIONS,
  );
  const [expandedHistory, setExpandedHistory] = useState<Set<number>>(
    new Set(),
  );

  // -- handlers ---------------------------------------------------------------

  function handleCancel(subscriptionId: number) {
    // TODO: Call contract cancel via signTransaction
    setSubscriptions((prev) =>
      prev.map((sub) =>
        sub.id === subscriptionId
          ? { ...sub, status: "Cancelled" as SubscriptionStatus, nextBillingDate: "-" }
          : sub,
      ),
    );
  }

  function handleAcceptMigration(subscriptionId: number) {
    // TODO: Call contract accept_migration via signTransaction
    setSubscriptions((prev) =>
      prev.map((sub) =>
        sub.id === subscriptionId
          ? {
              ...sub,
              migrationTarget: 0,
              planName: sub.migrationPlanName ?? sub.planName,
              migrationPlanName: undefined,
            }
          : sub,
      ),
    );
  }

  function handleRejectMigration(subscriptionId: number) {
    // TODO: Call contract reject_migration via signTransaction
    setSubscriptions((prev) =>
      prev.map((sub) =>
        sub.id === subscriptionId
          ? { ...sub, migrationTarget: 0, migrationPlanName: undefined }
          : sub,
      ),
    );
  }

  function toggleHistory(subscriptionId: number) {
    setExpandedHistory((prev) => {
      const next = new Set(prev);
      if (next.has(subscriptionId)) {
        next.delete(subscriptionId);
      } else {
        next.add(subscriptionId);
      }
      return next;
    });
  }

  // -- disconnected state -----------------------------------------------------

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-3xl font-bold text-foreground">My Subscriptions</h1>
          <p className="mt-4 text-muted">
            Connect wallet to view your subscriptions
          </p>
        </div>
      </div>
    );
  }

  // -- connected state --------------------------------------------------------

  return (
    <div className="min-h-screen bg-background px-4 py-16">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold text-foreground">My Subscriptions</h1>
        <p className="mt-1 text-sm text-muted">
          Wallet: {truncateAddress(address ?? "")}
        </p>

        {subscriptions.length === 0 ? (
          <p className="mt-12 text-center text-muted">
            No subscriptions found.
          </p>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {subscriptions.map((sub) => (
              <Card key={sub.id} className="flex flex-col">
                {/* Migration banner */}
                {sub.migrationTarget > 0 && (
                  <div className="rounded-t-xl border-b border-amber-800 bg-amber-900/30 px-6 py-3">
                    <p className="text-sm font-medium text-amber-300">
                      Migration available &mdash; Review new plan
                      {sub.migrationPlanName && (
                        <span className="text-warning">
                          {" "}
                          ({sub.migrationPlanName})
                        </span>
                      )}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleAcceptMigration(sub.id)}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectMigration(sub.id)}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                )}

                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle>{sub.planName}</CardTitle>
                    <Badge variant={badgeVariant(sub.status)}>
                      {sub.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted">
                    {truncateAddress(sub.merchantAddress)}
                  </p>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col gap-4">
                  {/* Key metrics */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <span className="text-muted">Amount</span>
                      <p className="font-medium text-foreground">
                        {sub.amount} {sub.token}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted">Period</span>
                      <p className="font-medium text-foreground">{sub.period}</p>
                    </div>
                    <div>
                      <span className="text-muted">Next billing</span>
                      <p className="font-medium text-foreground">
                        {sub.nextBillingDate}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted">Total paid</span>
                      <p className="font-medium text-foreground">
                        {sub.totalPaid} {sub.token}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted">Periods billed</span>
                      <p className="font-medium text-foreground">
                        {sub.periodsBilled}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-auto flex gap-2 pt-2">
                    {sub.status === "Active" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleCancel(sub.id)}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleHistory(sub.id)}
                    >
                      {expandedHistory.has(sub.id)
                        ? "Hide history"
                        : "Billing history"}
                    </Button>
                  </div>

                  {/* Billing history */}
                  {expandedHistory.has(sub.id) && (
                    <div className="mt-2 rounded-lg border border-border bg-surface/50">
                      {sub.billingHistory.length === 0 ? (
                        <p className="px-4 py-3 text-sm text-muted">
                          No billing records yet.
                        </p>
                      ) : (
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border text-left text-muted">
                              <th className="px-4 py-2 font-medium">#</th>
                              <th className="px-4 py-2 font-medium">Date</th>
                              <th className="px-4 py-2 font-medium">Amount</th>
                              <th className="px-4 py-2 font-medium">Tx</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sub.billingHistory.map((record) => (
                              <tr
                                key={record.id}
                                className="border-b border-border/50 last:border-0"
                              >
                                <td className="px-4 py-2 text-muted">
                                  {record.period}
                                </td>
                                <td className="px-4 py-2 text-foreground">
                                  {record.date}
                                </td>
                                <td className="px-4 py-2 text-foreground">
                                  {record.amount} {sub.token}
                                </td>
                                <td className="px-4 py-2 font-mono text-xs text-muted">
                                  {record.txHash}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
