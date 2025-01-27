import Decimal from 'decimal.js-light';

export function getFactoryFormatOut(payload: any) {
  if ('reserveRatioMax' in payload) {
    payload.reserveRatioMax = payload.reserveRatioMax.toString();
  }
  if ('borrowRatioMax' in payload) {
    payload.borrowRatioMax = payload.borrowRatioMax.toString();
  }
  if ('borrowRatioMin' in payload) {
    payload.borrowRatioMin = payload.borrowRatioMin.toString();
  }
  if ('tickSpacing' in payload) {
    payload.tickSpacing = payload.tickSpacing.toString();
  }
  if ('openPositionMaximumAmount' in payload) {
    payload.openPositionMaximumAmount =
      payload.openPositionMaximumAmount.toString();
  }
  if ('openPositionMinimumAmount' in payload) {
    payload.openPositionMinimumAmount =
      payload.openPositionMinimumAmount.toString();
  }
  if ('maxPositionNumber' in payload) {
    payload.maxPositionNumber = payload.maxPositionNumber.toString();
  }
  return payload;
}

export function estimateBuyTradeFormatOut(payload: any) {
  if ('tick' in payload) {
    payload.tick = payload.tick.toString();
  }
  if ('wantAmount' in payload) {
    payload.wantAmount = payload.wantAmount.toString();
  }
  if ('balance' in payload) {
    payload.balance = payload.balance.toString();
  }
  if ('stopLossUpper' in payload) {
    payload.stopLossUpper = payload.stopLossUpper.toString();
  }
  if ('stopLossLower' in payload) {
    payload.stopLossLower = payload.stopLossLower.toString();
  }
  if ('estimatePrice' in payload) {
    payload.estimatePrice = payload.estimatePrice.toString();
  }
  if ('estimatePriceStopLossUpper' in payload) {
    payload.estimatePriceStopLossUpper =
      payload.estimatePriceStopLossUpper.toString();
  }
  if ('estimatePriceStopLossLower' in payload) {
    payload.estimatePriceStopLossLower =
      payload.estimatePriceStopLossLower.toString();
  }
  if ('positionIds' in payload) {
    const positionIds = payload['positionIds'].map((element: any) => {
      return element.toString();
    });
    payload.positionIds = positionIds;
  }
  const resp = {
    pair: payload['pair'],
    tick: payload['tick'],
    wantAmount: payload['wantAmount'],
    balance: payload['balance'],
    stopLossUpper: payload['stopLossUpper'],
    stopLossLower: payload['stopLossLower'],
    estimatePriceStopLossUpper: payload['estimatePriceStopLossUpper'],
    estimatePriceStopLossLower: payload['estimatePriceStopLossLower'],
    borrowRatioList: payload['borrowRatioList'],
    tickSpacing: payload['tickSpacing'],
    positionIds: payload['positionIds'],
    estimatePrice: payload['estimatePrice'],
  };
  return resp;
}

export function estimateSellTradeFormatOut(payload: any) {
  if ('tick' in payload) {
    payload.tick = payload.tick.toString();
  }
  if ('estimatePrice' in payload) {
    payload.estimatePrice = payload.estimatePrice.toString();
  }
  if ('wantAmount' in payload) {
    payload.wantAmount = payload.wantAmount.toString();
  }
  if ('balance' in payload) {
    payload.balance = payload.balance.toString();
  }
  if ('positionId' in payload) {
    payload.positionId = payload.positionId.toString();
  }
  if ('positionIds' in payload && payload['positionIds']) {
    const positionIds = payload['positionIds'].map((element: any) => {
      return element.toString();
    });
    payload.positionIds = positionIds;
  }
  if ('positionInfo' in payload && payload['positionInfo']) {
    const positionInfo = payload['positionInfo'];
    const positionInfoObj: any = {
      canStopLoss: positionInfo[0],
      healthFactor: positionInfo[1].toString(),
      borrowAmount: positionInfo[2].toString(),
      positionValueMeasuredInWantToken: new Decimal(positionInfo[3].toString()),
      debtValueMeasuredInWantToken: new Decimal(positionInfo[4].toString()),
      tickLower: positionInfo[5].toString(),
      tickUpper: positionInfo[6].toString(),
    };
    const positionTokenAmountRaw = positionInfo[7];
    positionInfoObj.positionTokenAmount = {
      wantTokenAmount: positionTokenAmountRaw[0].toString(),
      borrowTokenAmount: positionTokenAmountRaw[1].toString(),
      wantTokenFee: positionTokenAmountRaw[2].toString(),
      borrowTokenFee: positionTokenAmountRaw[3].toString(),
    };
    const PositionRaw = positionInfo[8];
    positionInfoObj.position = {
      positionId: PositionRaw[0].toString(),
      owner: PositionRaw[1],
      borrowId: PositionRaw[2].toString(),
      wantTokenAmountAtStart: new Decimal(PositionRaw[3].toString()),
      reserveAmountAtStart: new Decimal(PositionRaw[4].toString()),
      positionCreateTimestamp: PositionRaw[5].toString(),
      startPriceTick: PositionRaw[6].toString(),
      borrowRatio: PositionRaw[7].toString(),
      reserveAmount: PositionRaw[8].toString(),
      stopLossUpperPriceTick: PositionRaw[9].toString(),
      stopLossLowerPriceTick: PositionRaw[10].toString(),
    };
    // positionValueMeasuredInWantToken - wantTokenAmountAtStart - debtValueMeasuredInWantToken + reserveAmountAtStart
    positionInfoObj.PNL = positionInfoObj.positionValueMeasuredInWantToken
      .sub(positionInfoObj.position.wantTokenAmountAtStart)
      .sub(positionInfoObj.debtValueMeasuredInWantToken)
      .add(positionInfoObj.position.reserveAmountAtStart);

    payload['positionInfo'] = positionInfoObj;
  }
  return payload;
}
