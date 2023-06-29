// Unibotish
import {
  BigNumber,
  Contract,
  Transaction,
  ContractTransaction,
  Wallet,
} from 'ethers';
import Decimal from 'decimal.js-light';
import unibotFactoryAbi from './unibot_factory_abi.json';
import unibotHelperAbi from './unibot_helper_abi.json';
import { UnibotConfig } from './unibot.config';
import { Ethereum } from '../../chains/ethereum/ethereum';
import { Polygon } from '../../chains/polygon/polygon';
import { Unibotish } from '../../services/common-interfaces';
import { tickToPrice } from '@uniswap/v3-sdk';
import { Token } from '@uniswap/sdk-core';
import erc20 from './erc20.json';
import unibotController from './unibot_controller.json';
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

  tickToPrice(
    consultPrice: BigNumber,
    wantDecimals: BigNumber,
    borrowDecimals: BigNumber,
    wantTokenIsToken0: boolean
  ) {
    const tickBase = new Decimal('1.0001').pow(
      new Decimal(consultPrice.toString())
    );
    let decimalBase = new Decimal(1);
    if (wantDecimals > borrowDecimals) {
      decimalBase = new Decimal(10).pow(
        new Decimal(wantDecimals.toString()).sub(
          new Decimal(borrowDecimals.toString())
        )
      );
    } else if (wantDecimals < borrowDecimals) {
      decimalBase = new Decimal(10).pow(
        new Decimal(borrowDecimals.toString()).sub(
          new Decimal(wantDecimals.toString())
        )
      );
    }
    const oppositeBase = new Decimal(1);
    let estimatePrice = tickBase.mul(decimalBase);
    if (wantTokenIsToken0) {
      estimatePrice = oppositeBase.div(estimatePrice);
    }
    return estimatePrice;
  }

  async getFactoryInfo(pair: string): Promise<any> {
    const contractAddress = this._config.contractAddress(this._network, pair);
    const factoryContract: Contract = this._config.getFactory(
      this._network,
      pair,
      this.chain
    );
    const controller = await factoryContract.callStatic.controller();
    const controllerContract = new Contract(
      controller,
      unibotController.abi,
      this.chain.provider
    );
    const wantToken = await factoryContract.callStatic.wantToken();
    const borrowToken = await factoryContract.callStatic.borrowToken();
    const reserveRatioMax = await factoryContract.callStatic.reserveRatioMax();
    const borrowRatioMax = await factoryContract.callStatic.borrowRatioMax();
    const borrowRatioMin = await factoryContract.callStatic.borrowRatioMin();
    const tickSpacing = await factoryContract.callStatic.tickSpacing();
    const openPositionMaximumAmount =
      await factoryContract.callStatic.openPositionMaximumAmount();
    const openPositionMinimumAmount =
      await factoryContract.callStatic.openPositionMinimumAmount();
    const maxPositionNumber =
      await controllerContract.callStatic.maxPositionNumber();
    return {
      pair,
      contractAddress,
      wantToken,
      borrowToken,
      openPositionMaximumAmount,
      openPositionMinimumAmount,
      maxPositionNumber,
      reserveRatioMax,
      borrowRatioMax,
      borrowRatioMin,
      tickSpacing,
    };
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
    const borrowToken = await factoryContract.callStatic.borrowToken();
    // console.log(`wallet.address: ${wallet.address}, wantToken: ${wantToken}`);
    const wantTokenContract = new Contract(
      wantToken,
      erc20.abi,
      this.chain.provider
    );
    const borrowTokenContract = new Contract(
      borrowToken,
      erc20.abi,
      this.chain.provider
    );
    const wantDecimals: BigNumber = await wantTokenContract.decimals();
    const borrowDecimals: BigNumber = await borrowTokenContract.decimals();
    const wantTokenIsToken0: boolean =
      await factoryContract.wantTokenIsToken0();
    const estimatePrice = this.tickToPrice(
      consultPrice,
      wantDecimals,
      borrowDecimals,
      wantTokenIsToken0
    );
    const dAmount = new Decimal(amount.toString());
    const dWantDecimals = new Decimal(10).pow(
      new Decimal(wantDecimals.toString())
    );
    const wantAmount = dAmount.mul(dWantDecimals);
    const wantTokenBalance = await balanceVault.callStatic.getAccountBalance(
      wallet.address,
      wantToken
    );
    const onePercent = BigNumber.from(100);
    const stopLossPercentReal = onePercent.mul(stopLossPercent);
    const positionIds: any = await this.getOpenPositions(wallet, pair);
    const stopLossUpper = consultPrice.add(stopLossPercentReal);
    const estimatePriceStopLossUpper = this.tickToPrice(
      stopLossUpper,
      wantDecimals,
      borrowDecimals,
      wantTokenIsToken0
    );
    const stopLossLower = consultPrice.sub(stopLossPercentReal);
    const estimatePriceStopLossLower = this.tickToPrice(
      stopLossLower,
      wantDecimals,
      borrowDecimals,
      wantTokenIsToken0
    );
    const estimateBuy = {
      tick: consultPrice,
      estimatePrice,
      wantAmount,
      balance: wantTokenBalance,
      stopLossUpper,
      stopLossLower,
      estimatePriceStopLossUpper,
      estimatePriceStopLossLower,
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
    const borrowToken = await factoryContract.callStatic.borrowToken();
    console.log(`wallet.address: ${wallet.address}, wantToken: ${wantToken}`);
    const wantTokenBalance = await balanceVault.callStatic.getAccountBalance(
      wallet.address,
      wantToken
    );
    const wantTokenContract = new Contract(
      wantToken,
      erc20.abi,
      this.chain.provider
    );
    const borrowTokenContract = new Contract(
      borrowToken,
      erc20.abi,
      this.chain.provider
    );
    const wantDecimals: BigNumber = await wantTokenContract.decimals();
    const borrowDecimals: BigNumber = await borrowTokenContract.decimals();
    const wantTokenIsToken0: boolean =
      await factoryContract.wantTokenIsToken0();
    const estimatePrice = this.tickToPrice(
      consultPrice,
      wantDecimals,
      borrowDecimals,
      wantTokenIsToken0
    );
    const positionIds: any = await this.getOpenPositions(wallet, pair);
    let estimateSell = {
      tick: consultPrice,
      estimatePrice,
      positionIds: positionIds,
      balance: wantTokenBalance,
      positionInfo: undefined,
      positionId: BigNumber.from(0),
      defaultProof,
      pendingRewardTokenAmount: BigNumber.from(0),
    };
    if (positionId) {
      try {
        const factoryAddr = this._config.contractAddress(this._network, pair);
        const aggregator = this._config.getAggregator(
          this._network,
          this.chain
        );
        const positionInfo: any = await aggregator.getAllPositionInfo(
          factoryAddr,
          positionId,
          BigNumber.from(1)
        );
        estimateSell = { ...estimateSell, positionInfo, positionId };
      } catch (e) {
        console.error(e);
      }
    }
    if (this._network == 'bsc') {
      try {
        const helper = this._config.getHelper(this._network, this.chain);
        estimateSell['pendingRewardTokenAmount'] =
          await helper.getPendingRewardTokenAmount(positionId);
      } catch (e) {
        console.error(e);
      }
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
    proof?: string[],
    gasLimit?: number,
    gasPrice?: number
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
    const nonce = await this.chain.nonceManager.getNonceFromNode(
      wallet.address
    );
    gasPrice = gasPrice ? gasPrice : this.chain.gasPrice;
    gasLimit = gasLimit ? gasLimit : this.chain.gasLimitTransaction;
    console.log(`nonce: ${nonce + 1}`);
    // static call once
    const staticCallResponse = await factoryContract.callStatic[
      result.methodName
    ](...result.args, {
      gasPrice: (gasPrice * 1e9).toFixed(0),
      gasLimit: gasLimit.toFixed(0),
      value: result.value,
      nonce: nonce + 1,
    });
    logger.info(`openPosition callStatic: ${staticCallResponse}`);
    if (!staticCallResponse.includes('revert')) {
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
    } else {
      return staticCallResponse;
    }
  }

  async closePosition(
    wallet: Wallet,
    pair: string,
    _positionId: BigNumber,
    _spotPriceTick: BigNumber,
    _slippage: BigNumber,
    proof?: string[],
    gasLimit?: number,
    gasPrice?: number
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
    const nonce = await this.chain.nonceManager.getNonceFromNode(
      wallet.address
    );
    gasPrice = gasPrice ? gasPrice : this.chain.gasPrice;
    gasLimit = gasLimit ? gasLimit : this.chain.gasLimitTransaction;
    console.log(
      `address: ${wallet.address}, nonce: ${
        nonce + 1
      }, gasPrice: ${gasPrice}, gasLimit: ${gasLimit}`
    );
    // static call once
    const staticCallResponse = await factoryContract.callStatic[
      result.methodName
    ](...result.args, {
      gasPrice: (gasPrice * 1e9).toFixed(0),
      gasLimit: gasLimit.toFixed(0),
      value: result.value,
      nonce: nonce + 1,
    });
    logger.info(`closePosition callStatic: ${staticCallResponse}`);
    if (!staticCallResponse.includes('revert')) {
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
    } else {
      return staticCallResponse;
    }
  }
}
