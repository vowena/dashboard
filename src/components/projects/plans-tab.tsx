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
import { formatChainError } from "@/lib/chain-errors";

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
          merchantAddress={project.merchant}
          projectId={project.id}
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

  const trialDays = Math.round(
    ((plan.trialPeriods || 0) * plan.period) / 86_400,
  );

  return (
    <div className="rounded-xl border border-border bg-elevated p-6 group flex flex-col">
      {/* Header: name + status badge */}
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
            {trialDays > 0 && ` · ${trialDays}-day free trial`}
          </p>
        </div>
        <Badge variant={plan.active ? "active" : "expired"}>
          {plan.active ? "Active" : "Inactive"}
        </Badge>
      </div>

      {/* Bottom: copy link + ID inline on one row */}
      <div className="mt-auto pt-5 border-t border-border-subtle flex items-center gap-2">
        <button
          onClick={handleCopyLink}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-accent-subtle text-accent hover:bg-accent hover:text-white transition-colors text-xs font-medium"
        >
          {copiedLink ? (
            <>
              <CheckIcon size={12} />
              Link copied
            </>
          ) : (
            <>
              <ExternalLinkIcon size={12} />
              Copy checkout link
            </>
          )}
        </button>
        <button
          onClick={handleCopyId}
          className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs text-muted hover:text-foreground hover:bg-surface transition-colors font-mono shrink-0"
          title="Plan ID"
        >
          {copiedId ? (
            <CheckIcon size={12} className="text-success" />
          ) : (
            <CopyIcon size={12} />
          )}
          {encodedId}
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

function CreatePlanForm({
  merchantAddress,
  projectId,
  onClose,
  onSuccess,
}: {
  merchantAddress: string;
  projectId: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { refetch } = useProjects();
  const [name, setName] = useState("");
  const [token, setToken] = useState(TUSDC_SAC);
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState("2592000");
  const [trialDays, setTrialDays] = useState("0");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [submitStatus, setSubmitStatus] = useState<"" | "creating">("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const amt = parseFloat(amount);
      const periodSeconds = parseInt(period);
      const planName = name.trim();
      // Convert trial DAYS into trial PERIODS: round to whole periods.
      // For sub-day plans (testing), 0 days = 0 periods.
      const trialDaysNum = parseInt(trialDays) || 0;
      const trialPeriods =
        periodSeconds > 0
          ? Math.round((trialDaysNum * 86_400) / periodSeconds)
          : 0;

      setSubmitStatus("creating");
      await createPlan({
        merchant: merchantAddress,
        token,
        amountUsdc: amt,
        period: periodSeconds,
        trialPeriods,
        // Locked-down defaults so users don't have to think:
        //   - max_periods = 0  →  subscription has no hard cap
        //   - grace_period = 1 day  →  subscriber has 24h to fix a failed charge
        //   - priceCeiling = amount  →  contract can't ever charge more than the
        //     declared amount; if the merchant raises prices later it would
        //     require subscribers to re-consent (cleanest 'no surprise debits' model)
        maxPeriods: 0,
        gracePeriod: 86_400,
        priceCeilingUsdc: amt,
        name: planName,
        projectId,
      });

      await refetch();
      onSuccess();
    } catch (err) {
      setError(formatChainError(err, "Couldn't create plan"));
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
        <Field label="Price (USDC)" required>
          <Input
            type="number"
            step="0.01"
            placeholder="9.99"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </Field>

        <Field label="Bills every" required>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="w-full h-9 rounded-lg border border-border bg-elevated px-3 text-sm focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none"
          >
            <option value="60">Minute (testing only)</option>
            <option value="3600">Hour</option>
            <option value="86400">Day</option>
            <option value="604800">Week</option>
            <option value="2592000">Month</option>
            <option value="7776000">Quarter</option>
            <option value="31536000">Year</option>
          </select>
        </Field>

        <Field
          label="Free trial (days)"
          hint="Optional. 0 = charge on signup."
        >
          <Input
            type="number"
            placeholder="0"
            min="0"
            value={trialDays}
            onChange={(e) => setTrialDays(e.target.value)}
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
