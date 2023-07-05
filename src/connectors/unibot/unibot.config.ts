import { Contract, Wallet } from 'ethers';
import { ConfigManagerV2 } from '../../services/config-manager-v2';
import { AvailableNetworks } from '../../services/config-manager-types';
import { Ethereum } from '../../chains/ethereum/ethereum';
import { Polygon } from '../../chains/polygon/polygon';
import unibotFactoryAbi from './unibot_factory_abi.json';
import unibotAggregator from './unibot_aggregator.json';
import unibotBalanceVault from './unibot_balance_vault.json';
import unibotHelperAbi from './unibot_helper_abi.json';

export namespace UnibotConfig {
  export interface ExchangeConfig {
    tradingTypes: Array<string>;
    availableNetworks: Array<AvailableNetworks>;
    contractAddress: (network: string, pair: string) => string;
    helperAddress: (network: string) => string;
    getFactory: (
      network: string,
      pair: string,
      chain: Ethereum | Polygon | Wallet
    ) => Contract;
    getBalanceVault: (
      network: string,
      chain: Ethereum | Polygon | Wallet
    ) => Contract;
    getAggregator: (
      network: string,
      chain: Ethereum | Polygon | Wallet
    ) => Contract;
    getHelper: (
      network: string,
      chain: Ethereum | Polygon | Wallet
    ) => Contract;
    getWantToken: (network: string, pair: string) => string;
    getBorrowToken: (network: string, pair: string) => string;
    getIsWant0: (network: string, pair: string) => boolean;
  }

  export const config: ExchangeConfig = {
    tradingTypes: ['EVM_AMM'],
    availableNetworks: [
      { chain: 'ethereum', networks: ['arbitrum', 'mumbai'] },
    ],
    contractAddress: (network: string, pair: string) =>
      ConfigManagerV2.getInstance().get(
        `unibot.contractAddresses.${network}.pairs.${pair}.factory`
      ),
    helperAddress: (network: string) =>
      ConfigManagerV2.getInstance().get(
        `unibot.contractAddresses.${network}.helper`
      ),
    getFactory: (
      network: string,
      pair: string,
      chain: Ethereum | Polygon | Wallet
    ) => {
      const qkey = `unibot.contractAddresses.${network}.pairs.${pair}.factory`;
      const factoryAddr = ConfigManagerV2.getInstance().get(qkey);
      return new Contract(factoryAddr, unibotFactoryAbi.abi, chain.provider);
    },
    getBalanceVault: (network: string, chain: Ethereum | Polygon | Wallet) => {
      const qkey = `unibot.contractAddresses.${network}.balanceVault`;
      const contractAddr = ConfigManagerV2.getInstance().get(qkey);
      // console.log(`contractAddr: ${contractAddr}`);
      return new Contract(contractAddr, unibotBalanceVault.abi, chain.provider);
    },
    getAggregator: (network: string, chain: Ethereum | Polygon | Wallet) => {
      const qkey = `unibot.contractAddresses.${network}.aggregator`;
      const contractAddr = ConfigManagerV2.getInstance().get(qkey);
      return new Contract(contractAddr, unibotAggregator.abi, chain.provider);
    },
    getHelper: (network: string, chain: Ethereum | Polygon | Wallet) => {
      const qkey = `unibot.contractAddresses.${network}.helper`;
      const helperAddr = ConfigManagerV2.getInstance().get(qkey);
      return new Contract(helperAddr, unibotHelperAbi.abi, chain.provider);
    },
    getWantToken: (network: string, pair: string) => {
      const ans: string = ConfigManagerV2.getInstance().get(
        `unibot.contractAddresses.${network}.pairs.${pair}.wantToken`
      );
      return ans;
    },
    getBorrowToken: (network: string, pair: string) => {
      const ans: string = ConfigManagerV2.getInstance().get(
        `unibot.contractAddresses.${network}.pairs.${pair}.borrowToken`
      );
      return ans;
    },
    getIsWant0: (network: string, pair: string) => {
      const ans: boolean = ConfigManagerV2.getInstance().get(
        `unibot.contractAddresses.${network}.pairs.${pair}.isWantToken0`
      );
      return ans;
    },
  };
}
