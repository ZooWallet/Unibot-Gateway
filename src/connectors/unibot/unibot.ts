// Unibotish
import {
  BigNumber,
  Contract,
  Transaction,
  ContractTransaction,
  Wallet,
} from 'ethers';
import unibotFactoryAbi from './unibot_factory_abi.json';
import unibotHelperAbi from './unibot_helper_abi.json';
import { UnibotConfig } from './unibot.config';
import { Ethereum } from '../../chains/ethereum/ethereum';
import { Polygon } from '../../chains/polygon/polygon';
import { Unibotish } from '../../services/common-interfaces';
import { tickToPrice } from '@uniswap/v3-sdk';
import { Token } from '@uniswap/sdk-core';
import erc20 from './erc20.json';
import {
  HttpException,
  LOAD_WALLET_ERROR_CODE,
  LOAD_WALLET_ERROR_MESSAGE,
} from '../../services/error-handler';
import { logger } from '../../services/logger';

export interface UnibotPosition {
  positionId: string;
  owner: string;
  borrowId: string;
  wantTokenAmountAtStart: string;
  reserveAmountAtStart: string;
  positionCreateTimestamp: string;
  startPriceTick: string;
  borrowRatio: string;
  reserveAmount: string;
  stopLossUpperPriceTick: string;
  stopLossLowerPriceTick: string;
}

export class Unibot implements Unibotish {
  private static _instances: { [name: string]: Unibot };
  private chain: Ethereum | Polygon;
  private _network: string;
  private _address: string = '';
  private _ready: boolean = false;
  private _config: UnibotConfig.ExchangeConfig;
  public gasLimit = 16000000; // Default from perpfi https://github.com/perpetual-protocol/sdk-curie/blob/6211010ce6ddeb24312085775fc7e64336e426da/src/transactionSender/index.ts#L44
  public abiDecoder: any = require('abi-decoder');

  private constructor(chain: string, network: string, address?: string) {
    if (chain === 'ethereum') {
      this.chain = Ethereum.getInstance(network);
    } else {
      this.chain = Polygon.getInstance(network);
    }
    console.log(`network: ${network}, chain: ${chain}`);
    this._network = network;
    this.abiDecoder.addABI(unibotFactoryAbi.abi);
    this.abiDecoder.addABI(unibotHelperAbi.abi);

    if (address) {
      this._address = address;
    }
    this._config = UnibotConfig.config;
  }

  public static getInstance(chain: string, network: string): Unibot {
    if (Unibot._instances === undefined) {
      Unibot._instances = {};
    }

    if (!(chain + network in Unibot._instances)) {
      Unibot._instances[chain + network] = new Unibot(chain, network);
    }

    return Unibot._instances[chain + network];
  }

  public async init() {
    if (!this.chain.ready()) {
      await this.chain.init();
    }
    // console.log(`chain ready: ${this.chain.ready()}`);
    this._ready = true;

    if (this._address !== '') {
      try {
        // this._wallet = await this.chain.getWallet(this._address);
      } catch (err) {
        logger.error(`Wallet ${this._address} not available.`);
        throw new HttpException(
          500,
          LOAD_WALLET_ERROR_MESSAGE + err,
          LOAD_WALLET_ERROR_CODE
        );
      }
    }
  }

  public ready(): boolean {
    return this._ready;
  }

  public async getWallet(address: string): Promise<Wallet> {
    return await this.chain.getWallet(address);
  }

  public async getLatestPrice(pair: string): Promise<number> {
    const factoryContract: Contract = this._config.getFactory(
      this._network,
      pair,
      this.chain
    );
    const consultPrice = await factoryContract.callStatic.getLatestPrice();
    // console.log(`consultPrice: ${consultPrice}`);
    return consultPrice;
  }

  public async PriceToTick(pair: string, tick: number): Promise<any> {
    const factoryContract: Contract = this._config.getFactory(
      this._network,
      pair,
      this.chain
    );
    let token0 = await factoryContract.wantToken();
    let token1 = await factoryContract.borrowToken();
    if (!(await factoryContract.wantTokenIsToken0())) {
      const tmp = token0;
      token0 = token1;
      token1 = tmp;
    }
    console.log(`tick: ${tick}`);

    const token0C = new Contract(token0, erc20.abi, this.chain.provider);
    const token1C = new Contract(token0, erc20.abi, this.chain.provider);

    token0 = new Token(1, token0, await token0C.decimals());
    token1 = new Token(1, token1, await token1C.decimals());

    const tPrice = tickToPrice(token0, token1, Number(tick));
    console.log(`tPrice: ${tPrice.numerator}`);
    return tPrice;
  }

  public async getPositions(
    pair: string,
    walletAddress: string,
    positionIndex: bigint
  ): Promise<any> {
    const factoryContract: Contract = this._config.getFactory(
      this._network,
      pair,
      this.chain
    );
    const positionIdRaw = await factoryContract.userPositionIds(
      walletAddress,
      positionIndex
    );
    return positionIdRaw;
  }

  async getOpenPositions(wallet: Wallet, pair: string): Promise<any> {
    const factoryContract: Contract = this._config.getFactory(
      this._network,
      pair,
      this.chain
    );
    const positionIds: any = [];
    try {
      for (let i = 0; i <= 5; i++) {
        const positionId = await factoryContract.userPositionIds(
          wallet.address,
          i
        );
        positionIds.push(positionId);
      }
    } catch (e) {
      // console.error(e);
    }
    return positionIds;
  }

  async estimateBuyTrade(
    wallet: Wallet,
    pair: string,
    amount: BigNumber,
    stopLossPercent: BigNumber
  ): Promise<any> {
    const factoryContract: Contract = this._config.getFactory(
      this._network,
      pair,
      this.chain
    );
    let consultPrice = await factoryContract.callStatic.getLatestPrice();
    consultPrice = BigNumber.from(consultPrice);
    const balanceVault: Contract = this._config.getBalanceVault(
      this._network,
      this.chain
    );
    const wantToken = await factoryContract.callStatic.wantToken();
    // console.log(`wallet.address: ${wallet.address}, wantToken: ${wantToken}`);
    const wantTokenContract = new Contract(
      wantToken,
      erc20.abi,
      this.chain.provider
    );
    const wantDecimals: BigNumber = await wantTokenContract.decimals();
    amount = BigNumber.from(amount).mul(BigNumber.from(10).pow(wantDecimals));
    const wantTokenBalance = await balanceVault.callStatic.getAccountBalance(
      wallet.address,
      wantToken
    );
    const onePercent = BigNumber.from(100);
    const stopLossPercentReal = onePercent.mul(stopLossPercent);
    const positionIds: any = await this.getOpenPositions(wallet, pair);
    const estimateBuy = {
      pair,
      price: consultPrice,
      wantAmount: amount,
      balance: wantTokenBalance,
      stopLossUpper: consultPrice.add(stopLossPercentReal),
      stopLossLower: consultPrice.sub(stopLossPercentReal),
      borrowRatioList: [5000, 10000, 15000, 20000],
      tickSpacing: await factoryContract.callStatic.tickSpacing(),
      positionIds,
    };
    return estimateBuy;
  }

  async estimateSellTrade(
    wallet: Wallet,
    pair: string,
    positionId?: BigNumber
  ): Promise<any> {
    const factoryContract: Contract = this._config.getFactory(
      this._network,
      pair,
      this.chain
    );
    const defaultProof = [
      '0x0000000000000000000000000000000000000000000000000000000000000000',
    ];
    let consultPrice = await factoryContract.callStatic.getLatestPrice();
    consultPrice = BigNumber.from(consultPrice);
    const balanceVault: Contract = this._config.getBalanceVault(
      this._network,
      this.chain
    );
    const wantToken = await factoryContract.callStatic.wantToken();
    console.log(`wallet.address: ${wallet.address}, wantToken: ${wantToken}`);
    const wantTokenBalance = await balanceVault.callStatic.getAccountBalance(
      wallet.address,
      wantToken
    );
    const positionIds: any = await this.getOpenPositions(wallet, pair);
    let estimateSell = {
      pair,
      price: consultPrice,
      positionIds: positionIds,
      balance: wantTokenBalance,
      positionInfo: undefined,
      positionId: BigNumber.from(0),
      defaultProof,
    };
    if (positionId) {
      const factoryAddr = this._config.contractAddress(this._network, pair);
      const aggregator = this._config.getAggregator(this._network, this.chain);
      const positionInfo: any = await aggregator.getAllPositionInfo(
        factoryAddr,
        positionId,
        BigNumber.from(1)
      );
      estimateSell = { ...estimateSell, positionInfo, positionId };
    }
    return estimateSell;
  }

  async openPosition(
    wallet: Wallet,
    pair: string,
    wantTokenAmount: BigNumber,
    borrowRatio: BigNumber,
    spotPriceTick: BigNumber,
    slippage: BigNumber,
    reserveRatio: BigNumber,
    stopLossUpperPriceTick: BigNumber,
    stopLossLowerPriceTick: BigNumber,
    tickRange: BigNumber,
    proof: string[]
  ): Promise<Transaction> {
    const factoryAddr = this._config.contractAddress(this._network, pair);
    const factoryContract = new Contract(
      factoryAddr,
      unibotFactoryAbi.abi,
      wallet
    );
    const defaultProof = [
      '0x0000000000000000000000000000000000000000000000000000000000000000',
    ];

    if (!proof) {
      proof = defaultProof;
    }
    const _strategyParams = {
      wantTokenAmount,
      borrowRatio,
      spotPriceTick,
      slippage,
      reserveRatio,
      stopLossUpperPriceTick,
      stopLossLowerPriceTick,
      tickRange,
      amount0Min: '0',
      amount1Min: '0',
    };
    console.log(_strategyParams);
    const result = {
      methodName: 'openPosition',
      args: [_strategyParams, proof],
      value: '0',
    };
    console.log(`result.args: ${result.args}`);
    const nonce = await this.chain.nonceManager.getNonceFromNode(wallet.address);
    const gasPrice = this.chain.gasPrice;
    const gasLimit = this.chain.gasLimitTransaction;
    console.log(`nonce: ${nonce + 1}`);
    const tx: ContractTransaction = await factoryContract[result.methodName](
      ...result.args,
      {
        gasPrice: (gasPrice * 1e9).toFixed(0),
        gasLimit: gasLimit.toFixed(0),
        value: result.value,
        nonce: nonce + 1,
      }
    );
    logger.info(JSON.stringify(tx));
    return tx;
  }

  async closePosition(
    wallet: Wallet,
    pair: string,
    _positionId: BigNumber,
    _spotPriceTick: BigNumber,
    _slippage: BigNumber,
    proof: string[]
  ): Promise<Transaction> {
    const factoryAddr = this._config.contractAddress(this._network, pair);
    const factoryContract = new Contract(
      factoryAddr,
      unibotFactoryAbi.abi,
      wallet
    );
    const defaultProof = [
      '0x0000000000000000000000000000000000000000000000000000000000000000',
    ];
    if (!proof) {
      proof = defaultProof;
    }
    const _strategyParams = {
      _positionId,
      _spotPriceTick,
      _slippage,
    };
    console.log(_strategyParams);
    const result = {
      methodName: 'closePosition',
      args: [_positionId, _spotPriceTick, _slippage, proof],
      value: '0',
    };
    console.log(`result.args: ${result.args}`);
    const nonce = await this.chain.nonceManager.getNonceFromNode(wallet.address);
    const gasPrice = this.chain.gasPrice;
    const gasLimit = this.chain.gasLimitTransaction;
    console.log(
      `address: ${wallet.address}, nonce: ${
        nonce + 1
      }, gasPrice: ${gasPrice}, gasLimit: ${gasLimit}`
    );

    const tx: ContractTransaction = await factoryContract[result.methodName](
      ...result.args,
      {
        // gasPrice: (gasPrice * 1e9).toFixed(0),
        gasLimit: gasLimit.toFixed(0),
        value: result.value,
        nonce: nonce + 1,
      }
    );
    logger.info(JSON.stringify(tx));
    return tx;
  }
}
