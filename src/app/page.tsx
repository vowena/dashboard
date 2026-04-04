"use client";

import Link from "next/link";
import { useWallet } from "@/components/wallet/wallet-provider";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { address, isConnected, connect } = useWallet();

  return (
    <div className="flex flex-col flex-1 items-center justify-center px-4">
      <main className="flex flex-col items-center gap-8 text-center max-w-2xl">
        <h1 className="text-5xl font-bold tracking-tight">
          Vowena
        </h1>
        <p className="text-xl text-zinc-400 max-w-lg">
          The first trustless recurring payment protocol on Stellar.
          Create subscription plans and authorize on-chain billing in USDC.
        </p>

        {isConnected ? (
          <div className="flex flex-col items-center gap-6">
            <p className="text-sm text-zinc-500">
              Connected: {address?.slice(0, 8)}...{address?.slice(-8)}
            </p>
            <div className="flex gap-4">
              <Link href="/merchant">
                <Button>Merchant Dashboard</Button>
              </Link>
              <Link href="/subscriptions">
                <Button variant="secondary">My Subscriptions</Button>
              </Link>
            </div>
          </div>
        ) : (
          <Button size="lg" onClick={connect}>
            Connect Wallet
          </Button>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8 w-full">
          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900">
            <h3 className="font-semibold mb-2">For Merchants</h3>
            <p className="text-sm text-zinc-400">
              Create billing plans, manage subscribers, and automate recurring charges.
            </p>
          </div>
          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900">
            <h3 className="font-semibold mb-2">For Subscribers</h3>
            <p className="text-sm text-zinc-400">
              Manage all your subscriptions in one place. Cancel anytime.
            </p>
          </div>
          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900">
            <h3 className="font-semibold mb-2">Trustless</h3>
            <p className="text-sm text-zinc-400">
              On-chain billing with price protection. No silent price changes.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
