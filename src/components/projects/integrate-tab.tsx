"use client";

import { useState } from "react";
import { CopyIcon, CheckIcon, ExternalLinkIcon } from "@/components/ui/icons";
import { encodePlanId, planCheckoutUrl } from "@/lib/plan-id-codec";
import type { NamedPlan } from "@/hooks/useProjects";

interface IntegrateTabProps {
  project: { name: string; merchant: string };
  plans: NamedPlan[];
}

export function IntegrateTab({ project, plans }: IntegrateTabProps) {
  const firstPlan = plans[0];
  const sampleEncodedId = firstPlan ? encodePlanId(firstPlan.id) : "PLAN_ID";
  const sampleCheckoutUrl = firstPlan
    ? planCheckoutUrl(firstPlan.id)
    : `https://app.vowena.xyz/p/${sampleEncodedId}`;

  return (
    <div>
      <div className="mb-8 sm:mb-10 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
          Developer
        </p>
        <h2 className="text-2xl sm:text-[1.75rem] font-semibold text-foreground tracking-tight">
          Integrate
        </h2>
        <p className="text-sm text-secondary">
          Drop {project.name} payments into your app in minutes.
        </p>
      </div>

      <div className="space-y-4 mb-8">
        <Step
          number={1}
          title="Share the checkout link"
          description="The fastest way to accept payments — no code, no SDK."
        >
          <CodeBlock code={sampleCheckoutUrl} />
          <p className="text-[11px] text-muted mt-2">
            Send this URL anywhere — email, social, your landing page. Anyone
            with a Stellar wallet can subscribe.
          </p>
        </Step>

        <Step
          number={2}
          title="Or install the SDK"
          description="For programmatic integration."
        >
          <CodeBlock code="npm install @vowena/sdk" />
        </Step>

        <Step
          number={3}
          title="Initialize the client"
          description="Configure with your contract and network."
        >
          <CodeBlock
            code={`import { VowenaClient, NETWORKS } from "@vowena/sdk";

const vowena = new VowenaClient(NETWORKS.testnet);`}
          />
        </Step>

        <Step
          number={4}
          title="Subscribe a user programmatically"
          description="Build the subscribe transaction and let the user sign it with their wallet."
        >
          <CodeBlock
            code={
              firstPlan
                ? `// ${firstPlan.name || "Plan"} (${(Number(firstPlan.amount) / 1e7).toFixed(2)} USDC every ${formatPeriod(firstPlan.period)})
const xdr = await vowena.buildSubscribe(userAddress, ${firstPlan.id});

// Sign with the user's wallet, then submit
const signedXdr = await wallet.signTransaction(xdr);
await vowena.submitTransaction(signedXdr);`
                : `// Create a plan first to see a working example here
const xdr = await vowena.buildSubscribe(userAddress, YOUR_PLAN_ID);
const signedXdr = await wallet.signTransaction(xdr);
await vowena.submitTransaction(signedXdr);`
            }
          />
        </Step>

        <Step
          number={5}
          title="Verify a subscription on your server"
          description="The blockchain is the source of truth — no webhook signing needed."
        >
          <CodeBlock
            code={`// On your server, after the user returns from checkout
const sub = await vowena.getSubscription(subId);

if (sub.status === "Active") {
  // Grant access
}`}
          />
        </Step>
      </div>

      {/* Plan reference */}
      <div className="rounded-xl border border-border bg-elevated overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">
            Your plans
          </h3>
          <p className="text-xs text-muted mt-0.5">
            Copy a checkout link or plan ID to use in your integration.
          </p>
        </div>
        {plans.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-muted">
              Create a plan first to see it here.
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

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="relative group">
      <pre className="rounded-lg bg-surface border border-border-subtle px-4 py-3 text-xs font-mono text-foreground overflow-x-auto leading-relaxed whitespace-pre">
        <code>{code}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded-md bg-elevated border border-border opacity-0 group-hover:opacity-100 transition-opacity hover:text-accent"
        aria-label="Copy"
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

function PlanReferenceRow({ plan }: { plan: NamedPlan }) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const amount = (Number(plan.amount) / 1e7).toFixed(2);
  const encodedId = encodePlanId(plan.id);
  const checkoutUrl = planCheckoutUrl(plan.id);
  const displayName = plan.name || `Plan ${encodedId}`;

  const copy = async (
    text: string,
    setFlag: (b: boolean) => void,
  ) => {
    await navigator.clipboard.writeText(text);
    setFlag(true);
    setTimeout(() => setFlag(false), 1500);
  };

  return (
    <div className="px-6 py-4 border-b border-border-subtle last:border-0">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            {displayName}
          </p>
          <p className="text-xs text-muted mt-0.5">
            {amount} USDC every {formatPeriod(plan.period)}
            {plan.trialPeriods > 0 &&
              ` · ${plan.trialPeriods} ${formatPeriod(plan.period)} trial`}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => copy(checkoutUrl, setCopiedLink)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono bg-accent-subtle text-accent hover:bg-accent hover:text-white transition-colors"
        >
          {copiedLink ? (
            <CheckIcon size={12} />
          ) : (
            <ExternalLinkIcon size={12} />
          )}
          {copiedLink ? "Link copied" : "Copy checkout link"}
        </button>
        <button
          onClick={() => copy(encodedId, setCopiedId)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono bg-surface text-secondary hover:text-foreground transition-colors"
        >
          {copiedId ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
          {copiedId ? "ID copied" : `ID: ${encodedId}`}
        </button>
      </div>
    </div>
  );
}

function formatPeriod(seconds: number): string {
  if (seconds === 60) return "minute";
  if (seconds === 3600) return "hour";
  if (seconds === 86400) return "day";
  if (seconds === 604800) return "week";
  if (seconds === 2592000) return "month";
  if (seconds === 7776000) return "quarter";
  if (seconds === 31536000) return "year";
  return `${seconds}s`;
}
