import { StellarWalletsKit, Networks } from '@creit.tech/stellar-wallets-kit';
import { FreighterModule } from '@creit.tech/stellar-wallets-kit/modules/freighter';
import { xBullModule } from '@creit.tech/stellar-wallets-kit/modules/xbull';
import { AlbedoModule } from '@creit.tech/stellar-wallets-kit/modules/albedo';

StellarWalletsKit.init({
  network: Networks.TESTNET,
  selectedWalletId: 'freighter',
  modules: [
    new FreighterModule(),
    new xBullModule(),
    new AlbedoModule(),
  ]
});

export const kit = StellarWalletsKit;
