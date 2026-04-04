/**
 * Keeper service.
 *
 * Iterates subscriptions that are due for billing and calls the
 * contract's charge function. In production the signer secret
 * would come from a secure vault.
 */

export interface ChargeResult {
  charged: number;
  failed: number;
  errors: string[];
}

export interface KeeperStatus {
  isRunning: boolean;
  lastRun: number | null;
  lastResult: ChargeResult | null;
}

export class KeeperService {
  private status: KeeperStatus = {
    isRunning: false,
    lastRun: null,
    lastResult: null,
  };

  /**
   * Find all subscriptions due for billing and attempt to charge them.
   */
  async chargeDue(
    contractId: string,
    rpcUrl: string,
    signerSecret: string,
  ): Promise<ChargeResult> {
    this.status.isRunning = true;

    try {
      // TODO: Implement actual billing logic
      // 1. Query contract for subscriptions where nextBillingTime <= now
      //    const server = new SorobanRpc.Server(rpcUrl);
      //    const keypair = Keypair.fromSecret(signerSecret);
      //
      // 2. For each due subscription, build and submit a charge transaction
      //    const client = new VowenaClient({ contractId, rpcUrl, networkPassphrase });
      //    for (const sub of dueSubscriptions) {
      //      try {
      //        await client.charge(sub.id, keypair);
      //        charged++;
      //      } catch (err) {
      //        failed++;
      //        errors.push(`Sub ${sub.id}: ${err.message}`);
      //      }
      //    }

      const result: ChargeResult = {
        charged: 0,
        failed: 0,
        errors: [],
      };

      this.status.lastRun = Date.now();
      this.status.lastResult = result;

      return result;
    } finally {
      this.status.isRunning = false;
    }
  }

  /**
   * Return the current keeper status.
   */
  getStatus(): KeeperStatus {
    return { ...this.status };
  }
}
