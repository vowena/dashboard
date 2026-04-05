"use client";

import Link from "next/link";
import { useWallet } from "@/components/wallet/wallet-provider";
import { Button } from "@/components/ui/button";

function VowenaSymbol({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 16C12 16 24 48 36 56C48 48 60 16 60 16" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="36" cy="56" r="4" fill="currentColor"/>
      <path d="M36 56C36 56 28 52 22 42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.4"/>
      <path d="M36 56C36 56 44 52 50 42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.4"/>
    </svg>
  );
}

export default function Home() {
  const { address, isConnected, connect } = useWallet();

  return (
    <div className="flex flex-col flex-1">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <VowenaSymbol className="w-7 h-7 text-accent" />
          <span className="text-lg font-semibold tracking-tight text-foreground" style={{ letterSpacing: "-0.03em" }}>
            vowena
          </span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="https://docs.vowena.xyz" className="text-sm text-muted hover:text-foreground transition-colors">
            Docs
          </Link>
          <Link href="https://github.com/vowena" className="text-sm text-muted hover:text-foreground transition-colors">
            GitHub
          </Link>
          {isConnected ? (
            <Link href="/merchant">
              <Button size="sm">Dashboard</Button>
            </Link>
          ) : (
            <Button size="sm" onClick={connect}>Connect wallet</Button>
          )}
        </div>
      </nav>

      {/* Hero */}
      <main className="flex flex-col items-center px-6 pt-24 pb-16 max-w-6xl mx-auto w-full">
        <div className="flex flex-col items-center text-center max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-surface text-xs font-medium text-muted mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            Live on Stellar Testnet
          </div>

          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-foreground leading-tight" style={{ letterSpacing: "-0.03em" }}>
            Trustless recurring payments on Stellar
          </h1>

          <p className="mt-5 text-lg text-secondary leading-relaxed max-w-lg">
            Create subscription plans. Authorize on-chain billing in USDC.
            One signature. No intermediaries.
          </p>

          <div className="flex items-center gap-3 mt-8">
            {isConnected ? (
              <>
                <Link href="/merchant">
                  <Button size="lg">Merchant dashboard</Button>
                </Link>
                <Link href="/subscriptions">
                  <Button variant="outline" size="lg">My subscriptions</Button>
                </Link>
              </>
            ) : (
              <>
                <Button size="lg" onClick={connect}>Get started</Button>
                <Link href="https://docs.vowena.xyz">
                  <Button variant="outline" size="lg">Read docs</Button>
                </Link>
              </>
            )}
          </div>

          {isConnected && (
            <p className="mt-4 text-xs text-muted font-mono">
              {address?.slice(0, 8)}...{address?.slice(-8)}
            </p>
          )}
        </div>

        {/* Code preview */}
        <div className="mt-20 w-full max-w-xl">
          <div className="rounded-xl border border-border bg-elevated overflow-hidden">
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border-subtle">
              <div className="w-2.5 h-2.5 rounded-full bg-error/40" />
              <div className="w-2.5 h-2.5 rounded-full bg-warning/40" />
              <div className="w-2.5 h-2.5 rounded-full bg-success/40" />
              <span className="ml-3 text-xs text-muted font-mono">subscribe.ts</span>
            </div>
            <pre className="p-5 text-sm leading-relaxed overflow-x-auto font-mono">
              <code>
                <span className="text-violet-400">import</span>{" "}
                <span className="text-foreground">{"{"} VowenaClient, toStroops {"}"}</span>{" "}
                <span className="text-violet-400">from</span>{" "}
                <span className="text-success">{'"vowena"'}</span>
                {"\n\n"}
                <span className="text-muted">// Subscribe to a plan — one signature</span>
                {"\n"}
                <span className="text-violet-400">const</span>{" "}
                <span className="text-foreground">xdr</span>{" "}
                <span className="text-muted">=</span>{" "}
                <span className="text-violet-400">await</span>{" "}
                <span className="text-foreground">client.</span>
                <span className="text-info">buildSubscribe</span>
                <span className="text-foreground">(</span>
                {"\n"}
                {"  "}<span className="text-foreground">wallet.address,</span>
                {"\n"}
                {"  "}<span className="text-warning">1</span>
                <span className="text-muted"> // plan ID</span>
                {"\n"}
                <span className="text-foreground">)</span>
              </code>
            </pre>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 w-full grid grid-cols-1 sm:grid-cols-3 gap-px bg-border rounded-xl overflow-hidden border border-border">
          {[
            {
              title: "On-chain billing",
              desc: "Contract pulls USDC each period via transfer_from. No server dependency.",
            },
            {
              title: "Price protection",
              desc: "Merchants can never silently raise prices. Migrations require explicit consent.",
            },
            {
              title: "Permissionless",
              desc: "Anyone can trigger billing. Only the merchant receives funds.",
            },
            {
              title: "Grace periods",
              desc: "Failed charges enter a grace window — not immediate cancellation.",
            },
            {
              title: "Free trials",
              desc: "Trial periods advance the counter without transferring tokens.",
            },
            {
              title: "$0.00001 per tx",
              desc: "Stellar makes micro-billing practical. 5-second finality.",
            },
          ].map((feature) => (
            <div key={feature.title} className="bg-elevated p-6">
              <h3 className="text-sm font-semibold text-foreground mb-1.5">
                {feature.title}
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Roles */}
        <div className="mt-24 w-full">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted mb-8 text-center">
            Built for everyone in the payment chain
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                role: "Merchants",
                desc: "Create billing plans, manage subscribers, automate recurring charges with the dashboard or SDK.",
                href: "/merchant",
              },
              {
                role: "Subscribers",
                desc: "View and manage all subscriptions across every merchant. Cancel anytime, directly on-chain.",
                href: "/subscriptions",
              },
              {
                role: "Developers",
                desc: "Install the SDK, integrate subscribe flows, run keeper bots. Everything is open source.",
                href: "https://docs.vowena.xyz",
              },
            ].map((item) => (
              <Link
                key={item.role}
                href={item.href}
                className="group rounded-xl border border-border bg-elevated p-6 hover:border-accent/30 transition-colors"
              >
                <h3 className="text-sm font-semibold text-foreground mb-2 group-hover:text-accent transition-colors">
                  {item.role}
                </h3>
                <p className="text-xs text-muted leading-relaxed">
                  {item.desc}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-auto">
        <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted">
            <VowenaSymbol className="w-4 h-4" />
            <span className="font-mono text-xs">vowena</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-muted">
            <Link href="https://docs.vowena.xyz" className="hover:text-foreground transition-colors">Docs</Link>
            <Link href="https://github.com/vowena" className="hover:text-foreground transition-colors">GitHub</Link>
            <Link href="https://vowena.xyz/blogs" className="hover:text-foreground transition-colors">Blog</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
