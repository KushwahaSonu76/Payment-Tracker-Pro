#!/bin/bash
set -e

echo "Building contracts..."
cd contracts
cargo build --target wasm32-unknown-unknown --release

echo "Deploying fee_registry..."
FEE_REGISTRY_ID=$(stellar contract deploy \
    --wasm target/wasm32-unknown-unknown/release/fee_registry.wasm \
    --source default \
    --network testnet)
echo "Fee Registry deployed at: $FEE_REGISTRY_ID"

echo "Deploying payment_tracker..."
PAYMENT_TRACKER_ID=$(stellar contract deploy \
    --wasm target/wasm32-unknown-unknown/release/payment_tracker.wasm \
    --source default \
    --network testnet)
echo "Payment Tracker deployed at: $PAYMENT_TRACKER_ID"

echo "Initializing payment_tracker with fee_registry address..."
stellar contract invoke \
    --id $PAYMENT_TRACKER_ID \
    --source default \
    --network testnet \
    -- init --fee_registry $FEE_REGISTRY_ID

echo "Deployment complete."
echo "FEE_REGISTRY_ID=$FEE_REGISTRY_ID"
echo "PAYMENT_TRACKER_ID=$PAYMENT_TRACKER_ID"
