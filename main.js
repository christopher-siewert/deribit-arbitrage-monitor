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
  console.log(market['BTC-25SEP20-8000-C'].book.bids)
})();
