# Stellar Live Poll dApp

A fully functional, real-time Live Poll dApp built on the **Stellar Testnet** using Soroban Smart Contracts.

## Tech Stack
- **Frontend:** React, Vite, TypeScript, Tailwind CSS
- **Smart Contracts:** Rust (Soroban SDK)
- **Stellar Integration:** `@stellar/stellar-sdk` and `@creit.tech/stellar-wallets-kit`

## Features
- Connect with Freighter, xBull, and Albedo wallets.
- Real-time vote updates from the Soroban contract.
- Interactive transaction status updates (Simulating -> Signing -> Submitting -> Pending -> Success).
- Complete error mapping for wallet rejection, missing wallets, and simulation errors.

## Deployed Contract
- **Contract ID:** `CB3XOKM2GPZTXYDKKR7BDRCBEYP2B5N42IQNGL77XX66Y6FZWMJMBNX6`
- **Network:** Stellar Testnet

## How to Run
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
