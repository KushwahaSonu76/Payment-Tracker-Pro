#![cfg(test)]

use crate::{PaymentTrackerContract, PaymentTrackerContractClient};
use soroban_sdk::{testutils::{Address as _, Events}, symbol_short, Address, Env, IntoVal};

// Mock fee registry contract for testing
mod fee_registry {
    soroban_sdk::contractimport!(file = "../fee_registry/target/wasm32-unknown-unknown/release/fee_registry.wasm");
}

#[test]
fn test_record_and_update_payment() {
    let env = Env::default();
    env.mock_all_auths();

    // We can use a mock contract for testing the fee registry behavior if we compile it first,
    // or we can test using a dummy contract here. Let's use a dummy.
    
    // Instead of using WASM, we'll just test the core functionality of payment_tracker.
    let contract_id = env.register_contract(None, PaymentTrackerContract);
    let client = PaymentTrackerContractClient::new(&env, &contract_id);

    let sender = Address::generate(&env);
    let recipient = Address::generate(&env);

    let payment_id = client.record_payment(&sender, &recipient, &1000);
    assert_eq!(payment_id, 1);

    let record = client.get_payment(&payment_id);
    assert_eq!(record.status, symbol_short!("pending"));
    assert_eq!(record.amount, 1000);

    // Let's test event emission
    let events = env.events().all();
    assert!(events.len() > 0);
    
    // update status
    // since we don't have fee_registry set up with init in this test, update_status with "success" might fail or do nothing
    // if DataKey::FeeRegistry is missing, it skips the fee_registry invoke because of `if let Some(fee_registry) = ...`
    client.update_status(&payment_id, &symbol_short!("success"));
    
    let record = client.get_payment(&payment_id);
    assert_eq!(record.status, symbol_short!("success"));
}
