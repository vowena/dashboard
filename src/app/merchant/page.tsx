"use client";

import { useState } from "react";
import Link from "next/link";
import { useWallet } from "@/components/wallet/wallet-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function MerchantOverviewPage() {
  const { address, isConnected } = useWallet();

  const [stats] = useState({
    totalPlans: 0,
    activeSubscribers: 0,
    totalRevenue: "0.00",
    successRate: "0.0",
  });

  if (!isConnected) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <h2 className="text-lg font-semibold text-foreground">
          Connect wallet to continue
        </h2>
        <p className="text-sm text-muted">
          Connect your Stellar wallet to access the merchant dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted mb-1">
          Overview
        </p>
        <h1 className="text-xl font-semibold text-foreground tracking-tight">
          Welcome back
        </h1>
        <p className="mt-1 text-sm text-muted">
          <span className="font-mono text-xs text-secondary">
            {address?.slice(0, 8)}...{address?.slice(-4)}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Plans", value: stats.totalPlans, suffix: "" },
          { label: "Active Subscribers", value: stats.activeSubscribers, suffix: "" },
          { label: "Total Revenue", value: stats.totalRevenue, suffix: " USDC" },
          { label: "Success Rate", value: stats.successRate, suffix: "%" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-5">
              <p className="text-xs font-medium text-muted mb-2">{stat.label}</p>
              <p className="text-2xl font-semibold text-foreground tabular-nums">
                {stat.value}
                {stat.suffix && (
                  <span className="text-sm font-normal text-muted ml-1">{stat.suffix}</span>
                )}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <p className="text-xs font-medium text-muted mb-3">Quick actions</p>
        <div className="flex gap-3">
          <Link href="/merchant/plans">
            <Button size="sm">Create plan</Button>
          </Link>
          <Link href="/merchant/subscribers">
            <Button variant="outline" size="sm">View subscribers</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
