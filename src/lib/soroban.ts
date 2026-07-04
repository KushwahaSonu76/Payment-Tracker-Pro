import * as StellarSdk from '@stellar/stellar-sdk';

export const contractId = import.meta.env.VITE_PAYMENT_TRACKER_ID || "";
export const rpcUrl = import.meta.env.VITE_SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org";
export const networkPassphrase = import.meta.env.VITE_STELLAR_NETWORK_PASSPHRASE || "Test SDF Network ; September 2015";

export const server = new StellarSdk.rpc.Server(rpcUrl);

// Generic function to simulate and prepare a transaction
export async function simulateTransaction(
  publicKey: string,
  methodName: string,
  args: StellarSdk.xdr.ScVal[] = []
): Promise<StellarSdk.Transaction> {
  const account = await server.getAccount(publicKey);
  
  const contract = new StellarSdk.Contract(contractId);
  const operation = contract.call(methodName, ...args);

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: "300000", // Increased to prevent transaction from getting stuck
    networkPassphrase,
  })
    .addOperation(operation)
    .setTimeout(30)
    .build();

  const simResponse = await server.simulateTransaction(tx);
  
  if (StellarSdk.rpc.Api.isSimulationError(simResponse)) {
    throw new Error(`Simulation failed: ${simResponse.error}`);
  }

  // Assemble the transaction using the simulation result
  const assembledTx = StellarSdk.rpc.assembleTransaction(tx, simResponse);
  return assembledTx.build();
}

// Check transaction status
export async function pollTransactionStatus(hash: string): Promise<StellarSdk.rpc.Api.GetTransactionResponse> {
  let statusResp: StellarSdk.rpc.Api.GetTransactionResponse;
  do {
    await new Promise(resolve => setTimeout(resolve, 2000));
    statusResp = await server.getTransaction(hash);
  } while (statusResp.status === StellarSdk.rpc.Api.GetTransactionStatus.NOT_FOUND);
  
  return statusResp;
}

export async function getAllPayments(sender: string) {
  const contract = new StellarSdk.Contract(contractId);
  const operation = contract.call("get_all_payments", new StellarSdk.Address(sender).toScVal());

  const account = new StellarSdk.Account("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF", "0");
  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: "100",
    networkPassphrase,
  })
    .addOperation(operation)
    .setTimeout(30)
    .build();

  const simResponse = await server.simulateTransaction(tx);
  if (StellarSdk.rpc.Api.isSimulationError(simResponse) || !simResponse.result) {
    return [];
  }

  const resultVal = simResponse.result.retval;
  if (resultVal.switch() !== StellarSdk.xdr.ScValType.scvVec()) {
    return [];
  }

  const vec = resultVal.vec();
  if (!vec) return [];

  return vec.map((item) => {
    // Structure: sender, recipient, amount, status, timestamp
    const map = item.map();
    if (!map) return null;
    
    // We can extract map fields based on standard rust struct layout
    // But Soroban maps rust structs to ordered map arrays based on field names
    let record: any = {};
    for (const entry of map) {
      const key = entry.key().sym().toString();
      const val = entry.val();
      
      if (key === 'sender') record.sender = StellarSdk.scValToNative(val);
      if (key === 'recipient') record.recipient = StellarSdk.scValToNative(val);
      if (key === 'amount') record.amount = StellarSdk.scValToNative(val).toString();
      if (key === 'status') record.status = StellarSdk.scValToNative(val);
      if (key === 'timestamp') record.timestamp = Number(StellarSdk.scValToNative(val));
    }
    return record;
  }).filter(Boolean);
}
