#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol, Vec, IntoVal};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PaymentRecord {
    pub sender: Address,
    pub recipient: Address,
    pub amount: i128,
    pub status: Symbol,
    pub timestamp: u64,
}

#[contracttype]
pub enum DataKey {
    FeeRegistry,
    PaymentCounter,
    Payment(u32),
    UserPayments(Address),
}

#[contract]
pub struct PaymentTrackerContract;

#[contractimpl]
impl PaymentTrackerContract {
    /// Initialize with fee_registry address
    pub fn init(env: Env, fee_registry: Address) {
        env.storage().instance().set(&DataKey::FeeRegistry, &fee_registry);
    }

    /// Records a new payment in "pending" status and returns the payment ID.
    pub fn record_payment(env: Env, sender: Address, recipient: Address, amount: i128) -> u32 {
        sender.require_auth();

        let mut counter: u32 = env.storage().instance().get(&DataKey::PaymentCounter).unwrap_or(0);
        counter += 1;

        let record = PaymentRecord {
            sender: sender.clone(),
            recipient: recipient.clone(),
            amount,
            status: symbol_short!("pending"),
            timestamp: env.ledger().timestamp(),
        };

        env.storage().persistent().set(&DataKey::Payment(counter), &record);
        env.storage().instance().set(&DataKey::PaymentCounter, &counter);

        let mut user_payments: Vec<u32> = env
            .storage()
            .persistent()
            .get(&DataKey::UserPayments(sender.clone()))
            .unwrap_or(Vec::new(&env));
            
        user_payments.push_back(counter);
        env.storage().persistent().set(&DataKey::UserPayments(sender.clone()), &user_payments);

        env.events().publish((symbol_short!("payment"), symbol_short!("recorded")), (counter, sender, recipient, amount));

        counter
    }

    /// Updates the status of an existing payment (e.g. "success", "failed").
    pub fn update_status(env: Env, payment_id: u32, new_status: Symbol) {
        let mut record: PaymentRecord = env
            .storage()
            .persistent()
            .get(&DataKey::Payment(payment_id))
            .unwrap_or_else(|| panic!("Payment not found"));
            
        // Require authorization from the sender of the payment to update its status
        record.sender.require_auth();

        record.status = new_status.clone();
        env.storage().persistent().set(&DataKey::Payment(payment_id), &record);
        
        env.events().publish((symbol_short!("payment"), symbol_short!("status")), (payment_id, new_status.clone()));

        if new_status == symbol_short!("success") {
            if let Some(fee_registry) = env.storage().instance().get::<_, Address>(&DataKey::FeeRegistry) {
                let mut args = Vec::new(&env);
                args.push_back(record.sender.into_val(&env));
                args.push_back(record.amount.into_val(&env));
                let _fee: i128 = env.invoke_contract(&fee_registry, &symbol_short!("log_fee"), args);
            }
        }
    }

    /// Retrieves a specific payment record by ID.
    pub fn get_payment(env: Env, payment_id: u32) -> PaymentRecord {
        env.storage()
            .persistent()
            .get(&DataKey::Payment(payment_id))
            .unwrap_or_else(|| panic!("Payment not found"))
    }

    /// Retrieves all payment records initiated by a specific sender.
    pub fn get_all_payments(env: Env, sender: Address) -> Vec<PaymentRecord> {
        let payment_ids: Vec<u32> = env
            .storage()
            .persistent()
            .get(&DataKey::UserPayments(sender))
            .unwrap_or(Vec::new(&env));

        let mut records = Vec::new(&env);
        for id in payment_ids.iter() {
            if let Some(record) = env.storage().persistent().get(&DataKey::Payment(id)) {
                records.push_back(record);
            }
        }

        records
    }
}

#[cfg(test)]
mod test;
