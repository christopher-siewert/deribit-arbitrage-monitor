const Big = require('big.js');

const { Order, Book, Asset, Market } = require('./classes/book.js');
const Deribit = require('./classes/deribit.js');
const wait = n => new Promise(r => setTimeout(r, n));

(async () => {

  const deribit = new Deribit();
  await deribit.connect();

  const instruments = await deribit.request(
    "public/get_instruments",
    {
      "currency": "BTC",
      // "kind": "future",
      "expired": false,
    }
  );

  let market = new Market(instruments.result);

  subscribes = []
  for (asset of market.asset_list()) {
    subscribes.push(deribit.subscribe(
      'public',
      `book.${asset}.100ms`
    ))
  }
  await Promise.all(subscribes);
  deribit.on('subscription', (payload) => market.update(payload.data));
  await wait(1000);
  console.log(market.get_same_expiration());
  // sameExpiration(market);
  // console.log(market['BTC-25SEP20-8000-C'].book.bids)
})();


function findMostProfitableTrade(timestamp) {
  // Needs a future and an index
  if (!market.state['BTC-PERPETUAL']) return;
  if (!market.state['btc_usd']) return;

  // Initialize variables
  let future, index, options, call, put, strike, result;

  // Gets top future orders in [price, bitcoin] format
  future = market.convertFuture('BTC-PERPETUAL')

  // Gets all the options that have been added to the order book
  options = market.getOptionNames();

  index = market.state['btc_usd'].price

  // Initialize varaibles for looping through all avalible options
  let topProfit = Big(0);
  let bestTrade, loopProfit, buyCall;

  // loop through all avalible options
  for (let i = 0; i < options.length; i++) {

    // error checks for required put and call
    if (!market.state[options[i] + "-P"]) continue;
    if (!market.state[options[i] + "-C"]) continue;

    // Gets top orders in [price, bitcoin] format
    call = market.convertOption(options[i] + "-C");
    put = market.convertOption(options[i] + "-P");

    // Gets strike number from option name that looks like BTC-3MAY19-6250
    strike = Number(options[i].split('-')[2]);

    // Get profit for this current option buyCall
    loopProfit = optionArbProfit(future, call, put, strike, index, 0.1, true)

    // If it's better than the top profit, make it new top and log trade
    if (Number(loopProfit) > Number(topProfit)) {
      topProfit = loopProfit;
      bestTrade = options[i];
      buyCall = true;
    }

    // Get profit for this current option sell Call
    loopProfit = optionArbProfit(future, call, put, strike, index, 0.1, false)

    // If it's better than the top profit, make it new top and log trade
    if (Number(loopProfit) > Number(topProfit)) {
      topProfit = loopProfit;
      bestTrade = options[i];
      buyCall = false;
    }
  }
  // Now topProfit, bestTrade and buyCall are set.
  console.log(JSON.stringify({timestamp, topProfit:topProfit.toString(), bestTrade, buyCall}));
}
