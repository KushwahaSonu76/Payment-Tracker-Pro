$ErrorActionPreference = "Stop"

Write-Host "Building contracts..."
cd contracts
stellar contract build --optimize

Write-Host "Deploying fee_registry..."
$FEE_REGISTRY_ID = stellar contract deploy `
    --wasm target/wasm32v1-none/release/fee_registry.wasm `
    --source deployer `
    --network testnet
Write-Host "Fee Registry deployed at: $FEE_REGISTRY_ID"

Write-Host "Deploying payment_tracker..."
$PAYMENT_TRACKER_ID = stellar contract deploy `
    --wasm target/wasm32v1-none/release/payment_tracker.wasm `
    --source deployer `
    --network testnet
Write-Host "Payment Tracker deployed at: $PAYMENT_TRACKER_ID"

Write-Host "Initializing payment_tracker with fee_registry address..."
stellar contract invoke `
    --id $PAYMENT_TRACKER_ID `
    --source deployer `
    --network testnet `
    -- init --fee_registry $FEE_REGISTRY_ID

Write-Host "Deployment complete."
Write-Host "FEE_REGISTRY_ID=$FEE_REGISTRY_ID"
Write-Host "PAYMENT_TRACKER_ID=$PAYMENT_TRACKER_ID"
