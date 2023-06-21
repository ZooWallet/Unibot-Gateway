import logging
import json
from config.api_help import operations_payload_template, operations_url, request_headers
from common.conn import init_connection


def check_conn(connection):
    if connection is None:
        connection = init_connection()
    return connection


def estimate_buy(connection=None):
    connection = check_conn(connection)
    payload = operations_payload_template['estimate_buy']
    request_url = operations_url['estimate_buy']
    connection.request(method="POST", url=request_url, headers=request_headers, body=json.dumps(payload))
    # Print the HTTP response from the IOT service endpoint
    response = connection.getresponse()
    logging.info(f'estimate_buy: {response.status} {response.reason}')
    data = response.read()
    return json.loads(data)


def open_position(connection=None, wantTokenAmount=0, spotPriceTick=0, stopLossUpperPriceTick=0, stopLossLowerPriceTick=0, tickRange=0):
    connection = check_conn(connection)
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
    logging.info(f'open_position: {response.status} {response.reason}')
    data = response.read()
    return json.loads(data)


def estimate_sell(connection=None, positionId=""):
    connection = check_conn(connection)
    payload = operations_payload_template['estimate_sell']
    request_url = operations_url['estimate_sell']
    payload['positionId'] = positionId
    connection.request(method="POST", url=request_url, headers=request_headers, body=json.dumps(payload))
    # Print the HTTP response from the IOT service endpoint
    response = connection.getresponse()
    logging.info(f'estimate_sell: {response.status} {response.reason}')
    data = response.read()
    return json.loads(data)


def close_position(connection=None, positionId="", spotPriceTick=0):
    connection = check_conn(connection)
    payload = operations_payload_template['close_position']
    payload['spotPriceTick'] = spotPriceTick
    payload['positionId'] = positionId
    # print(json.dumps(payload))
    request_url = operations_url['close_position']
    connection.request(method="POST", url=request_url, headers=request_headers, body=json.dumps(payload))
    # Print the HTTP response from the IOT service endpoint
    response = connection.getresponse()
    logging.info(f'close_position: {response.status} {response.reason}')
    data = response.read()
    return json.loads(data)
