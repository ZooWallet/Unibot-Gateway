import logging
import errno
import time
import http.client
import json
from decimal import Decimal
from config.account import proof
from config.api_help_buy import get_estimate_buy, get_open_position
from config.api_help_sell import get_estimate_sell, get_close_position
from config.strategies_vars import try_open_price, put_all_asset, tick_range, loss_percent, enable_loss_percent
from config.nami_strategy_vars import repay_swap_ratio
from common.conn import init_connection
from common.actions import estimate_buy, open_position, estimate_sell, close_position


logging.basicConfig(
    level=logging.INFO,
    format='[%(levelname)s] %(asctime)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
connection = init_connection()


def getPosition(positionId=None):
    if positionId is not None:
        conn = http.client.HTTPSConnection('58mbg6291h.execute-api.ap-northeast-1.amazonaws.com')
        conn.request('GET', f'/stag/api/v1/diamond_factory/all/positions?position_id={positionId}&chain=arbitrum')
        response = conn.getresponse()
        return json.loads(response.read())


def main():
    connection.close()
    p2 = estimate_sell(payload=get_estimate_sell())
    # print(p2)
    if len(p2["positionIds"]) == 0:
        logging.info(f'limit order price: {try_open_price}')
        # estimate buy
        p1 = estimate_buy(connection=connection, payload=get_estimate_buy())
        logging.info(f'estimate_buy: {p1}')
        d_estimatePrice = Decimal(p1["estimatePrice"])
        want_amount = p1['wantAmount']
        if put_all_asset:
            want_amount = p1['balance']
        if d_estimatePrice > Decimal(try_open_price):
            o = open_position(
                connection=connection,
                payload=get_open_position(
                    wantTokenAmount=want_amount,
                    spotPriceTick=p1["tick"],
                    stopLossUpperPriceTick=p1["stopLossUpper"],
                    stopLossLowerPriceTick=p1["stopLossLower"],
                    tickRange=tick_range,
                    proof=proof,
                )
            )
            logging.info(f'open_position: {o}')
    else:
        p2 = estimate_sell(
            connection=connection,
            payload=get_estimate_sell(positionId=p2["positionIds"][0]),
        )
        logging.info(f'estimate_sell: {p2}')
        d_estimatePrice = Decimal(p2["estimatePrice"])
        dvlmit = Decimal(p2["positionInfo"]["debtValueMeasuredInWantToken"])
        positionBorrowAmount = Decimal(p2["positionInfo"]["positionTokenAmount"]["borrowTokenAmount"])
        borrowLendingAmount = dvlmit / d_estimatePrice
        borrowLackDiff = abs(positionBorrowAmount - borrowLendingAmount)
        # repay_swap_ratio percent of lend amount
        pola = borrowLendingAmount / 100 * repay_swap_ratio
        condition_match = pola > borrowLackDiff
        logging.info(f'positionBorrowAmount: {positionBorrowAmount} borrowLendingAmount: {borrowLendingAmount} '
                     f'diff: {borrowLackDiff} pola: {pola} repay_swap_ratio: {repay_swap_ratio} '
                     f'condition_match: {condition_match} ')
        pnl = Decimal(p2["positionInfo"]["PNL"])
        want_at_start = Decimal(p2["positionInfo"]["position"]["wantTokenAmountAtStart"])
        target_stop_loss_value = want_at_start / 100 * loss_percent
        logging.info(f'want_at_start: {want_at_start} pnl: {pnl}')
        if not condition_match and enable_loss_percent and pnl < Decimal(0):
            condition_match = target_stop_loss_value < abs(pnl)
            logging.info(
                f'loss_percent: {loss_percent} target_stop_loss_value: {target_stop_loss_value} enable_loss_percent: {enable_loss_percent} '
                f'condition_match: {condition_match} ')
        if condition_match:
            resp = close_position(
                connection=connection,
                payload=get_close_position(
                    positionId=p2["positionId"],
                    spotPriceTick=p2["tick"],
                    proof=proof,
                ),
            )
            logging.info(f'close_position: {resp}')
            return False
    return True


def keep_running(flag=True):
    while flag:
        try:
            flag = main()
        except Exception as e:
            logging.error(f'keep_running: {e}')
        # run every 30 second
        time.sleep(30)


flag = True
# fix [Errno 32] Broken pipe
# Request-sent
############
# http://icejoywoo.github.io/2019/03/15/python-broken-pipe-error.html
try:
    # print(getPosition(696386))
    keep_running(flag)
except IOError as e:
    if e.errno == errno.EPIPE:
        keep_running(flag)
