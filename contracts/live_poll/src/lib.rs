#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Env, Map};

#[contracttype]
pub enum DataKey {
    Votes,
}

#[contract]
pub struct LivePollContract;

#[contractimpl]
impl LivePollContract {
    pub fn vote(env: Env, option: u32) {
        let mut votes: Map<u32, u32> = env
            .storage()
            .instance()
            .get(&DataKey::Votes)
            .unwrap_or(Map::new(&env));
        
        let current_votes = votes.get(option).unwrap_or(0);
        votes.set(option, current_votes + 1);
        
        env.storage().instance().set(&DataKey::Votes, &votes);
        env.storage().instance().extend_ttl(100, 100);
    }

    pub fn get_results(env: Env) -> Map<u32, u32> {
        env.storage()
            .instance()
            .get(&DataKey::Votes)
            .unwrap_or(Map::new(&env))
    }
}
