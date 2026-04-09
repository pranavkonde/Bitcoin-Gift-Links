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
- Wagmi + Viem (wallet/network config)
- Ethers v6 (transaction execution and wallet handling)

## Quick Start

```bash
npm install
npm run dev
```

Open the local URL and use:

- `/` for gift creation
- `/claim?...` for claim flow

## Optional WalletConnect

Set a WalletConnect project ID to enable WalletConnect connector:

```bash
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
```