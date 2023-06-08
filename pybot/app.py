from decimal import Decimal
import http.client
import json
import ssl
import time


# Defining certificate related stuff and host of endpoint
key_file = '../../certs/client_key.pem'
certificate_file = '../../certs/client_cert.pem'
certificate_secret = 'unibot'
host = 'localhost'

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

network = "arbitrum_one"
pair = "ARB-WETH-0_05%"
address = "0x777c86AA8D6145405ABe070659d660ea955C214A"
open_amount = "500"
stop_loss_percent = 70
slippage = 200
reserve_ratio = 0
borrowing_ratio = 15000
tick_range = 1000

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


def init_connection():
    print('init_connection')
    # Define the client certificate settings for https connection
    context = ssl.SSLContext(ssl.PROTOCOL_SSLv23)
    context.load_cert_chain(keyfile=key_file, certfile=certificate_file, password=certificate_secret)

    # Create a connection to submit HTTP requests
    connection = http.client.HTTPSConnection(host, port=15888, context=context)
    return connection


connection = init_connection()


def estimate_buy():
    payload = operations_payload_template['estimate_buy']
    request_url = operations_url['estimate_buy']
    connection.request(method="POST", url=request_url, headers=request_headers, body=json.dumps(payload))
    # Print the HTTP response from the IOT service endpoint
    response = connection.getresponse()
    print(response.status, response.reason)
    data = response.read()
    return json.loads(data)


def open_position(wantTokenAmount=0, spotPriceTick=0, stopLossUpperPriceTick=0, stopLossLowerPriceTick=0, tickRange=0):
    payload = operations_payload_template['open_position']
    payload['wantTokenAmount'] = wantTokenAmount
    payload['spotPriceTick'] = spotPriceTick
    payload['stopLossUpperPriceTick'] = stopLossUpperPriceTick
    payload['stopLossLowerPriceTick'] = stopLossLowerPriceTick
    payload['tickRange'] = tickRange
    # print(json.dumps(payload))
    request_url = operations_url['open_position']
    connection.request(method="POST", url=request_url, headers=request_headers, body=json.dumps(payload))
    # Print the HTTP response from the IOT service endpoint
    response = connection.getresponse()
    print(response.status, response.reason)
    data = response.read()
    return json.loads(data)


def estimate_sell(positionId=""):
    payload = operations_payload_template['estimate_sell']
    request_url = operations_url['estimate_sell']
    payload['positionId'] = positionId
    connection.request(method="POST", url=request_url, headers=request_headers, body=json.dumps(payload))
    # Print the HTTP response from the IOT service endpoint
    response = connection.getresponse()
    print(response.status, response.reason)
    data = response.read()
    return json.loads(data)


def close_position(positionId="", spotPriceTick=0):
    payload = operations_payload_template['close_position']
    payload['spotPriceTick'] = spotPriceTick
    payload['positionId'] = positionId
    # print(json.dumps(payload))
    request_url = operations_url['close_position']
    connection.request(method="POST", url=request_url, headers=request_headers, body=json.dumps(payload))
    # Print the HTTP response from the IOT service endpoint
    response = connection.getresponse()
    print(response.status, response.reason)
    data = response.read()
    return json.loads(data)


def main():
    connection.close()
    init_connection()
    p1 = estimate_buy()
    print(p1)
    d_estimatePrice = Decimal(p1["estimatePrice"])
    try_open_price = '1640'
    if len(p1["positionIds"]) == 0 and d_estimatePrice > Decimal(try_open_price):
        o = open_position(
            wantTokenAmount=p1["wantAmount"],
            spotPriceTick=p1["tick"],
            stopLossUpperPriceTick=p1["stopLossUpper"],
            stopLossLowerPriceTick=p1["stopLossLower"],
            tickRange=tick_range,
        )
        print(o)

    p2 = estimate_sell()
    # print(p2)
    earn_percent = Decimal('1')
    if len(p2["positionIds"]) > 0:
        p2 = estimate_sell(positionId=p2["positionIds"][0])
        print(p2)
        pnl = Decimal(p2["positionInfo"]["PNL"])
        want_at_start = Decimal(p2["positionInfo"]["position"]["wantTokenAmountAtStart"])
        target_earn_value = want_at_start / 100 * earn_percent
        print(f'want_at_start: {want_at_start} , pnl: {pnl} target_earn_value: {target_earn_value}')
        condition_match = target_earn_value < pnl
        print(f'condition_match: {condition_match}')
        if condition_match:
            resp = close_position(positionId=p2["positionId"], spotPriceTick=p2["tick"])
            print(resp)
            return False
    return True


def keep_running(flag=True):
    while flag:
        try:
            flag = main()
        except Exception as e:
            print(e)
        # run every 30 second
        time.sleep(30)


flag = True
# fix [Errno 32] Broken pipe
# Request-sent
############
# http://icejoywoo.github.io/2019/03/15/python-broken-pipe-error.html
import sys, errno
try:
    keep_running(flag)
except IOError as e:
    if e.errno == errno.EPIPE:
        keep_running(flag)
