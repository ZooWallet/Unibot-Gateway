import logging
import errno
import time
from decimal import Decimal
from config.api_help_buy import get_estimate_buy, get_open_position
from config.api_help_sell import get_estimate_sell, get_close_position
from config.market import pair, pair2
from config.strategies_vars import try_open_price, open_amount, tick_range, earn_percent, loss_percent, enable_loss_percent
from common.conn import init_connection
from common.actions import estimate_buy, open_position, estimate_sell, close_position


logging.basicConfig(
    level=logging.INFO,
    format='[%(levelname)s] %(asctime)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
connection = init_connection()


def main():
    connection.close()
    d_open_amount = Decimal(open_amount)
    # estimate buy for pair1
    p1 = estimate_buy(connection=connection, payload=get_estimate_buy(pair=pair, amount=open_amount))
    logging.info(f'{pair} estimate_buy: {p1}')
    d_estimatePrice = Decimal(p1["estimatePrice"])
    want_amount = p1['wantAmount']
    p1_positionIds = p1['positionIds']

    # calculate same worth amount with open_amount for pair2
    # fixed float to 8 decimal point
    d_open_amount_p2 = "{:.8f}".format(d_open_amount / d_estimatePrice)
    logging.info(f'open_amount pair1({pair}) : {open_amount}, open_amount pair2({pair2}) : {d_open_amount_p2}')

    # estimate buy for pair2
    p2 = estimate_buy(connection=connection, payload=get_estimate_buy(pair=pair2, amount=d_open_amount_p2))
    logging.info(f'{pair} estimate_buy: {p2}')
    want_amount_p2 = p2['wantAmount']
    p2_positionIds = p2['positionIds']

    if len(p1["positionIds"]) == 0 and len(p2["positionIds"]) == 0:
        logging.info(f'limit order price: {try_open_price}')
        if d_estimatePrice > Decimal(try_open_price):
            p1o = open_position(
                connection=connection,
                payload=get_open_position(
                    pair=pair,
                    wantTokenAmount=want_amount,
                    spotPriceTick=p1["tick"],
                    stopLossUpperPriceTick=p1["stopLossUpper"],
                    stopLossLowerPriceTick=p1["stopLossLower"],
                    tickRange=tick_range,
                )
            )
            logging.info(f'{pair} open_position: {p1o}')
            p2o = open_position(
                connection=connection,
                payload=get_open_position(
                    pair=pair2,
                    wantTokenAmount=want_amount_p2,
                    spotPriceTick=p2["tick"],
                    stopLossUpperPriceTick=p2["stopLossUpper"],
                    stopLossLowerPriceTick=p2["stopLossLower"],
                    tickRange=tick_range,
                )
            )
            logging.info(f'{pair2} open_position: {p2o}')

    if len(p1_positionIds) > 0 or len(p2_positionIds) > 0:
        pnlp_p1 = Decimal(0)
        pnlp_p2 = Decimal(0)
        if len(p1_positionIds) > 0:
            d1 = estimate_sell(
                connection=connection,
                payload=get_estimate_sell(pair=pair, positionId=p1_positionIds[0]),
            )
            logging.info(f'{pair} estimate_sell: {d1}')
            pnl = Decimal(d1["positionInfo"]["PNL"])
            want_at_start = Decimal(d1["positionInfo"]["position"]["wantTokenAmountAtStart"])
            pnlp_p1 = pnl / (want_at_start / 100)
            logging.info(f'{pair} want_at_start: {want_at_start}, pnl: {pnl}')

        if len(p2_positionIds) > 0:
            d2 = estimate_sell(
                connection=connection,
                payload=get_estimate_sell(pair=pair2, positionId=p2_positionIds[0]),
            )
            logging.info(f'{pair2} estimate_sell: {d2}')
            pnl = Decimal(d2["positionInfo"]["PNL"])
            want_at_start = Decimal(d2["positionInfo"]["position"]["wantTokenAmountAtStart"])
            pnlp_p2 = pnl / (want_at_start / 100)
            logging.info(f'{pair2} want_at_start: {want_at_start}, pnl: {pnl}')

        # avoiding lack pnl information issue
        if pnlp_p1 == Decimal(0) or pnlp_p2 == Decimal(0) and (len(p1_positionIds) > 0 and len(p2_positionIds) > 0):
            return True
        condition_match = pnlp_p1 + pnlp_p2 > earn_percent
        logging.info(f'p1_percent: {pnlp_p1} p2_percent: {pnlp_p2} profit_percent: {pnlp_p1 + pnlp_p2} earn_percent: {earn_percent} condition_match: {condition_match}')
        if enable_loss_percent and (pnlp_p1 + pnlp_p2) < Decimal(0):
            condition_match = abs(pnlp_p1 + pnlp_p2) > loss_percent
            logging.info(f'enable_loss_percent: {enable_loss_percent} loss_percent: {pnlp_p1 + pnlp_p2} loss_percent: {loss_percent} condition_match: {condition_match}')
        if condition_match:
            if len(p1_positionIds) > 0:
                resp = close_position(
                    connection=connection,
                    payload=get_close_position(
                        pair=pair,
                        positionId=d1["positionId"],
                        spotPriceTick=d1["tick"]
                    ),
                )
                logging.info(f'{pair} close_position: {resp}')
            if len(p2_positionIds) > 0:
                resp = close_position(
                    connection=connection,
                    payload=get_close_position(
                        pair=pair2,
                        positionId=d2["positionId"],
                        spotPriceTick=d2["tick"]
                    ),
                )
                logging.info(f'{pair2} close_position: {resp}')
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
    keep_running(flag)
except IOError as e:
    if e.errno == errno.EPIPE:
        keep_running(flag)
