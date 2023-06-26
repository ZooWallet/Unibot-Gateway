from config.api_help import operations_payload_template


def get_estimate_buy(network=None, address=None, pair=None, amount=None, stopLossPercent=None):
    body = operations_payload_template["estimate_buy"]
    if network is not None:
        body["network"] = network
    if address is not None:
        body["address"] = address
    if pair is not None:
        body["pair"] = pair
    if amount is not None:
        body["amount"] = amount
    if stopLossPercent is not None:
        body["stopLossPercent"] = stopLossPercent
    return body


def get_open_position(network=None, address=None, pair=None, wantTokenAmount=None, borrowRatio=None, spotPriceTick=None,
                      slippage=None, reserveRatio=None, stopLossUpperPriceTick=None, stopLossLowerPriceTick=None,
                      tickRange=None):
    body = operations_payload_template["open_position"]
    if network is not None:
        body["network"] = network
    if address is not None:
        body["address"] = address
    if pair is not None:
        body["pair"] = pair
    if wantTokenAmount is not None:
        body["wantTokenAmount"] = wantTokenAmount
    if borrowRatio is not None:
        body["borrowRatio"] = borrowRatio
    if spotPriceTick is not None:
        body["spotPriceTick"] = spotPriceTick
    if slippage is not None:
        body["slippage"] = slippage
    if reserveRatio is not None:
        body["reserveRatio"] = reserveRatio
    if stopLossUpperPriceTick is not None:
        body["stopLossUpperPriceTick"] = stopLossUpperPriceTick
    if stopLossLowerPriceTick is not None:
        body["stopLossLowerPriceTick"] = stopLossLowerPriceTick
    if tickRange is not None:
        body["tickRange"] = tickRange
    return body
