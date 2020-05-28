const Big = require('big.js');

const { Order, Book, Asset, Market } = require('./classes/book.js');
const optionArbProfit = require('./functions/optionArbProfit.js');
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
  printArbs(market);
})();

function printArbs(market) {
  sorted_assets = market.get_sorted_assets()
  for (const date of Object.values(sorted_assets)) {
    for (const [strike, {call, put}] of Object.entries(date.option)) {
      console.log(calcArb(strike, date.future, call, put))
    }
  }
}

function calcArb(strike, future, call, put) {
 // return optionArbProfit(future.book, call.book, put.book, strike, 5000, 0.1, false)
 return future.book
}
