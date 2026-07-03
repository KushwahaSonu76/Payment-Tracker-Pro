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
