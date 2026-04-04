"use client";

import { useState } from "react";
import Link from "next/link";
import { useWallet } from "@/components/wallet/wallet-provider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

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
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-semibold text-white">
          Connect wallet to view dashboard
        </h2>
        <p className="text-sm text-zinc-400">
          Please connect your Stellar wallet to access the merchant dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Welcome back
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Connected as{" "}
          <span className="font-mono text-zinc-300">
            {truncateAddress(address!)}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-400">
              Total Plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{stats.totalPlans}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-400">
              Active Subscribers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">
              {stats.activeSubscribers}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-400">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">
              {stats.totalRevenue}{" "}
              <span className="text-lg text-zinc-500">USDC</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-400">
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">
              {stats.successRate}%
            </p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-white">
          Quick Actions
        </h2>
        <div className="flex gap-3">
          <Link href="/merchant/plans">
            <Button>Create Plan</Button>
          </Link>
          <Link href="/merchant/subscribers">
            <Button variant="secondary">View Subscribers</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
