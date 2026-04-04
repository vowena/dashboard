"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import freighterApi from "@stellar/freighter-api";

interface WalletContextValue {
  address: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  signTransaction: (xdr: string, network?: string) => Promise<string>;
}

export const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);

  const isConnected = address !== null;

  const connect = useCallback(async () => {
    const accessResult = await freighterApi.requestAccess();
    if (accessResult.error) {
      throw new Error(
        `Freighter access denied: ${accessResult.error}`,
      );
    }

    const addressResult = await freighterApi.getAddress();
    if (addressResult.error) {
      throw new Error(
        `Failed to get public key: ${addressResult.error}`,
      );
    }

    setAddress(addressResult.address);
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
  }, []);

  const signTransaction = useCallback(
    async (xdr: string, opts?: { network?: string; networkPassphrase?: string; address?: string }) => {
      if (!isConnected) {
        throw new Error("Wallet not connected");
      }

      const result = await freighterApi.signTransaction(xdr, {
        networkPassphrase: opts?.networkPassphrase,
        address: opts?.address ?? address ?? undefined,
      });

      if (result.error) {
        throw new Error(
          `Transaction signing failed: ${result.error}`,
        );
      }

      return result.signedTxXdr;
    },
    [address, isConnected],
  );

  const value = useMemo<WalletContextValue>(
    () => ({
      address,
      isConnected,
      connect,
      disconnect,
      signTransaction: (xdr: string, network?: string) =>
        signTransaction(xdr, { network }),
    }),
    [address, isConnected, connect, disconnect, signTransaction],
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
