const Big = require('big.js');
/*
This function determines the value of assets on an exchange including price
slippage. It buys/sells them to the best orders and goes to the next order if
the first isn't big enough to cover the whole amount. Decimals tells you how
many digits to round to (2 for dollars, 8 for bitcoins)
Orders are in format [[price, amount][price, amount]], with best order first
Does not change manipulate orders object, safe to pass objects in
*/
function priceSlippage(amount, orders, decimals) {
  // Error check for zero amount
  if (amount === 0) return 0;
  // Error check for undefined orders
  if (!orders) throw new Error("Orders undefined");
  // Error check for empty orders array
  if (orders.length === 0) throw new Error("Orders is an empty array");
  // Error check for negative decimals number
  if (decimals < 0) throw new Error("Can not pass negative decimals");

  // Initialize variables
  let money = Big(0); // Starts at 0 and will add up the money value of buy/sell
  let leftover = Big(amount); // The assets I have not yet bought or sold
  let counter = 0; // Counter that goes down orders from best to worst

  // This loop exchanges the leftover assets for the best order
  // If the amount is greater than the best order then loop and move to the next
  while (leftover.gt(0)) {

    // Error check for running out of orders
    if (!orders[counter]) throw new Error("Ran out of orders, amount too large");

    // If the amount of assets is bigger than the best order, exchange the complete value of the best order
    if (leftover.gt(orders[counter][1])) {
      money = money.plus(Big(orders[counter][0]).times(orders[counter][1]))
      // If the amount of the asset is smaller than the best order, exchange the value of the asset.
    } else {
      money = money.plus(leftover.times(orders[counter][0]))
    }
    // Each buy or sell is rounded by the exchange
    money = money.round(decimals)

    // Subtract the order amount from the leftovers to get the remaining leftovers in either case
    leftover = leftover.minus(orders[counter][1])
    // Increment counter to go to the next order
    counter++
  }
  return money
}

module.exports = priceSlippage
