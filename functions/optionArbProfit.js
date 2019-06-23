const Big = require('big.js');

const priceSlippage = require('./priceSlippage.js');
/*
Takes futures, call, put order books in {bids: [], asks:[]} format.
Bids and asks are in [[price, amount], [price, amount]] format
with with price in dollars and amount in bitcoins.
Stike price, and index price are in dollars.
Amount is in bitcoins, buyCall is a bool.
It determines whether you buy a call, sell a put, and sell a future
or sell a call, buy a put, and buy a future.
*/
module.exports = function optionArbProfit(future, call, put, strike, index, amount, buyCall) {
  // Error checks on amount
  if (!amount) throw new Error("Undefined amount");
  amount = Big(amount);
  if (amount.lt(0.1)) throw new Error("Amount must be greater than 0.1");

  // Error checks on index
  if (!index) throw new Error("Undefined index");
  index = Big(index)
  if (index.lte(0)) throw new Error("Index must be greater than 0");

  // Error checks on strike
  if (!strike) throw new Error("Undefined strike");
  strike = Big(strike)
  if (strike.lte(0)) throw new Error("Strike must be greater than 0");

  // initialize variables
  let future_cost, call_call, put_cost, strike_cost, profit

  // This will calculate the profit for buying a call and selling the others
  if (buyCall) {
    // If there are no call asks, you can't buy a call
    if (call.asks.length === 0) return 0;

    // If there are no future bids, you can't sell a future
    if (future.bids.length === 0) return 0;

    // If there are no put bids, you can't sell a put
    if (put.bids.length === 0) return 0;

    // Math to calculate profit: buy call, sell put and futures
    put_cost = priceSlippage(amount, put.bids, 2)
    future_cost = priceSlippage(amount, future.bids, 2)
    call_cost = priceSlippage(amount, call.asks, 2)
    strike_cost = amount.times(strike).round(2)
    profit = put_cost.plus(future_cost).minus(call_cost).minus(strike_cost).round(2)

  } else { // This calculates the profit for selling a call and buying others

    // If there are no call bids, you can't sell a call
    if (call.bids.length === 0) return 0;

    // If there are no future asks, you can't buy a future
    if (future.asks.length === 0) return 0;

    // If there are no put asks, you can't buy a put
    if (put.asks.length === 0) return 0;

    // Math to calculate profit: sell call, buy put and futures
    put_cost = priceSlippage(amount, put.asks, 2)
    future_cost = priceSlippage(amount, future.asks, 2)
    call_cost = priceSlippage(amount, call.bids, 2)
    strike_cost = amount.times(strike).round(2)
    profit = call_cost.plus(strike_cost).minus(put_cost).minus(future_cost).round(2)

  }

  // Add fees
  let fees = Big(0);
  fees = fees.plus(amount.times(index).times(0.00075)).round(2) // future fees
  fees = fees.plus(Math.min(put_cost.times(0.125), index.times(amount).times(0.0004))).round(2) // put fees
  fees = fees.plus(Math.min(call_cost.times(0.125), index.times(amount).times(0.0004))).round(2) // call fees

  profit = profit.minus(fees).round(2)

  return profit
}
