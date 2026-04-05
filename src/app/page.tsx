"use client";

import Link from "next/link";
import { useWallet } from "@/components/wallet/wallet-provider";
import { Button } from "@/components/ui/button";
import { VowenaLogo } from "@/components/vowena-logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AppHome() {
  const { address, isConnected, connect } = useWallet();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6">
      <div className="flex flex-col items-center text-center max-w-md">
        <Link href="https://vowena.xyz">
          <VowenaLogo size="lg" />
        </Link>

        <p className="mt-6 text-sm text-muted">
          Connect your Stellar wallet to access the dashboard.
        </p>

        <div className="mt-8">
          {isConnected ? (
            <div className="flex flex-col items-center gap-4">
              <p className="text-xs text-muted font-mono">
                {address?.slice(0, 8)}...{address?.slice(-8)}
              </p>
              <Link href="/merchant">
                <Button size="lg">Open dashboard</Button>
              </Link>
            </div>
          ) : (
            <Button size="lg" onClick={connect}>Connect wallet</Button>
          )}
        </div>

        <div className="mt-12 flex items-center gap-4 text-xs text-muted">
          <Link href="https://vowena.xyz" className="hover:text-foreground transition-colors">Home</Link>
          <Link href="https://vowena.xyz/docs" className="hover:text-foreground transition-colors">Docs</Link>
          <Link href="https://vowena.xyz/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
