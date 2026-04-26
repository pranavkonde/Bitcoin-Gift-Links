# Bitcoin Gift Links on Rootstock

Simple dApp for gifting tRBTC using disposable wallets and shareable claim links.

## Problem Analysis

Traditional Bitcoin gifting assumes the recipient already has a wallet, which adds onboarding friction.  
This app removes that requirement by:

1. creating a fresh disposable wallet per gift,
2. funding it from the sender's wallet, and
3. sharing a claim link that lets the recipient sweep funds into their own wallet later.

## Scope Mapping

Implemented from your scope:

- Generate a disposable wallet for each gift.
- Send RBTC to the temporary wallet.
- Generate a shareable claim link.
- Allow recipient to claim to their own wallet.
- Frontend includes:
  - gift creation interface,
  - claim page,
  - wallet connection support through Wagmi connectors (MetaMask/injected; WalletConnect optional).
- Built for Rootstock testnet (chain ID `31`).

## Tech Stack

- React + TypeScript + Vite
- Wagmi + Viem
- TanStack React Query

## Quick Start

```bash
npm install
npm run dev
```

Open the local URL and use:

- `/` for landing page
- `/app` for gift creation flow
- `/claim#...` for claim flow

## Optional WalletConnect

Set a WalletConnect project ID to enable WalletConnect connector:

```bash
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
```

## Security Model Notes

- Claim secrets are stored in the URL fragment (`#...`) instead of query params to avoid server log leakage.
- A strict `Referrer-Policy: no-referrer` meta is configured in `index.html` as defense-in-depth.
- This project still uses an EOA claim model. If a claim secret leaks, funds can be front-run by another party.

## Production Guidance

For production-grade gifting, add:

- encrypted claim payloads (or server-issued one-time claim tokens),
- escrow smart contracts with commit-reveal or time-locked claim windows,
- server-side anti-abuse controls and monitoring.