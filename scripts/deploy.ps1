$ErrorActionPreference = "Stop"

Write-Host "Building contracts..."
cd contracts
cargo build --target wasm32-unknown-unknown --release

Write-Host "Deploying fee_registry..."
$FEE_REGISTRY_ID = stellar contract deploy `
    --wasm target/wasm32-unknown-unknown/release/fee_registry.wasm `
    --source default `
    --network testnet
Write-Host "Fee Registry deployed at: $FEE_REGISTRY_ID"

Write-Host "Deploying payment_tracker..."
$PAYMENT_TRACKER_ID = stellar contract deploy `
    --wasm target/wasm32-unknown-unknown/release/payment_tracker.wasm `
    --source default `
    --network testnet
Write-Host "Payment Tracker deployed at: $PAYMENT_TRACKER_ID"

Write-Host "Initializing payment_tracker with fee_registry address..."
stellar contract invoke `
    --id $PAYMENT_TRACKER_ID `
    --source default `
    --network testnet `
    -- init --fee_registry $FEE_REGISTRY_ID

Write-Host "Deployment complete."
Write-Host "FEE_REGISTRY_ID=$FEE_REGISTRY_ID"
Write-Host "PAYMENT_TRACKER_ID=$PAYMENT_TRACKER_ID"
