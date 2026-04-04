/**
 * Event indexer service.
 *
 * Polls Soroban RPC getEvents and stores results for querying.
 * In production this would persist to a database; for now it
 * keeps an in-memory store.
 */

export interface IndexedEvent {
  id: string;
  type: string;
  ledger: number;
  timestamp: number;
  contractId: string;
  merchant?: string;
  subscriber?: string;
  planId?: number;
  data: unknown;
}

export interface EventFilters {
  merchant?: string;
  subscriber?: string;
  planId?: number;
  type?: string;
  limit?: number;
  cursor?: string;
}

export class EventIndexer {
  private events: IndexedEvent[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private lastLedger = 0;
  private contractId = "";
  private rpcUrl = "";

  /**
   * Start polling for events from the given contract.
   */
  async start(contractId: string, rpcUrl: string): Promise<void> {
    this.contractId = contractId;
    this.rpcUrl = rpcUrl;

    // TODO: Initialize Soroban RPC server connection
    // const server = new SorobanRpc.Server(rpcUrl);
    // const health = await server.getHealth();
    // this.lastLedger = health.latestLedger;

    const poll = async () => {
      try {
        // TODO: Fetch events from Soroban RPC
        // const { events, latestLedger } = await getEvents(
        //   this.rpcUrl,
        //   this.contractId,
        //   this.lastLedger,
        // );
        //
        // for (const event of events) {
        //   this.events.push({
        //     id: `${event.ledger}-${this.events.length}`,
        //     type: event.type,
        //     ledger: event.ledger,
        //     timestamp: event.timestamp,
        //     contractId: event.contractId,
        //     data: event.data,
        //   });
        // }
        //
        // if (latestLedger > this.lastLedger) {
        //   this.lastLedger = latestLedger;
        // }
        void 0;
      } catch {
        // Silently retry on next poll
      }
    };

    await poll();
    this.timer = setInterval(poll, 5000);
  }

  /**
   * Stop the event poller.
   */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Query indexed events with optional filters.
   */
  getEvents(filters: EventFilters): IndexedEvent[] {
    let result = [...this.events];

    if (filters.merchant) {
      result = result.filter((e) => e.merchant === filters.merchant);
    }
    if (filters.subscriber) {
      result = result.filter((e) => e.subscriber === filters.subscriber);
    }
    if (filters.planId !== undefined) {
      result = result.filter((e) => e.planId === filters.planId);
    }
    if (filters.type) {
      result = result.filter((e) => e.type === filters.type);
    }

    // Cursor-based pagination: skip events up to and including the cursor id
    if (filters.cursor) {
      const cursorIndex = result.findIndex((e) => e.id === filters.cursor);
      if (cursorIndex >= 0) {
        result = result.slice(cursorIndex + 1);
      }
    }

    const limit = filters.limit ?? 50;
    return result.slice(0, limit);
  }

  /**
   * Return the last indexed ledger sequence number.
   */
  getLatestLedger(): number {
    return this.lastLedger;
  }
}
