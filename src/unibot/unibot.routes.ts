/* eslint-disable no-inner-declarations */
/* eslint-disable @typescript-eslint/ban-types */
import { Router, Request, Response } from 'express';
import { asyncHandler } from '../services/error-handler';
import {
  getFactoryInfo,
  closePosition,
  estimateBuyTrade,
  estimateSellTrade,
  openPosition,
} from './unibot.controllers';
import {
  FactoryInfoRequest,
  EstimateBuyTradeRequest,
  EstimateBuyTradResponse,
  EstimateClosePositionRequest,
  EstimateOpenPositionRequest,
  EstimateSellTradeRequest,
} from './unibot.requests';
import { validateEstimateBuyTradeRequestRequest } from './unibot.validators';

export namespace UnibotRoutes {
  export const router = Router();

  router.get(
    '/factory/info',
    asyncHandler(
      async (
        req: Request<{}, {}, FactoryInfoRequest>,
        res: Response<any | string, {}>
      ) => {
        res.status(200).json(await getFactoryInfo(req.query));
      }
    )
  );

  router.post(
    '/estimate/buy',
    asyncHandler(
      async (
        req: Request<{}, {}, EstimateBuyTradeRequest>,
        res: Response<EstimateBuyTradResponse | string, {}>
      ) => {
        validateEstimateBuyTradeRequestRequest(req.body);
        res.status(200).json(await estimateBuyTrade(req.body));
      }
    )
  );

  router.post(
    '/estimate/sell',
    asyncHandler(
      async (
        req: Request<{}, {}, EstimateSellTradeRequest>,
        res: Response<any | string, {}>
      ) => {
        validateEstimateBuyTradeRequestRequest(req.body);
        res.status(200).json(await estimateSellTrade(req.body));
      }
    )
  );

  router.post(
    '/position/open',
    asyncHandler(
      async (
        req: Request<{}, {}, EstimateOpenPositionRequest>,
        res: Response<any | string, {}>
      ) => {
        validateEstimateBuyTradeRequestRequest(req.body);
        res.status(200).json(await openPosition(req.body));
      }
    )
  );

  router.post(
    '/position/close',
    asyncHandler(
      async (
        req: Request<{}, {}, EstimateClosePositionRequest>,
        res: Response<any | string, {}>
      ) => {
        validateEstimateBuyTradeRequestRequest(req.body);
        res.status(200).json(await closePosition(req.body));
      }
    )
  );
}
