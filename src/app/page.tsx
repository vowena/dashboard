"use client";

import Link from "next/link";
import Image from "next/image";
import { useWallet } from "@/components/wallet/wallet-provider";
import { Button } from "@/components/ui/button";
import { VowenaLogo, VowenaSymbol } from "@/components/vowena-logo";
import { ThemeToggle } from "@/components/theme-toggle";

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  );
}

export default function Home() {
  const { address, isConnected, connect } = useWallet();

  return (
    <div className="flex flex-col flex-1">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto w-full">
        <Link href="/"><VowenaLogo /></Link>
        <div className="flex items-center gap-5">
          <Link href="/docs" className="text-sm text-muted hover:text-foreground transition-colors flex items-center gap-1.5">
            <BookIcon className="w-3.5 h-3.5" />
            Docs
          </Link>
          <Link href="https://github.com/vowena" className="text-muted hover:text-foreground transition-colors">
            <GitHubIcon className="w-4 h-4" />
          </Link>
          <ThemeToggle />
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
                <Link href="/docs">
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
                <span className="text-muted">// Subscribe to a plan - one signature</span>
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
            { title: "On-chain billing", desc: "Contract pulls USDC each period via transfer_from. No server dependency." },
            { title: "Price protection", desc: "Merchants can never silently raise prices. Migrations require explicit consent." },
            { title: "Permissionless", desc: "Anyone can trigger billing. Only the merchant receives funds." },
            { title: "Grace periods", desc: "Failed charges enter a grace window - not immediate cancellation." },
            { title: "Free trials", desc: "Trial periods advance the counter without transferring tokens." },
            { title: "$0.00001 per tx", desc: "Stellar makes micro-billing practical. 5-second finality." },
          ].map((feature) => (
            <div key={feature.title} className="bg-elevated p-6">
              <h3 className="text-sm font-semibold text-foreground mb-1.5">{feature.title}</h3>
              <p className="text-xs text-muted leading-relaxed">{feature.desc}</p>
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
              { role: "Merchants", desc: "Create billing plans, manage subscribers, automate recurring charges with the dashboard or SDK.", href: "/merchant" },
              { role: "Subscribers", desc: "View and manage all subscriptions across every merchant. Cancel anytime, directly on-chain.", href: "/subscriptions" },
              { role: "Developers", desc: "Install the SDK, integrate subscribe flows, run keeper bots. Everything is open source.", href: "/docs" },
            ].map((item) => (
              <Link key={item.role} href={item.href} className="group rounded-xl border border-border bg-elevated p-6 hover:border-accent/30 transition-colors">
                <h3 className="text-sm font-semibold text-foreground mb-2 group-hover:text-accent transition-colors">{item.role}</h3>
                <p className="text-xs text-muted leading-relaxed">{item.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-auto">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 text-muted hover:text-foreground transition-colors">
            <VowenaSymbol className="w-4 h-4 text-accent" />
            <span className="font-mono text-xs">vowena</span>
            <span className="text-xs ml-2">Trustless payments on Stellar</span>
          </Link>
          <div className="flex items-center gap-5">
            <Link href="/docs" className="text-muted hover:text-foreground transition-colors" title="Documentation">
              <BookIcon className="w-4 h-4" />
            </Link>
            <Link href="https://github.com/vowena" className="text-muted hover:text-foreground transition-colors" title="GitHub">
              <GitHubIcon className="w-4 h-4" />
            </Link>
            <Link href="https://x.com/vowena" className="text-muted hover:text-foreground transition-colors" title="X (Twitter)">
              <XIcon className="w-4 h-4" />
            </Link>
            <Link href="/blog" className="text-xs text-muted hover:text-foreground transition-colors">Blog</Link>
            <Link href="/pricing" className="text-xs text-muted hover:text-foreground transition-colors">Pricing</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
