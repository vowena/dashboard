"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useWallet } from "@/components/wallet/wallet-provider";
import {
  useWorkspaces,
  getWorkspacePlansWithData,
} from "@/hooks/useWorkspaces";
import { WorkspaceSidebar } from "@/components/workspaces/workspace-sidebar";
import { VowenaLogo } from "@/components/vowena-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function WorkspaceDashboardPage() {
  const { address, disconnect } = useWallet();
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id as string;

  const { getWorkspace } = useWorkspaces();
  const [activeTab, setActiveTab] = useState("plans");
  const [workspace, setWorkspace] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);

  // Load workspace data
  useEffect(() => {
    const ws = getWorkspace(workspaceId);
    if (!ws) {
      router.push("/workspaces");
      return;
    }
    setWorkspace(ws);

    // Fetch plans for this workspace
    const loadPlans = async () => {
      setIsLoadingPlans(true);
      try {
        const plansData = await getWorkspacePlansWithData(ws.merchantAddress);
        setPlans(plansData);
      } catch (error) {
        console.error("Failed to load plans:", error);
      } finally {
        setIsLoadingPlans(false);
      }
    };

    loadPlans();
  }, [workspaceId, getWorkspace, router]);

  if (!workspace) {
    return null;
  }

  return (
    <div className="min-h-screen bg-primary flex flex-col">
      {/* Top bar */}
      <div className="sticky top-0 z-40 border-b border-border bg-elevated/80 backdrop-blur-xl">
        <div className="max-w-full mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-4">
              <VowenaLogo size="sm" />
              <h1 className="text-lg font-semibold text-foreground hidden sm:block">
                {workspace.name}
              </h1>
            </div>
            <nav className="hidden sm:flex items-center gap-6 text-sm">
              <a href="/subscriptions" className="text-secondary hover:text-foreground transition-colors">
                My Subscriptions
              </a>
              <a href="/workspaces" className="text-secondary hover:text-foreground transition-colors">
                Workspaces
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {address && (
              <>
                <div className="text-xs font-mono text-muted hidden sm:block">
                  {address.slice(0, 8)}...{address.slice(-8)}
                </div>
                <Button variant="ghost" size="sm" onClick={disconnect}>
                  Disconnect
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main content with sidebar */}
      <div className="flex flex-1 overflow-hidden">
        <WorkspaceSidebar
          workspace={workspace}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Content area */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-5xl mx-auto px-6 py-8">
            {activeTab === "plans" && (
              <div>
                <div className="mb-8 flex items-center justify-between">
                  <h2 className="text-3xl font-semibold text-foreground">
                    Plans
                  </h2>
                  <Button>New Plan</Button>
                </div>

                {isLoadingPlans ? (
                  <div className="text-center py-12">
                    <p className="text-muted">Loading plans...</p>
                  </div>
                ) : plans.length === 0 ? (
                  <Card className="p-12 text-center">
                    <p className="text-muted text-lg mb-4">No plans yet</p>
                    <p className="text-secondary text-sm mb-6">
                      Create your first billing plan
                    </p>
                    <Button>Create Plan</Button>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {plans.map((plan) => (
                      <Card key={plan.id} className="p-6">
                        <h3 className="font-semibold text-foreground mb-4">
                          Plan #{plan.id}
                        </h3>
                        <div className="space-y-2 text-sm mb-6">
                          <div className="flex justify-between">
                            <span className="text-muted">Amount</span>
                            <span className="text-foreground font-mono">
                              {(Number(plan.amount) / 1e7).toFixed(2)} USDC
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted">Period</span>
                            <span className="text-foreground font-mono">
                              {plan.period}s
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted">Trial periods</span>
                            <span className="text-foreground font-semibold">
                              {plan.trialPeriods}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted">Max periods</span>
                            <span className="text-foreground font-semibold">
                              {plan.maxPeriods > 0 ? plan.maxPeriods : "∞"}
                            </span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="w-full">
                          Edit
                        </Button>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "subscribers" && (
              <div>
                <h2 className="text-3xl font-semibold text-foreground mb-8">
                  Subscribers
                </h2>
                <Card className="p-12 text-center">
                  <p className="text-muted">Subscribers coming soon</p>
                </Card>
              </div>
            )}

            {activeTab === "billing" && (
              <div>
                <h2 className="text-3xl font-semibold text-foreground mb-8">
                  Billing
                </h2>
                <Card className="p-12 text-center">
                  <p className="text-muted">Billing analytics coming soon</p>
                </Card>
              </div>
            )}

            {activeTab === "keeper" && (
              <div>
                <h2 className="text-3xl font-semibold text-foreground mb-8">
                  Keeper
                </h2>
                <Card className="p-12 text-center">
                  <p className="text-muted">Keeper management coming soon</p>
                </Card>
              </div>
            )}

            {activeTab === "integrate" && (
              <div>
                <h2 className="text-3xl font-semibold text-foreground mb-8">
                  Integration
                </h2>
                <div className="space-y-6">
                  <Card className="p-8">
                    <h3 className="font-semibold text-foreground mb-4">
                      1. Install SDK
                    </h3>
                    <pre className="bg-surface rounded p-4 text-xs text-muted overflow-x-auto">
                      <code>npm install vowena</code>
                    </pre>
                  </Card>

                  <Card className="p-8">
                    <h3 className="font-semibold text-foreground mb-4">
                      2. Initialize
                    </h3>
                    <pre className="bg-surface rounded p-4 text-xs text-muted overflow-x-auto">
                      <code>
{`import { VowenaClient } from 'vowena';

const client = new VowenaClient({
  contractId: 'CAHGU3...',
  rpcUrl: 'https://soroban-testnet.stellar.org'
});`}
                      </code>
                    </pre>
                  </Card>

                  <Card className="p-8">
                    <h3 className="font-semibold text-foreground mb-4">
                      3. Create Subscribe Button
                    </h3>
                    <pre className="bg-surface rounded p-4 text-xs text-muted overflow-x-auto">
                      <code>
{`<SubscribeButton
  planId={123}
  workspace="${workspace.id}"
/>`}
                      </code>
                    </pre>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
