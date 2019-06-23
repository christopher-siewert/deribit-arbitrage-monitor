const Big = require('big.js');

const optionArbProfit = require('./functions/optionArbProfit.js');
const Market = require('./classes/market.js');
const WebSocket = require('ws');

const ws = new WebSocket('wss://www.deribit.com/ws/api/v2');

let market = new Market();

ws.on('open', () => {
  // First get all BTC option instrument names
  getInstruments();
  // Send for a heartbeat connection
  setUpHeartbeat();
});

ws.on('message', data => {
  data = JSON.parse(data);
  if (data.method === 'heartbeat') {
    heartbeat();
  } else if (data.id === 100) { // ID from getInstruments() request;
    sendSubscribe(data.result);
  } else if (data.method === 'subscription') {
    market.incoming(data.params);
    findMostProfitableTrade(data.params.data.timestamp);
  }
});

ws.on('close', (code, reason) => {
  // Remove heartbeat
  clearTimeout(this.pingTimeout);

  // Log stuff
  console.log("WebSocket closed:");
  console.log(code);
  console.log(reason);
});

ws.on('error', error => {
  console.error(error);
});

function getInstruments() {
  // 100 is a special ID that we will use later to test for this info
  let message = {
    "method": "public/get_instruments",
    "params": {
      "currency": "BTC",
      "kind": "option",
      "expired": false,
    },
    "jsonrpc": "2.0",
    "id": 100
  };
  ws.send(JSON.stringify(message));
}

function setUpHeartbeat() {
  // Setup heartbeat for subscription
  let message = {
    "method": "public/set_heartbeat",
    "params": {
      "interval": 30
    },
    "jsonrpc": "2.0",
    "id": 10
  }
  ws.send(JSON.stringify(message));
}

function heartbeat() {
  // clear previous timeout if it exists
  clearTimeout(this.pingTimeout);

  // send test response
  let message = {
    "method": "public/test",
    "params": {},
    "jsonrpc": "2.0",
    "id": 20
  };
  ws.send(JSON.stringify(message));

  // Set new timeout for 30 + 10 seconds
  this.pingTimeout = setTimeout(() => {
    this.terminate();
  }, 30000 + 10000);
}

function sendSubscribe(results) {
  let instruments = [];
  for (let i = 0; i < results.length; i++) {
    instruments[i] = "book." + results[i].instrument_name + ".raw";
  }
  instruments.push("deribit_price_index.btc_usd");
  // Use 100ms because perpetual changes so quickly
  instruments.push("book.BTC-PERPETUAL.100ms");

  // for testing other futures
  instruments.push("book.BTC-28JUN19.100ms");

  let message = {
    "jsonrpc": "2.0",
    "method": "public/subscribe",
    "id": 42,
    "params": {
      "channels": instruments
    }
  };
  ws.send(JSON.stringify(message));
}

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
