import { useEffect, useState } from 'react';
import * as StellarSdk from '@stellar/stellar-sdk';
import { ArrowRight } from 'lucide-react';

export function ActivityFeed() {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    let intervalId: any;
    
    const fetchEvents = async () => {
      try {
        const rpcUrl = import.meta.env.VITE_SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org";
        const contractId = import.meta.env.VITE_PAYMENT_TRACKER_ID || "";
        const feeRegistryId = import.meta.env.VITE_FEE_REGISTRY_ID || "";
        const server = new StellarSdk.rpc.Server(rpcUrl);
        
        const latestLedgerResp = await server.getLatestLedger();
        const startLedger = latestLedgerResp.sequence - 100;
        
        const response = await server.getEvents({
          startLedger: startLedger,
          filters: [
            {
              type: "contract",
              contractIds: contractId ? [contractId] : undefined,
              topics: [
                 [StellarSdk.xdr.ScVal.scvSymbol("payment").toXDR("base64")]
              ]
            },
            {
              type: "contract",
              contractIds: feeRegistryId ? [feeRegistryId] : undefined,
              topics: [
                 [StellarSdk.xdr.ScVal.scvSymbol("fee").toXDR("base64")]
              ]
            }
          ],
          limit: 10
        });

        if (response.events) {
          const sorted = response.events.sort((a, b) => b.ledger - a.ledger);
          setEvents(sorted);
        }
      } catch (err) {
        console.error("Failed to fetch events", err);
      }
    };

    fetchEvents();
    intervalId = setInterval(fetchEvents, 5000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex flex-col gap-4 w-full">
      <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-300 mb-2 tracking-widest uppercase flex items-center gap-2">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
        </span>
        Live Feed
      </h2>

      {events.length === 0 ? (
        <p className="text-slate-500 text-sm italic">Waiting for events...</p>
      ) : (
        <div className="space-y-4">
          {events.map((ev, idx) => {
            let text = "Soroban Event";
            let amountVal = "";
            let color = "text-blue-400";

            try {
              const scVal = StellarSdk.xdr.ScVal.fromXDR(ev.value, "base64");
              
              if (scVal.switch() === StellarSdk.xdr.ScValType.scvI128()) {
                const feeVal = StellarSdk.scValToNative(scVal);
                amountVal = `${(Number(feeVal) / 10000000).toFixed(2)} XLM`;
                color = "text-purple-400";
                
                try {
                  const topic1 = StellarSdk.xdr.ScVal.fromXDR(ev.topic[1], "base64");
                  const senderAddr = StellarSdk.scValToNative(topic1);
                  text = `Fee Registry for ${senderAddr.slice(0, 4)}...${senderAddr.slice(-4)}`;
                } catch {
                  text = "Fee Registered";
                }
              } else if (scVal.switch() === StellarSdk.xdr.ScValType.scvVec()) {
                const nativeVec = StellarSdk.scValToNative(scVal);
                if (nativeVec.length === 4) {
                  const recipient = nativeVec[2];
                  const amount = Number(nativeVec[3]) / 10000000;
                  text = `Payment Sent to ${recipient.slice(0, 4)}...${recipient.slice(-4)}`;
                  amountVal = `+${amount.toFixed(2)} XLM`;
                  color = "text-emerald-400";
                } else if (nativeVec.length === 2) {
                  const id = nativeVec[0];
                  const newStatus = nativeVec[1];
                  text = `Tx #${id} status: ${newStatus}`;
                  color = newStatus === "success" ? "text-emerald-400" : newStatus === "failed" ? "text-rose-400" : "text-blue-400";
                }
              }
            } catch (e) {
              console.warn("Failed to parse event", e);
            }

            return (
              <div 
                key={idx} 
                className="backdrop-blur-md bg-white/[0.02] border border-white/5 p-4 rounded-2xl shadow-lg hover:-translate-y-1 transition-transform cursor-pointer"
              >
                <div className="flex justify-between items-center gap-6">
                  <div className="flex items-center gap-3">
                    <ArrowRight size={16} className={color} />
                    <span className="text-xs text-slate-300">{text}</span>
                  </div>
                  <span className={`text-xs font-bold ${color}`}>{amountVal}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

