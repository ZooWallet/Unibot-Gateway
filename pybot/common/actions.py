#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from decimal import Decimal
import logging
import json
from config.api_help import operations_url, request_headers
from common.conn import init_connection


def check_conn(connection):
    if connection is None:
        connection = init_connection()
    return connection


def estimate_buy(connection=None, payload=None):
    connection = check_conn(connection)
    if payload is None:
        logging.error(f'estimate_buy: missing payload <{payload}>')
        return {}
    request_url = operations_url['estimate_buy']
    connection.request(method="POST", url=request_url, headers=request_headers, body=json.dumps(payload))
    # Print the HTTP response from the IOT service endpoint
    response = connection.getresponse()
    logging.info(f'estimate_buy: {response.status} {response.reason}')
    data = response.read()
    return json.loads(data)


def open_position(connection=None, payload=None):
    connection = check_conn(connection)
    if payload is None:
        logging.error(f'open_position: missing payload <{payload}>')
        return {}
    # print(json.dumps(payload))
    request_url = operations_url['open_position']
    connection.request(method="POST", url=request_url, headers=request_headers, body=json.dumps(payload))
    # Print the HTTP response from the IOT service endpoint
    response = connection.getresponse()
    logging.info(f'open_position: {response.status} {response.reason}')
    data = response.read()
    return json.loads(data)


def estimate_sell(connection=None, payload=None):
    connection = check_conn(connection)
    if payload is None:
        logging.error(f'estimate_sell: missing payload <{payload}>')
        return {}
    request_url = operations_url['estimate_sell']
    connection.request(method="POST", url=request_url, headers=request_headers, body=json.dumps(payload))
    # Print the HTTP response from the IOT service endpoint
    response = connection.getresponse()
    logging.info(f'estimate_sell: {response.status} {response.reason}')
    data = response.read()
    encodeObj = json.loads(data)
    encodeObj['computeEstimatePrice'] = Decimal(encodeObj['estimatePrice'])
    if 'isWantToken0' in encodeObj:
        if encodeObj['isWantToken0']:
            encodeObj['computeEstimatePrice'] = Decimal(1) / encodeObj['computeEstimatePrice']
    if 'wantDecimals' in encodeObj and 'borrowDecimals' in encodeObj:
        dWantDecimals = Decimal(encodeObj['wantDecimals'])
        dBorrowDecimals = Decimal(encodeObj['borrowDecimals'])
        if dWantDecimals != dBorrowDecimals:
            rawEstimatePrice = encodeObj['computeEstimatePrice']
            encodeObj['computeEstimatePriceWithOutDecimal'] = encodeObj['computeEstimatePrice']
            diffDecimal = dWantDecimals - dBorrowDecimals
            powBase = Decimal(10)
            rawEstimatePrice = rawEstimatePrice * (powBase ** diffDecimal)
            encodeObj['computeEstimatePrice'] = rawEstimatePrice
    return encodeObj


def close_position(connection=None, payload=None):
    connection = check_conn(connection)
    if payload is None:
        logging.error(f'close_position: missing payload <{payload}>')
        return {}
    # print(json.dumps(payload))
    request_url = operations_url['close_position']
    connection.request(method="POST", url=request_url, headers=request_headers, body=json.dumps(payload))
    # Print the HTTP response from the IOT service endpoint
    response = connection.getresponse()
    logging.info(f'close_position: {response.status} {response.reason}')
    data = response.read()
    return json.loads(data)
