export function estimateBuyTradeFormatOut(payload: any) {
  if ('price' in payload) {
    payload.price = payload.price.toString();
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
  if ('positionIds' in payload) {
    const positionIds = payload['positionIds'].map((element: any) => {
      return element.toString();
    });
    payload.positionIds = positionIds;
  }
  const resp = {
    pair: payload['pair'],
    price: payload['price'],
    wantAmount: payload['wantAmount'],
    balance: payload['balance'],
    stopLossUpper: payload['stopLossUpper'],
    stopLossLower: payload['stopLossLower'],
    borrowRatioList: payload['borrowRatioList'],
    tickSpacing: payload['tickSpacing'],
    positionIds: payload['positionIds'],
  };
  return resp;
}

export function estimateSellTradeFormatOut(payload: any) {
  if ('price' in payload) {
    payload.price = payload.price.toString();
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
  if ('positionIds' in payload) {
    const positionIds = payload['positionIds'].map((element: any) => {
      return element.toString();
    });
    payload.positionIds = positionIds;
  }
  if ('positionInfo' in payload) {
    const positionInfo = payload['positionInfo'];
    const positionInfoObj: any = {
      canStopLoss: positionInfo[0],
      healthFactor: positionInfo[1].toString(),
      borrowAmount: positionInfo[2].toString(),
      positionValueMeasuredInWantToken: positionInfo[3].toString(),
      debtValueMeasuredInWantToken: positionInfo[4].toString(),
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
      wantTokenAmountAtStart: PositionRaw[3].toString(),
      reserveAmountAtStart: PositionRaw[4].toString(),
      positionCreateTimestamp: PositionRaw[5].toString(),
      startPriceTick: PositionRaw[6].toString(),
      borrowRatio: PositionRaw[7].toString(),
      reserveAmount: PositionRaw[8].toString(),
      stopLossUpperPriceTick: PositionRaw[9].toString(),
      stopLossLowerPriceTick: PositionRaw[10].toString(),
    };
    // positionValueMeasuredInWantToken - wantTokenAmountAtStart - debtValueMeasuredInWantToken + reserveAmountAtStart
    positionInfoObj.PNL =
      positionInfoObj.positionValueMeasuredInWantToken -
      positionInfoObj.position.wantTokenAmountAtStart -
      positionInfoObj.debtValueMeasuredInWantToken +
      positionInfoObj.position.reserveAmountAtStart;

    payload['positionInfo'] = positionInfoObj;
  }
  return payload;
}
