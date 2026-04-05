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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface Plan {
  id: string;
  tokenAddress: string;
  amount: string;
  period: string;
  activeSubscribers: number;
  status: "active" | "paused";
}

const PERIOD_OPTIONS = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annual", label: "Annual" },
  { value: "custom", label: "Custom" },
];

const USDC_TOKEN_ADDRESS =
  "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA";

export default function PlansPage() {
  const { isConnected } = useWallet();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [plans] = useState<Plan[]>([]);

  const [formData, setFormData] = useState({
    tokenAddress: USDC_TOKEN_ADDRESS,
    amount: "",
    period: "monthly",
    trialPeriods: "0",
    maxPeriods: "0",
    gracePeriod: "0",
    priceCeiling: "",
  });

  if (!isConnected) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-semibold text-foreground">
          Connect wallet to view dashboard
        </h2>
        <p className="text-sm text-muted">
          Please connect your Stellar wallet to manage plans.
        </p>
      </div>
    );
  }

  function handleFieldChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: call contract to create plan
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Your Plans</h1>
        <Button onClick={() => setShowCreateForm((prev) => !prev)}>
          {showCreateForm ? "Cancel" : "Create Plan"}
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Plan</CardTitle>
            <CardDescription>
              Define the terms for a new recurring payment plan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <Input
                label="Token Address"
                name="tokenAddress"
                value={formData.tokenAddress}
                onChange={handleFieldChange}
                placeholder="Soroban token contract address"
              />

              <Input
                label="Amount"
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleFieldChange}
                placeholder="e.g. 9.99"
              />

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="period"
                  className="text-sm font-medium text-secondary"
                >
                  Period
                </label>
                <select
                  id="period"
                  name="period"
                  value={formData.period}
                  onChange={handleFieldChange}
                  className="flex h-10 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
                >
                  {PERIOD_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Input
                  label="Trial Periods"
                  name="trialPeriods"
                  type="number"
                  value={formData.trialPeriods}
                  onChange={handleFieldChange}
                  placeholder="0"
                />
                <Input
                  label="Max Periods"
                  name="maxPeriods"
                  type="number"
                  value={formData.maxPeriods}
                  onChange={handleFieldChange}
                  placeholder="0 = unlimited"
                />
                <Input
                  label="Grace Period (seconds)"
                  name="gracePeriod"
                  type="number"
                  value={formData.gracePeriod}
                  onChange={handleFieldChange}
                  placeholder="0"
                />
              </div>

              <Input
                label="Price Ceiling"
                name="priceCeiling"
                type="number"
                value={formData.priceCeiling}
                onChange={handleFieldChange}
                placeholder="Max amount the plan can be updated to"
              />

              <div className="flex justify-end">
                <Button type="submit">Create Plan</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
          <p className="text-muted">No plans created yet.</p>
          <p className="mt-1 text-sm text-muted">
            Create your first subscription plan to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="font-mono text-sm">
                    {plan.id.slice(0, 8)}...
                  </CardTitle>
                  <Badge variant={plan.status === "active" ? "active" : "paused"}>
                    {plan.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Amount</span>
                    <span className="text-foreground">{plan.amount} USDC</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Period</span>
                    <span className="text-foreground">{plan.period}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Active Subscribers</span>
                    <span className="text-foreground">{plan.activeSubscribers}</span>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Button variant="outline" size="sm">
                      Edit Amount
                    </Button>
                    <Button variant="ghost" size="sm">
                      Migrate
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
