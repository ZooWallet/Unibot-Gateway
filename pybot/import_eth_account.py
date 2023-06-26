#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
import logging
import json
from common.conn import init_connection
from config.api_help import request_headers
from config.certs import host, port
from config.market import network


logging.basicConfig(
    level=logging.INFO,
    format='[%(levelname)s] %(asctime)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)


def import_eth_account(private_key='0x0000000000000000000000000000000000000000000000000000000000000000'):
    connection = init_connection()
    payload = {
        "chain": "ethereum",
        "network": network,
        "privateKey": private_key
    }
    request_url = f'https://{host}:{port}/wallet/add'
    logging.info(f'request_url: {request_url}')
    connection.request(method="POST", url=request_url, headers=request_headers, body=json.dumps(payload))
    # Print the HTTP response from the IOT service endpoint
    response = connection.getresponse()
    logging.info(f'import_eth_account: {response.status} {response.reason}')
    data = response.read()
    logging.debug(f'data: {data}')
    return json.loads(data)


def get_current_node_url():
    connection = init_connection()
    request_url = f'https://{host}:{port}/network/status?chain=ethereum&network=arbitrum_one'
    logging.info(f'request_url: {request_url}')
    connection.request(method="GET", url=request_url, headers=request_headers)
    # Print the HTTP response from the IOT service endpoint
    response = connection.getresponse()
    logging.info(f'get_current_url: {response.status} {response.reason}')
    data = response.read()
    logging.debug(f'data: {data}')
    return json.loads(data)


def main():
    input = None
    if len(sys.argv) > 1:
        input = sys.argv[1]
    if input is None or len(input) == 0:
        logging.error('missing private key: ex: python import_eth_account.py eth_private_key')
        sys.exit(1)
    else:
        if input.startswith('0x'):
            input = input[2:]
    resp = import_eth_account(private_key=input)
    logging.info(f'resp: {resp}')


main()
