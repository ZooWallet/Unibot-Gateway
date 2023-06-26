import logging
import errno
import time
from decimal import Decimal
from config.api_help_buy import get_estimate_buy, get_open_position
from config.api_help_sell import get_estimate_sell, get_close_position
from config.strategies_vars import try_open_price, put_all_asset, tick_range, earn_percent, stop_loss_with_same_earn_percent
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
    # estimate buy
    p1 = estimate_buy(connection=connection, payload=get_estimate_buy())
    logging.info(f'estimate_buy: {p1}')
    d_estimatePrice = Decimal(p1["estimatePrice"])
    want_amount = p1['wantAmount']
    if put_all_asset:
        want_amount = p1['balance']
    if len(p1["positionIds"]) == 0 and d_estimatePrice > Decimal(try_open_price):
        o = open_position(
            connection=connection,
            payload=get_open_position(
                wantTokenAmount=want_amount,
                spotPriceTick=p1["tick"],
                stopLossUpperPriceTick=p1["stopLossUpper"],
                stopLossLowerPriceTick=p1["stopLossLower"],
                tickRange=tick_range,
            )
        )
        logging.info(f'open_position: {o}')

    p2 = estimate_sell(payload=get_estimate_sell())
    # print(p2)
    if len(p2["positionIds"]) > 0:
        p2 = estimate_sell(
            connection=connection,
            payload=get_estimate_sell(positionId=p2["positionIds"][0]),
        )
        logging.info(f'estimate_sell: {p2}')
        pnl = Decimal(p2["positionInfo"]["PNL"])
        want_at_start = Decimal(p2["positionInfo"]["position"]["wantTokenAmountAtStart"])
        target_earn_value = want_at_start / 100 * earn_percent
        logging.info(f'want_at_start: {want_at_start}, pnl: {pnl} target_earn_value: {target_earn_value}')
        condition_match = target_earn_value < pnl
        if stop_loss_with_same_earn_percent:
            condition_match = target_earn_value < abs(pnl)
        logging.info(f'condition_match: {condition_match}, stop_loss_with_same_earn_percent: {stop_loss_with_same_earn_percent}')
        if condition_match:
            resp = close_position(
                connection=connection,
                payload=get_close_position(
                    positionId=p2["positionId"],
                    spotPriceTick=p2["tick"]
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
    keep_running(flag)
except IOError as e:
    if e.errno == errno.EPIPE:
        keep_running(flag)
