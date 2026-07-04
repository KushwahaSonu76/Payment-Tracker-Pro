#![cfg(test)]

extern crate std;

use crate::{PaymentTrackerContract, PaymentTrackerContractClient};
use soroban_sdk::{testutils::{Address as _, Events}, symbol_short, Address, Env, IntoVal};
use fee_registry::{FeeRegistryContract, FeeRegistryContractClient};

#[test]
fn test_record_and_update_payment() {
    let env = Env::default();
    env.mock_all_auths();

    // Register fee_registry
    let fee_registry_id = env.register(FeeRegistryContract, ());
    let fee_client = FeeRegistryContractClient::new(&env, &fee_registry_id);

    // Register payment_tracker
    let contract_id = env.register(PaymentTrackerContract, ());
    let client = PaymentTrackerContractClient::new(&env, &contract_id);

    // Init payment_tracker with fee_registry address
    client.init(&fee_registry_id);

    let sender = Address::generate(&env);
    let recipient = Address::generate(&env);

    let payment_id = client.record_payment(&sender, &recipient, &1000);
    assert_eq!(payment_id, 1);

    let record = client.get_payment(&payment_id);
    assert_eq!(record.status, symbol_short!("pending"));
    assert_eq!(record.amount, 1000);

    // update status
    client.update_status(&payment_id, &symbol_short!("success"));
    
    let record = client.get_payment(&payment_id);
    assert_eq!(record.status, symbol_short!("success"));

    // verify fee was logged in fee_registry
    let current_fee = fee_client.get_fee(&sender);
    assert_eq!(current_fee, 10); // 1% of 1000
}
