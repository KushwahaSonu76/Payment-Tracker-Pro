#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol};

#[contracttype]
pub enum DataKey {
    FeeAcc(Address),
}

#[contract]
pub struct FeeRegistryContract;

#[contractimpl]
impl FeeRegistryContract {
    pub fn log_fee(env: Env, payer: Address, amount: i128) -> i128 {
        payer.require_auth();

        let fee: i128 = amount / 100; // 1% fee

        let mut current_fee = env
            .storage()
            .persistent()
            .get(&DataKey::FeeAcc(payer.clone()))
            .unwrap_or(0);

        current_fee += fee;

        env.storage()
            .persistent()
            .set(&DataKey::FeeAcc(payer.clone()), &current_fee);

        env.events()
            .publish((symbol_short!("fee"), payer.clone()), current_fee);

        current_fee
    }

    pub fn get_fee(env: Env, payer: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::FeeAcc(payer))
            .unwrap_or(0)
    }
}

#[cfg(test)]
mod test;
