"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  PlusIcon,
  CloseIcon,
  CopyIcon,
  CheckIcon,
  ExternalLinkIcon,
} from "@/components/ui/icons";
import { createPlan } from "@/lib/contract";
import { useProjects } from "@/hooks/useProjects";
import { encodePlanId, planCheckoutUrl } from "@/lib/plan-id-codec";

interface PlansTabProps {
  project: any;
  plans: any[];
  isLoading: boolean;
  onCreated?: () => void;
}

const TUSDC_SAC = "CARX6UEO5WL2IMHPCFURHXNRQJQ4NHSMN26SK6FNE7FN27LISLZDINFA";

export function PlansTab({
  project,
  plans,
  isLoading,
  onCreated,
}: PlansTabProps) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 sm:mb-10">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
            Pricing plans
          </p>
          <h2 className="text-2xl sm:text-[1.75rem] font-semibold text-foreground tracking-tight">
            Plans
          </h2>
          <p className="text-sm text-secondary">
            Define what you charge and how often.
          </p>
        </div>
        {!showForm && (
          <Button
            onClick={() => setShowForm(true)}
            className="gap-2 shrink-0 self-start sm:self-end"
          >
            <PlusIcon size={14} />
            New plan
          </Button>
        )}
      </div>

      {showForm && (
        <CreatePlanForm
          merchantAddress={project.merchantAddress}
          projectSlot={project.slot}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            onCreated?.();
          }}
        />
      )}

      {isLoading ? (
        <PlansSkeleton />
      ) : plans.length === 0 && !showForm ? (
        <div className="rounded-xl border border-border border-dashed bg-surface/30 p-10 sm:p-12 text-center">
          <h3 className="text-base font-semibold text-foreground mb-2 tracking-tight">
            No plans yet
          </h3>
          <p className="text-sm text-secondary mb-6 max-w-sm mx-auto leading-relaxed">
            Create your first pricing plan to start accepting subscribers.
          </p>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <PlusIcon size={14} />
            Create plan
          </Button>
        </div>
      ) : plans.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PlanCard({ plan }: { plan: any }) {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const amount = (Number(plan.amount) / 1e7).toFixed(2);
  const encodedId = encodePlanId(plan.id);
  const displayName = plan.name || `Plan ${encodedId}`;
  const checkoutUrl = planCheckoutUrl(plan.id);

  const handleCopyId = async () => {
    await navigator.clipboard.writeText(encodedId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1500);
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(checkoutUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 1500);
  };

  return (
    <div className="rounded-xl border border-border bg-elevated p-6 group flex flex-col">
      <div className="flex items-start justify-between mb-5 gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-foreground tracking-tight truncate mb-1">
            {displayName}
          </h3>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-semibold text-foreground tabular-nums tracking-tight">
              {amount}
            </span>
            <span className="text-xs text-muted font-mono">USDC</span>
          </div>
          <p className="text-xs text-muted mt-0.5">
            every {formatPeriodFriendly(plan.period)}
          </p>
        </div>
        <Badge variant={plan.active ? "active" : "expired"}>
          {plan.active ? "Active" : "Inactive"}
        </Badge>
      </div>

      <div className="space-y-1.5 text-xs mb-5 pb-5 border-b border-border-subtle">
        <Row
          label="Trial"
          value={`${plan.trialPeriods} period${plan.trialPeriods !== 1 ? "s" : ""}`}
        />
        <Row
          label="Max periods"
          value={plan.maxPeriods > 0 ? plan.maxPeriods.toString() : "Unlimited"}
        />
        <Row label="Grace" value={`${plan.gracePeriod}s`} />
        <Row
          label="Ceiling"
          value={`${(Number(plan.priceCeiling) / 1e7).toFixed(2)} USDC`}
        />
      </div>

      <div className="space-y-2 mt-auto">
        <button
          onClick={handleCopyLink}
          className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-accent-subtle text-accent hover:bg-accent hover:text-white transition-colors text-xs font-medium"
        >
          <span className="flex items-center gap-2">
            {copiedLink ? (
              <CheckIcon size={12} />
            ) : (
              <ExternalLinkIcon size={12} />
            )}
            {copiedLink ? "Link copied" : "Copy checkout link"}
          </span>
        </button>
        <button
          onClick={handleCopyId}
          className="w-full flex items-center justify-between text-xs text-muted hover:text-foreground transition-colors px-3"
        >
          <span>ID</span>
          <span className="flex items-center gap-1.5 font-mono">
            {encodedId}
            {copiedId ? (
              <CheckIcon size={12} className="text-success" />
            ) : (
              <CopyIcon size={12} />
            )}
          </span>
        </button>
      </div>
    </div>
  );
}

function formatPeriodFriendly(seconds: number): string {
  if (seconds === 60) return "minute";
  if (seconds === 3600) return "hour";
  if (seconds === 86400) return "day";
  if (seconds === 604800) return "week";
  if (seconds === 2592000) return "month";
  if (seconds === 7776000) return "quarter";
  if (seconds === 31536000) return "year";
  return `${seconds}s`;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-muted">{label}</span>
      <span className="text-foreground font-medium">{value}</span>
    </div>
  );
}

function CreatePlanForm({
  merchantAddress,
  projectSlot,
  onClose,
  onSuccess,
}: {
  merchantAddress: string;
  projectSlot: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { tagAndNamePlan, refetch } = useProjects();
  const [name, setName] = useState("");
  const [token, setToken] = useState(TUSDC_SAC);
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState("2592000");
  const [trialPeriods, setTrialPeriods] = useState("0");
  const [maxPeriods, setMaxPeriods] = useState("0");
  const [gracePeriod, setGracePeriod] = useState("86400");
  const [priceCeiling, setPriceCeiling] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [submitStatus, setSubmitStatus] = useState<"" | "creating" | "tagging">(
    "",
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const amt = parseFloat(amount);
      const ceiling = priceCeiling ? parseFloat(priceCeiling) : amt * 2;
      const planName = name.trim();

      // Step 1: create plan on the Vowena contract
      setSubmitStatus("creating");
      const result = await createPlan({
        merchant: merchantAddress,
        token,
        amountUsdc: amt,
        period: parseInt(period),
        trialPeriods: parseInt(trialPeriods),
        maxPeriods: parseInt(maxPeriods),
        gracePeriod: parseInt(gracePeriod),
        priceCeilingUsdc: ceiling,
      });

      // Step 2: extract plan ID and tag + name it (single Stellar tx)
      const planId = extractPlanId(result);
      if (planId != null) {
        setSubmitStatus("tagging");
        try {
          await tagAndNamePlan(planId, projectSlot, planName);
        } catch (tagErr) {
          console.error("Plan created but tagging failed:", tagErr);
          // Non-fatal — plan exists on chain, just not associated/named here
        }
      }

      await refetch();
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create plan");
    } finally {
      setIsSubmitting(false);
      setSubmitStatus("");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-border bg-elevated p-6 sm:p-8 mb-6 sm:mb-8"
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-foreground tracking-tight">
            New plan
          </h3>
          <p className="text-xs text-secondary mt-1">
            This creates a plan on the Stellar blockchain.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-muted hover:text-foreground hover:bg-surface rounded-md p-2 transition-colors -m-2"
        >
          <CloseIcon size={14} />
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-error/20 bg-error/5 px-3 py-2 text-xs text-error">
          {error}
        </div>
      )}

      <div className="mb-4">
        <Field label="Plan name" required>
          <Input
            placeholder="Pro Monthly"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={64}
            autoFocus
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Amount (USDC)" required>
          <Input
            type="number"
            step="0.01"
            placeholder="9.99"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </Field>

        <Field label="Period" required>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="w-full h-9 rounded-lg border border-border bg-elevated px-3 text-sm focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none"
          >
            <option value="60">Every minute (testing)</option>
            <option value="3600">Hourly</option>
            <option value="86400">Daily</option>
            <option value="604800">Weekly</option>
            <option value="2592000">Monthly</option>
            <option value="7776000">Quarterly</option>
            <option value="31536000">Yearly</option>
          </select>
        </Field>

        <Field label="Trial periods" hint="Free periods at start">
          <Input
            type="number"
            placeholder="0"
            value={trialPeriods}
            onChange={(e) => setTrialPeriods(e.target.value)}
          />
        </Field>

        <Field label="Max periods" hint="0 = unlimited">
          <Input
            type="number"
            placeholder="0"
            value={maxPeriods}
            onChange={(e) => setMaxPeriods(e.target.value)}
          />
        </Field>

        <Field
          label="Grace (seconds)"
          hint="Time before pause on failed charge"
        >
          <Input
            type="number"
            placeholder="86400"
            value={gracePeriod}
            onChange={(e) => setGracePeriod(e.target.value)}
          />
        </Field>

        <Field
          label="Price ceiling (USDC)"
          hint="Max future price (defaults to 2× amount)"
        >
          <Input
            type="number"
            step="0.01"
            placeholder={amount ? (parseFloat(amount) * 2).toFixed(2) : ""}
            value={priceCeiling}
            onChange={(e) => setPriceCeiling(e.target.value)}
          />
        </Field>
      </div>

      <div className="mt-4">
        <details className="group">
          <summary className="text-xs text-muted hover:text-foreground transition-colors cursor-pointer select-none list-none flex items-center gap-1.5">
            <span className="transition-transform group-open:rotate-90">›</span>
            Advanced
          </summary>
          <div className="mt-3 pt-3 border-t border-border-subtle">
            <Field label="Token contract" hint="Stellar SAC for the asset to bill in. Defaults to TUSDC on testnet.">
              <Input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="font-mono text-xs"
              />
            </Field>
          </div>
        </details>
      </div>

      <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-border-subtle">
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !amount || !name.trim()}
        >
          {submitStatus === "creating"
            ? "Creating plan on chain…"
            : submitStatus === "tagging"
              ? "Saving to project…"
              : isSubmitting
                ? "Signing…"
                : "Create plan"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-foreground mb-1.5">
        {label}
        {required && <span className="text-error ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[10px] text-muted mt-1">{hint}</p>}
    </div>
  );
}

/**
 * Pull the plan ID (u64) out of a Vowena contract create_plan submit result.
 * The SDK returns `returnValue` which may be a number, bigint, or an ScVal-like
 * object depending on the submission path. Handle all of them.
 */
function extractPlanId(result: unknown): number | null {
  try {
    const r = result as { returnValue?: unknown };
    const v = r?.returnValue;
    if (v == null) return null;
    if (typeof v === "number") return v;
    if (typeof v === "bigint") return Number(v);
    if (typeof v === "string" && /^\d+$/.test(v)) return Number(v);
    const maybe = v as { toBigInt?: () => bigint; u64?: () => bigint };
    if (typeof maybe?.toBigInt === "function") return Number(maybe.toBigInt());
    if (typeof maybe?.u64 === "function") return Number(maybe.u64());
    return null;
  } catch {
    return null;
  }
}

function PlansSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-border bg-elevated p-6 animate-pulse"
        >
          <div className="h-3 w-16 bg-surface rounded mb-3" />
          <div className="h-8 w-24 bg-surface rounded mb-2" />
          <div className="h-3 w-20 bg-surface rounded mb-6" />
          <div className="space-y-2">
            <div className="h-3 bg-surface rounded" />
            <div className="h-3 bg-surface rounded" />
            <div className="h-3 bg-surface rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
