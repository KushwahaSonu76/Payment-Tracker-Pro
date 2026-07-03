import * as StellarSdk from "@stellar/stellar-sdk";

export const rpcUrl = "https://soroban-testnet.stellar.org";
export const networkPassphrase = "Test SDF Network ; September 2015";
export const contractId = "CB3XOKM2GPZTXYDKKR7BDRCBEYP2B5N42IQNGL77XX66Y6FZWMJMBNX6";
export const server = new StellarSdk.rpc.Server(rpcUrl);

// Get the poll results from the contract
// fetchResults connects to the Soroban RPC and simulates a get_results transaction
export async function fetchResults(): Promise<Record<number, number>> {
  // 1. Initialize the Contract instance with the deployed contract ID
  const contract = new StellarSdk.Contract(contractId);
  
  // 2. Build a read-only transaction. We use a zero account (all Gs) since this is just for reading state (simulation)
  const tx = new StellarSdk.TransactionBuilder(
    new StellarSdk.Account("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF", "0"),
    { fee: "100", networkPassphrase }
  )
    // 3. Add the contract invocation operation calling the "get_results" function
    .addOperation(contract.call("get_results"))
    .setTimeout(30)
    .build();

  // 4. Simulate the transaction using the Soroban RPC server to get the return value
  const response = await server.simulateTransaction(tx);
  if (StellarSdk.rpc.Api.isSimulationError(response)) {
    throw new Error("Simulation error: " + response.error);
  }

  // 5. Parse the returned SCVal map into a JavaScript object
  if (response.result && response.result.retval) {
    const scval = response.result.retval;
    const map = scval.map();
    if (!map) return {};

    const results: Record<number, number> = {};
    for (const entry of map) {
      const key = entry.key().u32();
      const val = entry.val().u32();
      if (key !== undefined && val !== undefined) {
        results[key] = val;
      }
    }
    return results;
  }
  return {};
}

// Poll transaction status
export async function pollTransactionStatus(hash: string) {
  let attempts = 0;
  while (attempts < 20) {
    const response = await server.getTransaction(hash);
    if (response.status === StellarSdk.rpc.Api.GetTransactionStatus.SUCCESS) {
      return response;
    } else if (response.status === StellarSdk.rpc.Api.GetTransactionStatus.FAILED) {
      throw new Error(`Transaction failed: ${JSON.stringify(response.resultXdr)}`);
    }
    // NOT_FOUND means it is still pending
    attempts++;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error("Transaction polling timed out");
}
