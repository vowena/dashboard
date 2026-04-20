"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useWallet } from "@/components/wallet/wallet-provider";
import { getPlan, type ChainPlan } from "@/lib/chain";
import { getLatestLedger, subscribeToPlan } from "@/lib/contract";
import { decodePlanId } from "@/lib/plan-id-codec";
import {
  readProjects,
  buildTrustlineTx,
  submitToHorizon,
  TUSDC_CODE,
  TUSDC_ISSUER,
} from "@/lib/account-data";
import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit/sdk";
import { Networks } from "@creit.tech/stellar-wallets-kit";
import { VowenaLogo } from "@/components/vowena-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  ArrowRightIcon,
  CheckIcon,
  CalendarIcon,
  AlertTriangleIcon,
  ExternalLinkIcon,
} from "@/components/ui/icons";

export default function CheckoutPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const planId = decodePlanId(String(params.planId));

  const returnUrl = searchParams.get("return") || "";
  const cancelUrl = searchParams.get("cancel") || "";
  const reference = searchParams.get("reference") || "";

  const { address, isConnected, connect, isInitializing } = useWallet();

  const [plan, setPlan] = useState<ChainPlan | null>(null);
  const [planName, setPlanName] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subError, setSubError] = useState<string | null>(null);
  const [needsTrustline, setNeedsTrustline] = useState(false);
  const [isEstablishingTrustline, setIsEstablishingTrustline] = useState(false);
  const [needsFunding, setNeedsFunding] = useState(false);
  const [isFunding, setIsFunding] = useState(false);
  const [fundingMessage, setFundingMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ subId: number } | null>(null);

  const handleFund = async () => {
    if (!address) return;
    setIsFunding(true);
    setSubError(null);
    setFundingMessage(null);
    try {
      const res = await fetch("/api/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Faucet request failed");
      }
      setFundingMessage(`Sent ${data.amount} ${data.asset}. Try Subscribe again.`);
      setNeedsFunding(false);
    } catch (err) {
      setSubError(
        err instanceof Error
          ? `Couldn't fund wallet: ${err.message}`
          : "Couldn't fund wallet",
      );
    } finally {
      setIsFunding(false);
    }
  };

  const handleEstablishTrustline = async () => {
    if (!address) return;
    setIsEstablishingTrustline(true);
    setSubError(null);
    try {
      const xdr = await buildTrustlineTx(address, TUSDC_CODE, TUSDC_ISSUER);
      const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
        networkPassphrase: Networks.TESTNET,
        address,
      });
      await submitToHorizon(signedTxXdr);
      setNeedsTrustline(false);
    } catch (err) {
      setSubError(
        err instanceof Error
          ? `Couldn't establish trustline: ${err.message}`
          : "Couldn't establish trustline",
      );
    } finally {
      setIsEstablishingTrustline(false);
    }
  };

  // Fetch plan on mount — uses a placeholder caller address since reads are public
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoadingPlan(true);
      setPlanError(null);
      try {
        // Reads are public; any valid Stellar address works as the simulation caller.
        const caller =
          address || "GAGRLI6F336OEJF627UNHBOPXI6VDQ75DRMSWSX2FQ25F3RFVWJOIIQU";
        const p = await getPlan(planId, caller);
        if (cancelled) return;
        setPlan(p);

        // Look up the plan's display name and project name from the merchant's
        // Stellar account data. Best-effort; if it fails the page still works
        // with a generic title.
        try {
          const projects = await readProjects(p.merchant);
          for (const proj of projects) {
            if (proj.planNames[planId]) {
              if (!cancelled) {
                setPlanName(proj.planNames[planId]);
                setProjectName(proj.name);
              }
              break;
            }
          }
        } catch {
          // metadata unavailable — fine, fall back to generic plan label
        }
      } catch (err) {
        if (!cancelled) {
          setPlanError(err instanceof Error ? err.message : "Plan not found");
        }
      } finally {
        if (!cancelled) setIsLoadingPlan(false);
      }
    };
    if (!isNaN(planId) && planId > 0) load();
    return () => {
      cancelled = true;
    };
  }, [planId, address]);

  const handleSubscribe = async () => {
    if (!plan || !address) return;
    setSubError(null);
    setNeedsTrustline(false);
    setNeedsFunding(false);
    setFundingMessage(null);
    setIsSubscribing(true);
    try {
      const ledger = await getLatestLedger();
      const result = await subscribeToPlan({
        subscriber: address,
        planId: plan.id,
        expirationLedger: ledger + 2_900_000,
        allowancePeriods: plan.maxPeriods > 0 ? plan.maxPeriods : 120,
      });

      const subId = extractSubId(result);

      // If a return URL was provided, redirect with success params
      if (returnUrl) {
        const url = new URL(returnUrl);
        url.searchParams.set("status", "success");
        if (subId) url.searchParams.set("sub_id", String(subId));
        if (reference) url.searchParams.set("reference", reference);
        window.location.href = url.toString();
        return;
      }

      setSuccess({ subId: subId ?? 0 });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to subscribe";

      // Stellar token contract returns Error(Contract, #13) for missing
      // trustline and Error(Contract, #10) for insufficient balance.
      const isTrustlineErr =
        /trustline entry is missing/i.test(msg) ||
        /Error\(Contract, #13\)/.test(msg);
      const isBalanceErr =
        /resulting balance is not within the allowed range/i.test(msg) ||
        /Error\(Contract, #10\)/.test(msg);

      if (isTrustlineErr) {
        setNeedsTrustline(true);
        setSubError(null);
      } else if (isBalanceErr) {
        setNeedsFunding(true);
        setSubError(null);
      } else {
        setSubError(msg);
      }
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleCancel = () => {
    if (cancelUrl) {
      window.location.href = cancelUrl;
    }
  };

  return (
    <>
      {/* Background grid */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: `
            linear-gradient(var(--border-default) 1px, transparent 1px),
            linear-gradient(90deg, var(--border-default) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
          opacity: 0.025,
        }}
      />
      <div className="fixed inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

      {/* Minimal nav */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="https://vowena.xyz" className="flex items-center">
            <VowenaLogo size="sm" />
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Main */}
      <main className="max-w-md mx-auto px-4 py-10 sm:py-16">
        {isLoadingPlan ? (
          <CheckoutSkeleton />
        ) : planError ? (
          <ErrorView title="Plan not found" message={planError} />
        ) : success ? (
          <SuccessView
            subId={success.subId}
            returnUrl={returnUrl}
            reference={reference}
          />
        ) : plan ? (
          <CheckoutBody
            plan={plan}
            planName={planName}
            projectName={projectName}
            isConnected={isConnected}
            isInitializing={isInitializing}
            connect={connect}
            isSubscribing={isSubscribing}
            subError={subError}
            needsTrustline={needsTrustline}
            isEstablishingTrustline={isEstablishingTrustline}
            onEstablishTrustline={handleEstablishTrustline}
            needsFunding={needsFunding}
            isFunding={isFunding}
            fundingMessage={fundingMessage}
            onFund={handleFund}
            onSubscribe={handleSubscribe}
            onCancel={cancelUrl ? handleCancel : undefined}
            address={address}
          />
        ) : null}

        {/* Footer */}
        <p className="mt-8 text-center text-[11px] text-muted">
          Powered by{" "}
          <Link
            href="https://vowena.xyz"
            className="text-secondary hover:text-foreground transition-colors"
          >
            Vowena
          </Link>{" "}
          · On-chain payments on Stellar
        </p>
      </main>
    </>
  );
}

function CheckoutBody({
  plan,
  planName,
  projectName,
  isConnected,
  isInitializing,
  connect,
  isSubscribing,
  subError,
  needsTrustline,
  isEstablishingTrustline,
  onEstablishTrustline,
  needsFunding,
  isFunding,
  fundingMessage,
  onFund,
  onSubscribe,
  onCancel,
  address,
}: {
  plan: ChainPlan;
  planName: string | null;
  projectName: string | null;
  isConnected: boolean;
  isInitializing: boolean;
  connect: () => Promise<void>;
  isSubscribing: boolean;
  subError: string | null;
  needsTrustline: boolean;
  isEstablishingTrustline: boolean;
  onEstablishTrustline: () => Promise<void>;
  needsFunding: boolean;
  isFunding: boolean;
  fundingMessage: string | null;
  onFund: () => Promise<void>;
  onSubscribe: () => void;
  onCancel?: () => void;
  address: string | null;
}) {
  const amount = (Number(plan.amount) / 1e7).toFixed(2);
  const ceiling = (Number(plan.priceCeiling) / 1e7).toFixed(2);
  const periodLabel = formatPeriod(plan.period);
  const totalCap =
    plan.maxPeriods > 0
      ? (Number(plan.priceCeiling) * plan.maxPeriods) / 1e7
      : null;

  return (
    <div className="rounded-2xl border border-border bg-elevated/80 backdrop-blur-xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 sm:px-8 pt-8 pb-6 text-center border-b border-border-subtle">
        {projectName && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent mb-3">
            {projectName}
          </p>
        )}
        {planName && (
          <h1 className="text-xl font-semibold text-foreground mb-3 tracking-tight">
            {planName}
          </h1>
        )}
        <div className="flex items-baseline justify-center gap-1.5 mb-2">
          <span className="text-4xl sm:text-5xl font-semibold text-foreground tracking-tight tabular-nums">
            {amount}
          </span>
          <span className="text-base text-muted font-mono">USDC</span>
        </div>
        <p className="text-sm text-secondary">per {periodLabel}</p>
      </div>

      {/* Plan details */}
      <div className="px-6 sm:px-8 py-6 space-y-3 border-b border-border-subtle">
        {plan.trialPeriods > 0 && (
          <DetailRow
            icon={<CheckIcon size={14} className="text-success" />}
            label={`${plan.trialPeriods} ${periodLabel} free trial`}
            value=""
          />
        )}
        <DetailRow
          icon={<CalendarIcon size={14} className="text-muted" />}
          label={`Renews every ${periodLabel}`}
          value=""
        />
        <DetailRow
          icon={<CheckIcon size={14} className="text-success" />}
          label="Cancel anytime"
          value=""
        />
        {plan.maxPeriods > 0 && (
          <DetailRow
            icon={<CheckIcon size={14} className="text-success" />}
            label={`Auto-ends after ${plan.maxPeriods} ${periodLabel}s`}
            value=""
          />
        )}
      </div>

      {/* Authorization summary */}
      <div className="px-6 sm:px-8 py-5 bg-surface/30 border-b border-border-subtle">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted mb-2">
          You&apos;re authorizing
        </p>
        <p className="text-xs text-secondary leading-relaxed">
          Up to{" "}
          <span className="text-foreground font-medium font-mono">
            {ceiling} USDC
          </span>{" "}
          per {periodLabel}
          {totalCap !== null && (
            <>
              {" "}
              ·{" "}
              <span className="text-foreground font-medium font-mono">
                {totalCap.toFixed(2)} USDC
              </span>{" "}
              total cap
            </>
          )}
          . The merchant cannot charge more than this. Cancel any time from your
          Vowena dashboard.
        </p>
      </div>

      {/* Action area */}
      <div className="px-6 sm:px-8 py-6 space-y-3">
        {needsTrustline && (
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangleIcon
                size={14}
                className="shrink-0 mt-0.5 text-warning"
              />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-warning">
                  USDC trustline required
                </p>
                <p className="text-xs text-secondary leading-relaxed">
                  Your wallet needs to opt in to USDC before it can be debited.
                  This is a one-time, free Stellar transaction.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={onEstablishTrustline}
              disabled={isEstablishingTrustline}
            >
              {isEstablishingTrustline
                ? "Establishing…"
                : "Establish USDC trustline"}
            </Button>
          </div>
        )}

        {needsFunding && (
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangleIcon
                size={14}
                className="shrink-0 mt-0.5 text-warning"
              />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-warning">
                  Insufficient USDC balance
                </p>
                <p className="text-xs text-secondary leading-relaxed">
                  Your wallet doesn&apos;t have enough USDC to be charged. On
                  testnet, click below to receive 1000 test USDC.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={onFund}
              disabled={isFunding}
            >
              {isFunding ? "Sending…" : "Get 1000 test USDC"}
            </Button>
          </div>
        )}

        {fundingMessage && (
          <div className="rounded-lg border border-success/30 bg-success-subtle px-3 py-2.5 text-xs text-success flex items-start gap-2">
            <CheckIcon size={14} className="shrink-0 mt-0.5" />
            <span className="leading-relaxed">{fundingMessage}</span>
          </div>
        )}

        {subError && !needsTrustline && !needsFunding && (
          <div className="rounded-lg border border-error/20 bg-error/5 px-3 py-2.5 text-xs text-error flex items-start gap-2">
            <AlertTriangleIcon size={14} className="shrink-0 mt-0.5" />
            <span className="leading-relaxed">{subError}</span>
          </div>
        )}

        {!isConnected ? (
          <Button
            size="lg"
            className="w-full h-11 gap-2"
            onClick={connect}
            disabled={isInitializing}
          >
            Connect wallet to continue
            <ArrowRightIcon size={14} />
          </Button>
        ) : (
          <Button
            size="lg"
            className="w-full h-11 gap-2"
            onClick={onSubscribe}
            disabled={isSubscribing || needsTrustline || needsFunding}
          >
            {isSubscribing
              ? "Confirming…"
              : needsTrustline
                ? "Establish trustline first"
                : needsFunding
                  ? "Fund wallet first"
                  : "Subscribe now"}
            {!isSubscribing && !needsTrustline && !needsFunding && (
              <ArrowRightIcon size={14} />
            )}
          </Button>
        )}

        {isConnected && address && (
          <p className="text-center text-[10px] text-muted font-mono">
            Paying as {address.slice(0, 6)}…{address.slice(-6)}
          </p>
        )}

        {onCancel && (
          <button
            onClick={onCancel}
            className="w-full text-center text-xs text-muted hover:text-foreground transition-colors py-1"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="shrink-0">{icon}</div>
      <p className="text-sm text-foreground flex-1">{label}</p>
      {value && (
        <p className="text-xs text-muted font-mono tabular-nums">{value}</p>
      )}
    </div>
  );
}

function SuccessView({
  subId,
  returnUrl,
  reference,
}: {
  subId: number;
  returnUrl: string;
  reference: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-elevated/80 backdrop-blur-xl shadow-2xl p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-success-subtle flex items-center justify-center mx-auto mb-5">
        <CheckIcon size={20} className="text-success" />
      </div>
      <h2 className="text-xl font-semibold text-foreground mb-2 tracking-tight">
        You&apos;re subscribed
      </h2>
      <p className="text-sm text-secondary mb-6 leading-relaxed">
        Subscription #{subId} is active on the Stellar blockchain.
      </p>
      <div className="space-y-2">
        <Link href="/subscriptions">
          <Button className="w-full gap-2">
            View my subscriptions
            <ArrowRightIcon size={14} />
          </Button>
        </Link>
        {returnUrl && (
          <a
            href={`${returnUrl}${returnUrl.includes("?") ? "&" : "?"}status=success&sub_id=${subId}${reference ? `&reference=${encodeURIComponent(reference)}` : ""}`}
          >
            <Button variant="outline" className="w-full gap-2">
              Continue
              <ExternalLinkIcon size={14} />
            </Button>
          </a>
        )}
      </div>
    </div>
  );
}

function ErrorView({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-2xl border border-border bg-elevated/80 backdrop-blur-xl shadow-2xl p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-5">
        <AlertTriangleIcon size={20} className="text-error" />
      </div>
      <h2 className="text-xl font-semibold text-foreground mb-2 tracking-tight">
        {title}
      </h2>
      <p className="text-sm text-secondary leading-relaxed">{message}</p>
    </div>
  );
}

function CheckoutSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-elevated/80 backdrop-blur-xl shadow-2xl overflow-hidden animate-pulse">
      <div className="px-8 pt-8 pb-6 text-center border-b border-border-subtle">
        <div className="h-3 w-20 bg-surface rounded mx-auto mb-4" />
        <div className="h-12 w-32 bg-surface rounded mx-auto mb-2" />
        <div className="h-4 w-24 bg-surface rounded mx-auto" />
      </div>
      <div className="px-8 py-6 space-y-3 border-b border-border-subtle">
        <div className="h-4 bg-surface rounded" />
        <div className="h-4 bg-surface rounded" />
        <div className="h-4 bg-surface rounded" />
      </div>
      <div className="px-8 py-6">
        <div className="h-11 bg-surface rounded-lg" />
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

function extractSubId(result: unknown): number | undefined {
  try {
    const r = result as Record<string, unknown>;
    const value =
      (r?.returnValue as unknown) ?? (r?.value as unknown) ?? result;
    if (typeof value === "number") return value;
    if (typeof value === "bigint") return Number(value);
    const withToBigInt = value as { toBigInt?: () => bigint };
    if (typeof withToBigInt?.toBigInt === "function") {
      return Number(withToBigInt.toBigInt());
    }
    return undefined;
  } catch {
    return undefined;
  }
}
