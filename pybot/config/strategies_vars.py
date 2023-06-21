from decimal import Decimal

# position will trigger open when reach to this price
try_open_price = '1732'
# open amount for this position
open_amount = "150"
# will over write open_amount
# when set True will use all balance deposited to open a position
put_all_asset = False
# percentage of stop loss price by tick
# 70 means the stop loss price will be current tick + 7000 tick or current tick - 7000 tick
# more information please refer: https://docs.uniswap.org/contracts/v3/reference/core/libraries/Tick
stop_loss_percent = 70
# price slippage of assets during swap at open / close position
slippage = 200
# reserve some asset at open position
reserve_ratio = 0
# borrowing ratio, example: 15000 = 1.5x
borrowing_ratio = 15000
# liquidity provide range of position
# example: ex. 1000 almost equal = +10% ~ -10% price range
tick_range = 1000
# close position condition when PNL reach n percent of open amount (takeProfit)
# will trigger close position transaction
earn_percent = Decimal('1')
# also keep loss of percent with the same ratio of earn_percent (stopLoss)
# when enable this, when position loss amount equals n percent of open amount
# will trigger close position transaction
stop_loss_with_same_earn_percent = True
