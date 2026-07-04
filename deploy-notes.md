# Deployment Notes for Level 3 Orange Belt

## Deployment Scripts

To deploy the contracts to the Stellar Testnet, use the provided scripts in the `scripts/` folder.

If you are using Windows PowerShell:
```powershell
./scripts/deploy.ps1
```

If you are using Bash/Linux/macOS:
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### Script Workflow
The script performs the following actions:
1. Builds both `fee_registry` and `payment_tracker` contracts to Wasm using `cargo build`.
2. Deploys `fee_registry` to the Stellar Testnet and captures its real Contract ID.
3. Deploys `payment_tracker` to the Stellar Testnet and captures its real Contract ID.
4. Invokes the `init` function on `payment_tracker`, passing the deployed `fee_registry` ID as a parameter to enable cross-contract communication.

### Real Testnet Deployment Results

**Fee Registry Contract:**
- **Contract ID:** `CD3IBT3WEPHV6HJMYMFDY7REOMIDNB4JKH7WTPGWAS2KEJOSQK75GH2M`
- **Deployment Tx Hash:** `620f9fe8812f8c83a0e58f9cc781fd01cd27125be7a7959e5cac6292119dad3d`

**Payment Tracker Contract:**
- **Contract ID:** `CA2KU2NE3LQHXUOUOLQZRVSE6ZY7RGHD526KBY4UABUSCLEKGA2MMSLC`
- **Deployment Tx Hash:** `1f46b3ca79aa74d7780a77458317578b37e01bd04647f5f4577bae5dfca336d1`

**Init Transaction (Binding the contracts together):**
- **Tx Hash:** `13635ae37771edd13e86810b564e48c3a40c75b35876704093c84146860a65bb`

You can verify these on [stellar.expert](https://stellar.expert/explorer/testnet).

## Frontend Testing
You can run the frontend tests using:
```bash
npm test
```
This will run the Vitest suite, ensuring components like `ErrorBanner` render correctly.

## Frontend Live Deployment
To deploy the frontend live on Vercel or Netlify:
1. Push your changes to GitHub (preferably `main` branch).
2. Create a new project in Vercel/Netlify.
3. Set the build command to `npm run build` and output directory to `dist`.
4. Ensure you set up `.env` or environment variables in Vercel for the contract IDs (e.g. `VITE_PAYMENT_TRACKER_ID` once you integrate dynamic loading from env variables). Currently, the app connects directly to the soroban RPC for testing.
