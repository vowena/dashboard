"use client";

import { useState } from "react";
import { useWallet } from "@/components/wallet/wallet-provider";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";

interface BillingEvent {
  id: string;
  type: string;
  amount: string;
  subscriber: string;
  timestamp: string;
}

export default function BillingPage() {
  const { isConnected } = useWallet();

  const [stats] = useState({
    monthlyRevenue: "0.00",
    churnRate: "0.0",
    failedCharges: 0,
    avgSubscriptionLength: "0",
  });

  const [events] = useState<BillingEvent[]>([]);

  if (!isConnected) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-semibold text-white">
          Connect wallet to view dashboard
        </h2>
        <p className="text-sm text-zinc-400">
          Please connect your Stellar wallet to view billing analytics.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold text-white">Billing Analytics</h1>

      <Card>
        <CardContent className="p-0">
          <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-950/50">
            <div className="text-center">
              <p className="text-zinc-400">Revenue chart coming soon</p>
              <p className="mt-1 text-sm text-zinc-600">
                Visualize your recurring revenue over time
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-400">
              Monthly Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">
              {stats.monthlyRevenue}{" "}
              <span className="text-lg text-zinc-500">USDC</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-400">
              Churn Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">
              {stats.churnRate}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-400">
              Failed Charges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">
              {stats.failedCharges}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-400">
              Avg Subscription Length
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">
              {stats.avgSubscriptionLength}{" "}
              <span className="text-lg text-zinc-500">months</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Billing Events</CardTitle>
          <CardDescription>Latest charges, refunds, and failures</CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-700 py-12">
              <p className="text-zinc-400">No billing events yet.</p>
              <p className="mt-1 text-sm text-zinc-600">
                Events will appear here as subscriptions are billed.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-white">
                      {event.type}
                    </p>
                    <p className="font-mono text-xs text-zinc-500">
                      {event.subscriber}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-white">{event.amount} USDC</p>
                    <p className="text-xs text-zinc-500">{event.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
