from config.market import network, pair
from config.account import address
from config.strategies_vars import open_amount, stop_loss_percent, slippage, reserve_ratio, borrowing_ratio

# Defining parts of the HTTP request
operations_url = {
    "estimate_buy": "/unibot/estimate/buy",
    "open_position": "/unibot/position/open",
    "estimate_sell": "/unibot/estimate/sell",
    "close_position": "/unibot/position/close"
}
request_headers = {
    'Content-Type': 'application/json'
}

operations_payload_template = {
    "estimate_buy": {
        "network": network,
        "chain": "ethereum",
        "connector": "unibot",
        "pair": pair,
        "address": address,
        "amount": open_amount,
        "stopLossPercent": stop_loss_percent
    },
    "open_position": {
        "network": network,
        "chain": "ethereum",
        "connector": "unibot",
        "pair": pair,
        "address": address,
        "wantTokenAmount": 0,
        "borrowRatio": borrowing_ratio,
        "spotPriceTick": 0,
        "slippage": slippage,
        "reserveRatio": reserve_ratio,
        "stopLossUpperPriceTick": 0,
        "stopLossLowerPriceTick": 0,
        "tickRange": 0,
    },
    "estimate_sell": {
        "network": network,
        "chain": "ethereum",
        "connector": "unibot",
        "pair": pair,
        "address": address,
        "positionId": ""
    },
    "close_position": {
        "network": network,
        "chain": "ethereum",
        "connector": "unibot",
        "pair": pair,
        "address": address,
        "positionId": "",
        "spotPriceTick": 0,
        "slippage": slippage
    }
}