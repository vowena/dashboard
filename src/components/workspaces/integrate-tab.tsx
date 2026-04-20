"use client";

import { useState } from "react";
import { CopyIcon, CheckIcon } from "@/components/ui/icons";

interface IntegrateTabProps {
  workspace: any;
  plans: any[];
}

export function IntegrateTab({ workspace, plans }: IntegrateTabProps) {
  return (
    <div>
      <div className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent mb-2">
          Developer
        </p>
        <h2 className="text-2xl font-semibold text-foreground tracking-tight mb-1">
          Integrate
        </h2>
        <p className="text-sm text-secondary">
          Drop Vowena into your app in minutes.
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-4 mb-8">
        <Step
          number={1}
          title="Install the SDK"
          description="Add Vowena to your project."
        >
          <CodeBlock code="npm install @vowena/sdk" />
        </Step>

        <Step
          number={2}
          title="Initialize the client"
          description="Configure with your contract and network."
        >
          <CodeBlock
            language="ts"
            code={`import { VowenaClient } from "@vowena/sdk";

const vowena = new VowenaClient({
  contractId: "CBENQGQPLC3CKU5HCRZPBIT6RSZVLUJKUCVPJFJGYJ3OXEW7BZCXULC2",
  rpcUrl: "https://soroban-testnet.stellar.org",
  networkPassphrase: "Test SDF Network ; September 2015",
});`}
          />
        </Step>

        <Step
          number={3}
          title="Subscribe a user"
          description="Build the subscribe transaction and let the user sign it."
        >
          <CodeBlock
            language="ts"
            code={plans.length > 0
              ? `// Build a subscribe XDR for plan #${plans[0].id}
const xdr = await vowena.buildSubscribe({
  subscriber: userAddress,
  planId: ${plans[0].id},
  expirationLedger: currentLedger + 2_900_000,
  allowancePeriods: ${plans[0].maxPeriods || 12},
});

// Sign with user's wallet, then submit
const signedXdr = await wallet.signTransaction(xdr);
await vowena.submit(signedXdr);`
              : `// Create a plan first to see your plan ID here
const xdr = await vowena.buildSubscribe({
  subscriber: userAddress,
  planId: YOUR_PLAN_ID,
  expirationLedger: currentLedger + 2_900_000,
  allowancePeriods: 12,
});`}
          />
        </Step>
      </div>

      {/* Quick reference */}
      <div className="rounded-xl border border-border bg-elevated overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">
            Plan reference
          </h3>
          <p className="text-xs text-muted mt-0.5">
            Copy plan IDs to use in your integration.
          </p>
        </div>
        {plans.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-muted">
              Create a plan first to see your IDs here.
            </p>
          </div>
        ) : (
          <div>
            {plans.map((plan) => (
              <PlanReferenceRow key={plan.id} plan={plan} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Step({
  number,
  title,
  description,
  children,
}: {
  number: number;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-elevated p-6">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-7 h-7 shrink-0 rounded-full bg-accent-subtle flex items-center justify-center text-accent text-xs font-semibold">
          {number}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-secondary mt-0.5">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function CodeBlock({
  code,
  language = "shell",
}: {
  code: string;
  language?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="relative group">
      <pre className="rounded-lg bg-surface border border-border-subtle px-4 py-3 text-xs font-mono text-foreground overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded-md bg-elevated border border-border opacity-0 group-hover:opacity-100 transition-opacity hover:text-accent"
        aria-label="Copy code"
      >
        {copied ? (
          <CheckIcon size={12} className="text-success" />
        ) : (
          <CopyIcon size={12} />
        )}
      </button>
    </div>
  );
}

function PlanReferenceRow({ plan }: { plan: any }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(plan.id.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const amount = (Number(plan.amount) / 1e7).toFixed(2);

  return (
    <div className="px-6 py-4 border-b border-border-subtle last:border-0 flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-foreground">
          Plan #{plan.id}
        </p>
        <p className="text-xs text-muted mt-0.5">
          {amount} USDC every {plan.period}s
        </p>
      </div>
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono bg-surface hover:bg-accent-subtle hover:text-accent transition-colors"
      >
        {plan.id}
        {copied ? (
          <CheckIcon size={12} className="text-success" />
        ) : (
          <CopyIcon size={12} />
        )}
      </button>
    </div>
  );
}
