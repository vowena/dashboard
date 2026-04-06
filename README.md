# Vowena Dashboard

Merchant and subscriber dashboard for the Vowena recurring payments protocol on Stellar.

[![License](https://img.shields.io/badge/license-BSL%201.1-orange.svg)](LICENSE)
[![CI](https://github.com/vowena/dashboard/actions/workflows/ci.yml/badge.svg)](https://github.com/vowena/dashboard/actions/workflows/ci.yml)
[![Next.js](https://img.shields.io/badge/Next.js-16.2-black.svg)](https://nextjs.org)

## What is this?

This repository contains the operational dashboard for Vowena. It is the app merchants and subscribers use to inspect plans, review subscriptions, connect wallets, and manage billing activity around the protocol.

## Features

- Merchant and subscriber views built with the Next.js App Router
- Stellar wallet integration through Freighter
- React Query-powered data fetching for plans, subscriptions, and events
- Postgres access through Drizzle ORM
- Keeper and cron integration for billing automation

## Tech stack

Next.js 16, React 19, TypeScript, Tailwind CSS 4, React Query, Drizzle ORM, PostgreSQL, Freighter API, Stellar SDK

## Getting started

### Prerequisites

- Node.js 22 or later
- npm 10 or later
- PostgreSQL

### Setup

```bash
git clone https://github.com/vowena/dashboard.git
cd dashboard
npm install
cp .env.example .env.local
npm run dev
```

The local app runs at [http://localhost:3000](http://localhost:3000).

### Environment variables

Copy `.env.example` to `.env.local` and provide values for:

- `DATABASE_URL` for the dashboard database
- `NEXT_PUBLIC_CONTRACT_ID` for the deployed Vowena contract
- `NEXT_PUBLIC_RPC_URL` and `NEXT_PUBLIC_NETWORK_PASSPHRASE` for the target Stellar network
- `NEXT_PUBLIC_USDC_ADDRESS` for the configured token contract
- `KEEPER_SECRET` and `CRON_SECRET` for background billing flows
- `NEXT_PUBLIC_APP_URL` for the public app origin

## Quality checks

Run these before opening a pull request:

```bash
npm run lint
npm run typecheck
npm run build
```

## Related repositories

| Repository | Description |
|---|---|
| [protocol](https://github.com/vowena/protocol) | Soroban smart contracts |
| [sdk](https://github.com/vowena/sdk) | TypeScript SDK |
| [site](https://github.com/vowena/site) | Marketing site |
| [docs](https://docs.vowena.xyz) | Product and API documentation |

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for setup, workflow, testing, and review expectations.

## Security

Do not report security issues in public issues. Use [SECURITY.md](SECURITY.md) instead.

## License

This repository is licensed under the [Business Source License 1.1](LICENSE). The change license is Apache 2.0 on the date specified in the license file.
