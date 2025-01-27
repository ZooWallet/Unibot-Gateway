import {
  EstimateBuyTradeRequest,
  EstimateBuyTradResponse,
  EstimateClosePositionRequest,
  EstimateOpenPositionRequest,
  EstimateSellTradeRequest,
  FactoryInfoRequest,
} from './unibot.requests';
import { getConnector } from '../services/connection-manager';
import { Unibotish } from '../services/common-interfaces';
import {
  HttpException,
  GET_FACTORY_INFO_FAILED_ERROR_MESSAGE,
  PRICE_FAILED_ERROR_CODE,
  ESTIMATE_BUY_TRADE_FAILED_ERROR_MESSAGE,
  ESTIMATE_SELL_TRADE_FAILED_ERROR_MESSAGE,
  OPEN_POSITION_FAILED_ERROR_MESSAGE,
  CLOSE_POSITION_FAILED_ERROR_MESSAGE,
  UNKNOWN_ERROR_ERROR_CODE,
  UNKNOWN_ERROR_MESSAGE,
} from '../services/error-handler';
import { Wallet } from 'ethers';
import {
  getFactoryFormatOut,
  estimateBuyTradeFormatOut,
  estimateSellTradeFormatOut,
} from './unibot.outformat';

export async function getFactoryInfo(req: FactoryInfoRequest): Promise<any> {
  const connector: Unibotish = await getConnector<Unibotish>(
    req.chain ? req.chain : 'ethereum',
    req.network ? req.network : 'arbitrum_one',
    'unibot'
  );
  let resp: any;
  try {
    const pair = req.pair ? req.pair : 'ARB-WETH-0_05%';
    const payload = await connector.getFactoryInfo(pair);
    resp = getFactoryFormatOut(payload);
  } catch (e) {
    if (e instanceof Error) {
      throw new HttpException(
        500,
        GET_FACTORY_INFO_FAILED_ERROR_MESSAGE + e.message,
        PRICE_FAILED_ERROR_CODE
      );
    } else {
      throw new HttpException(
        500,
        UNKNOWN_ERROR_MESSAGE,
        UNKNOWN_ERROR_ERROR_CODE
      );
    }
  }
  return resp;
}

export async function estimateBuyTrade(
  req: EstimateBuyTradeRequest
): Promise<EstimateBuyTradResponse> {
  const connector: Unibotish = await getConnector<Unibotish>(
    req.chain,
    req.network,
    req.connector
  );
  const wallet: Wallet = await connector.getWallet(req.address);
  let resp: EstimateBuyTradResponse;
  try {
    const payload = await connector.estimateBuyTrade(
      wallet,
      req.pair,
      req.amount,
      req.stopLossPercent
    );
    resp = estimateBuyTradeFormatOut(payload);
  } catch (e) {
    if (e instanceof Error) {
      throw new HttpException(
        500,
        ESTIMATE_BUY_TRADE_FAILED_ERROR_MESSAGE + e.message,
        PRICE_FAILED_ERROR_CODE
      );
    } else {
      throw new HttpException(
        500,
        UNKNOWN_ERROR_MESSAGE,
        UNKNOWN_ERROR_ERROR_CODE
      );
    }
  }
  return resp;
}

export async function estimateSellTrade(
  req: EstimateSellTradeRequest
): Promise<any> {
  const connector: Unibotish = await getConnector<Unibotish>(
    req.chain,
    req.network,
    req.connector
  );
  const wallet: Wallet = await connector.getWallet(req.address);
  let resp: any;
  try {
    resp = await connector.estimateSellTrade(wallet, req.pair, req.positionId);
    resp = estimateSellTradeFormatOut(resp);
  } catch (e) {
    if (e instanceof Error) {
      throw new HttpException(
        500,
        ESTIMATE_SELL_TRADE_FAILED_ERROR_MESSAGE + e.message,
        PRICE_FAILED_ERROR_CODE
      );
    } else {
      throw new HttpException(
        500,
        UNKNOWN_ERROR_MESSAGE,
        UNKNOWN_ERROR_ERROR_CODE
      );
    }
  }
  return resp;
}

export async function openPosition(
  req: EstimateOpenPositionRequest
): Promise<any> {
  const connector: Unibotish = await getConnector<Unibotish>(
    req.chain,
    req.network,
    req.connector
  );
  const wallet: Wallet = await connector.getWallet(req.address);
  let resp: any;
  try {
    resp = await connector.openPosition(
      wallet,
      req.pair,
      req.wantTokenAmount,
      req.borrowRatio,
      req.spotPriceTick,
      req.slippage,
      req.reserveRatio,
      req.stopLossUpperPriceTick,
      req.stopLossLowerPriceTick,
      req.tickRange,
      req.proof,
      req.gasLimit,
      req.gasPrice
    );
  } catch (e) {
    if (e instanceof Error) {
      throw new HttpException(
        500,
        OPEN_POSITION_FAILED_ERROR_MESSAGE + e.message,
        PRICE_FAILED_ERROR_CODE
      );
    } else {
      throw new HttpException(
        500,
        UNKNOWN_ERROR_MESSAGE,
        UNKNOWN_ERROR_ERROR_CODE
      );
    }
  }
  return resp;
}

export async function closePosition(
  req: EstimateClosePositionRequest
): Promise<any> {
  const connector: Unibotish = await getConnector<Unibotish>(
    req.chain,
    req.network,
    req.connector
  );
  const wallet: Wallet = await connector.getWallet(req.address);
  let resp: any;
  try {
    resp = await connector.closePosition(
      wallet,
      req.pair,
      req.positionId,
      req.spotPriceTick,
      req.slippage,
      req.proof,
      req.gasLimit,
      req.gasPrice
    );
  } catch (e) {
    if (e instanceof Error) {
      throw new HttpException(
        500,
        CLOSE_POSITION_FAILED_ERROR_MESSAGE + e.message,
        PRICE_FAILED_ERROR_CODE
      );
    } else {
      throw new HttpException(
        500,
        UNKNOWN_ERROR_MESSAGE,
        UNKNOWN_ERROR_ERROR_CODE
      );
    }
  }
  return resp;
}
