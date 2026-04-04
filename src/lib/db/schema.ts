import {
  pgTable,
  serial,
  text,
  integer,
  bigint,
  timestamp,
  jsonb,
  index,
  boolean,
} from "drizzle-orm/pg-core";

export const planMetadata = pgTable("plan_metadata", {
  id: serial("id").primaryKey(),
  planId: bigint("plan_id", { mode: "number" }).notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  merchantName: text("merchant_name"),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const indexedEvents = pgTable(
  "indexed_events",
  {
    id: serial("id").primaryKey(),
    ledger: integer("ledger").notNull(),
    eventType: text("event_type").notNull(),
    contractId: text("contract_id").notNull(),
    merchantAddress: text("merchant_address"),
    subscriberAddress: text("subscriber_address"),
    planId: bigint("plan_id", { mode: "number" }),
    subId: bigint("sub_id", { mode: "number" }),
    amount: bigint("amount", { mode: "bigint" }),
    data: jsonb("data"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_events_merchant").on(table.merchantAddress),
    index("idx_events_subscriber").on(table.subscriberAddress),
    index("idx_events_plan").on(table.planId),
    index("idx_events_type").on(table.eventType),
    index("idx_events_ledger").on(table.ledger),
  ]
);

export const keeperConfig = pgTable("keeper_config", {
  id: serial("id").primaryKey(),
  merchantAddress: text("merchant_address").notNull().unique(),
  enabled: boolean("enabled").notNull().default(false),
  lastRunAt: timestamp("last_run_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const syncCursor = pgTable("sync_cursor", {
  id: serial("id").primaryKey(),
  contractId: text("contract_id").notNull().unique(),
  lastLedger: integer("last_ledger").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
