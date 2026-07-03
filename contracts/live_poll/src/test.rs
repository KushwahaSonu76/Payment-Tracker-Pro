
#![cfg(test)]
use super::*;
use soroban_sdk::Env;

#[test]
fn test_voting_increments() {
    let env = Env::default();
    let contract_id = env.register_contract(None, LivePollContract);
    let client = LivePollContractClient::new(&env, &contract_id);

    client.vote(&1);
    client.vote(&1);
    client.vote(&2);

    let results = client.get_results();
    assert_eq!(results.get(1).unwrap(), 2);
    assert_eq!(results.get(2).unwrap(), 1);
    assert_eq!(results.get(3).unwrap_or(0), 0);
}
