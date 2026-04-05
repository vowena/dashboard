"use client";

import { useState } from "react";
import { useWallet } from "@/components/wallet/wallet-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SubscriptionStatus = "active" | "paused" | "cancelled";

interface Subscription {
  id: string;
  subscriberAddress: string;
  planId: string;
  status: SubscriptionStatus;
  periodsBilled: number;
  nextBilling: string;
}

const FILTER_TABS: { label: string; value: SubscriptionStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Paused", value: "paused" },
  { label: "Cancelled", value: "cancelled" },
];

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function SubscribersPage() {
  const { isConnected } = useWallet();
  const [filter, setFilter] = useState<SubscriptionStatus | "all">("all");
  const [subscriptions] = useState<Subscription[]>([]);

  if (!isConnected) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-semibold text-foreground">
          Connect wallet to view dashboard
        </h2>
        <p className="text-sm text-muted">
          Please connect your Stellar wallet to view subscribers.
        </p>
      </div>
    );
  }

  const filtered =
    filter === "all"
      ? subscriptions
      : subscriptions.filter((s) => s.status === filter);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold text-foreground">Subscribers</h1>

      <div className="flex gap-1 rounded-lg bg-background p-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium transition-colors",
              filter === tab.value
                ? "bg-elevated text-foreground"
                : "text-muted hover:text-zinc-200",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
          <p className="text-muted">No subscribers found.</p>
          <p className="mt-1 text-sm text-muted">
            Subscribers will appear here once users subscribe to your plans.
          </p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                      Subscriber
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                      Periods Billed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                      Next Billing
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((sub) => (
                    <tr key={sub.id} className="hover:bg-elevated/50">
                      <td className="whitespace-nowrap px-6 py-4 font-mono text-sm text-secondary">
                        {truncateAddress(sub.subscriberAddress)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 font-mono text-sm text-secondary">
                        {sub.planId.slice(0, 8)}...
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <Badge variant={sub.status}>{sub.status}</Badge>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-secondary">
                        {sub.periodsBilled}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-secondary">
                        {sub.nextBilling}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm">
                            Refund
                          </Button>
                          <Button variant="destructive" size="sm">
                            Cancel
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
