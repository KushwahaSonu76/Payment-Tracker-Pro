#![cfg(test)]

use crate::{FeeRegistryContract, FeeRegistryContractClient};
use soroban_sdk::{testutils::Address as _, Address, Env};

#[test]
fn test_log_fee() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, FeeRegistryContract);
    let client = FeeRegistryContractClient::new(&env, &contract_id);

    let payer = Address::generate(&env);

    let current_fee = client.log_fee(&payer, &1000);
    assert_eq!(current_fee, 10);

    let current_fee = client.log_fee(&payer, &500);
    assert_eq!(current_fee, 15);

    assert_eq!(client.get_fee(&payer), 15);
}
