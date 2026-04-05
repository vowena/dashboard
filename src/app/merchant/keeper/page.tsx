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
import { cn } from "@/lib/utils";

interface KeeperAction {
  id: string;
  action: string;
  subscriptionsCharged: number;
  timestamp: string;
  status: "success" | "partial" | "failed";
}

export default function KeeperPage() {
  const { isConnected } = useWallet();
  const [autoBilling, setAutoBilling] = useState(false);

  const [keeperStatus] = useState({
    lastRun: "Never",
    nextScheduledRun: "Not scheduled",
    subscriptionsCharged: 0,
  });

  const [actions] = useState<KeeperAction[]>([]);

  if (!isConnected) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-semibold text-foreground">
          Connect wallet to view dashboard
        </h2>
        <p className="text-sm text-muted">
          Please connect your Stellar wallet to manage billing automation.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold text-foreground">Billing Automation</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Auto-Billing</CardTitle>
            <CardDescription>
              Automatically charge due subscriptions on a schedule.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary">
                  {autoBilling ? "Auto-billing is enabled" : "Auto-billing is disabled"}
                </p>
              </div>
              <button
                onClick={() => setAutoBilling((prev) => !prev)}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors",
                  autoBilling ? "bg-accent" : "bg-surface",
                )}
                role="switch"
                aria-checked={autoBilling}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform",
                    autoBilling ? "translate-x-5.5" : "translate-x-0.5",
                  )}
                />
              </button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manual Trigger</CardTitle>
            <CardDescription>
              Charge all subscriptions that are currently due.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => {
                // TODO: call keeper charge_all_due
              }}
            >
              Charge All Due
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Keeper Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted">
                Last Run
              </p>
              <p className="mt-1 text-sm text-foreground">
                {keeperStatus.lastRun}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted">
                Next Scheduled Run
              </p>
              <p className="mt-1 text-sm text-foreground">
                {keeperStatus.nextScheduledRun}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted">
                Subscriptions Charged
              </p>
              <p className="mt-1 text-sm text-foreground">
                {keeperStatus.subscriptionsCharged}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Keeper Actions</CardTitle>
          <CardDescription>Log of automated and manual billing runs</CardDescription>
        </CardHeader>
        <CardContent>
          {actions.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12">
              <p className="text-muted">No keeper actions recorded yet.</p>
              <p className="mt-1 text-sm text-muted">
                Actions will appear here after billing runs are triggered.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {actions.map((action) => (
                <div
                  key={action.id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {action.action}
                    </p>
                    <p className="text-xs text-muted">
                      {action.subscriptionsCharged} subscription
                      {action.subscriptionsCharged !== 1 ? "s" : ""} charged
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        action.status === "success" && "text-success",
                        action.status === "partial" && "text-warning",
                        action.status === "failed" && "text-error",
                      )}
                    >
                      {action.status}
                    </p>
                    <p className="text-xs text-muted">{action.timestamp}</p>
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
