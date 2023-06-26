from config.api_help import operations_payload_template


def get_estimate_sell(network=None, address=None, pair=None, positionId=None):
    body = operations_payload_template["estimate_sell"]
    if network is not None:
        body["network"] = network
    if address is not None:
        body["address"] = address
    if pair is not None:
        body["pair"] = pair
    if positionId is not None:
        body["positionId"] = positionId
    return body


def get_close_position(network=None, address=None, pair=None, positionId=None, spotPriceTick=None,
                       slippage=None):
    body = operations_payload_template["close_position"]
    if network is not None:
        body["network"] = network
    if address is not None:
        body["address"] = address
    if pair is not None:
        body["pair"] = pair
    if positionId is not None:
        body["positionId"] = positionId
    if spotPriceTick is not None:
        body["spotPriceTick"] = spotPriceTick
    if slippage is not None:
        body["slippage"] = slippage
    return body

