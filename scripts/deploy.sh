#!/bin/bash
set -e

echo "Building contracts..."
cd contracts
stellar contract build --optimize

echo "Deploying fee_registry..."
FEE_REGISTRY_ID=$(stellar contract deploy \
    --wasm target/wasm32v1-none/release/fee_registry.wasm \
    --source deployer \
    --network testnet)
echo "Fee Registry deployed at: $FEE_REGISTRY_ID"

echo "Deploying payment_tracker..."
PAYMENT_TRACKER_ID=$(stellar contract deploy \
    --wasm target/wasm32v1-none/release/payment_tracker.wasm \
    --source deployer \
    --network testnet)
echo "Payment Tracker deployed at: $PAYMENT_TRACKER_ID"

echo "Initializing payment_tracker with fee_registry address..."
stellar contract invoke \
    --id $PAYMENT_TRACKER_ID \
    --source deployer \
    --network testnet \
    -- init --fee_registry $FEE_REGISTRY_ID

echo "Deployment complete."
echo "FEE_REGISTRY_ID=$FEE_REGISTRY_ID"
echo "PAYMENT_TRACKER_ID=$PAYMENT_TRACKER_ID"
