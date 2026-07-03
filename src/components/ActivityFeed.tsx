import { useEffect, useState } from 'react';
import * as StellarSdk from '@stellar/stellar-sdk';

export function ActivityFeed() {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    let intervalId: any;
    
    const fetchEvents = async () => {
      try {
        const rpcUrl = import.meta.env.VITE_SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org";
        const contractId = import.meta.env.VITE_PAYMENT_TRACKER_ID || "";
        const server = new StellarSdk.rpc.Server(rpcUrl);
        // We will query events using the getEvents method
        
        // We need a startLedger. We will fetch the latest ledger minus 100 for recent events
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
            }
          ],
          limit: 10
        });

        if (response.events) {
          setEvents(response.events.reverse());
        }
      } catch (err) {
        console.error("Failed to fetch events", err);
      }
    };

    fetchEvents();
    intervalId = setInterval(fetchEvents, 5000); // poll every 5 seconds

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="mt-8 bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl p-6 shadow-xl w-full">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
        </span>
        Live Activity Feed
      </h3>
      {events.length === 0 ? (
        <p className="text-gray-400 text-sm italic">Waiting for events...</p>
      ) : (
        <div className="space-y-3">
          {events.map((ev, idx) => {
            // Very simplistic rendering of event data
            let action = "Unknown";
            try {
               const topic1 = StellarSdk.xdr.ScVal.fromXDR(ev.topic[1], "base64");
               if (topic1.switch() === StellarSdk.xdr.ScValType.scvSymbol()) {
                  action = topic1.sym().toString();
               }
            } catch (e) {}

            return (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-800/40 rounded-xl text-sm border border-gray-700/50">
                <div>
                  <span className="font-semibold text-indigo-400 uppercase text-xs mr-2">{action}</span>
                  <span className="text-gray-300">Contract Event</span>
                </div>
                <div className="text-gray-500 text-xs mt-1 sm:mt-0">Ledger {ev.ledger}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
