const optionArbProfit = require('./optionArbProfit');

let future, call, put, strike, index, amount, buyCall;

test('bad amount', () => {
  future = {
    bids: [[5000, 3]],
    asks: [[5100, 3]]
  };
  call = {
    bids: [[200, 5]],
    asks: [[250, 1]]
  };
  put = {
    bids: [[500, 5]],
    asks: [[550, 1]]
  };
  index = 5050;
  strike = 5000;
  amount = -3;
  buyCall = true;
  expect(() => optionArbProfit(future, call, put, strike, index, amount, buyCall))
  .toThrow("Amount must be greater than 0.1");
});

test('bad index', () => {
  future = {
    bids: [[5000, 3]],
    asks: [[5100, 3]]
  };
  call = {
    bids: [[200, 5]],
    asks: [[250, 1]]
  };
  put = {
    bids: [[500, 5]],
    asks: [[550, 1]]
  };
  index = undefined;
  strike = 5000;
  amount = 0.1;
  buyCall = true;
  expect(() => optionArbProfit(future, call, put, strike, index, amount, buyCall))
  .toThrow("Undefined index");
});

test('no call asks', () => {
  future = {
    bids: [[5000, 3]],
    asks: [[5100, 3]]
  };
  call = {
    bids: [[200, 1]],
    asks: []
  };
  put = {
    bids: [[500, 5]],
    asks: [[550, 1]]
  };
  index = 5000;
  strike = 5000;
  amount = 0.1;
  buyCall = true;
  expect(optionArbProfit(future, call, put, strike, index, amount, buyCall).toString()).toBe('0');
});

test('no put asks', () => {
  future = {
    bids: [[5000, 3]],
    asks: [[5100, 3]]
  };
  call = {
    bids: [[200, 1]],
    asks: [[250, 1]]
  };
  put = {
    bids: [[500, 5]],
    asks: []
  };
  index = 5000;
  strike = 5000;
  amount = 0.1;
  buyCall = false;
  expect(optionArbProfit(future, call, put, strike, index, amount, buyCall).toString()).toBe('0');
});

test('no future asks', () => {
  future = {
    bids: [[5000, 3]],
    asks: []
  };
  call = {
    bids: [[200, 1]],
    asks: [[250, 1]]
  };
  put = {
    bids: [[500, 5]],
    asks: [[550, 5]]
  };
  index = 5000;
  strike = 5000;
  amount = 0.1;
  buyCall = false;
  expect(optionArbProfit(future, call, put, strike, index, amount, buyCall).toString()).toBe('0');
});

test('single orders', () => {
  future = {
    bids: [[5000, 3]],
    asks: [[5100, 3]]
  };
  call = {
    bids: [[200, 5]],
    asks: [[250, 1]]
  };
  put = {
    bids: [[500, 5]],
    asks: [[550, 1]]
  };
  index = 5050;
  strike = 5000;
  amount = 0.1;
  buyCall = true;
  expect(optionArbProfit(future, call, put, strike, index, amount, buyCall).toString()).toBe('24.22');
});

test('5 orders', () => {
  future = {
    bids: [[5002,1],[5001,1],[5000,1],[4999,1],[4998,1]],
    asks: [[4998,1],[4999,1],[5000,1],[5001,1],[5002,1]]
  };
  call = {
    bids: [[102,1],[101,1],[100,1],[99,1],[98,1]],
    asks: [[98,1],[99,1],[100,1],[101,1],[102,1]]
  };
  put = {
    bids: [[102,1],[101,1],[100,1],[99,1],[98,1]],
    asks: [[98,1],[99,1],[100,1],[101,1],[102,1]]
  };
  index = 5050;
  strike = 5000;
  amount = 5;
  buyCall = true;
  expect(optionArbProfit(future, call, put, strike, index, amount, buyCall).toString()).toBe('-39.14');
});

test('overflow order', () => {
  future = {
    bids: [[5002,1],[5001,1],[5000,1],[4999,1],[4998,1]],
    asks: [[4998,1],[4999,1],[5000,1],[5001,1],[5002,1]]
  };
  call = {
    bids: [[102,1],[101,1],[100,1],[99,1],[98,1]],
    asks: [[98,1],[99,1],[100,1],[101,1],[102,1]]
  };
  put = {
    bids: [[102,1],[101,1],[100,1],[99,1],[98,1]],
    asks: [[98,1],[99,1],[100,1],[101,1],[102,1]]
  };
  index = 5050;
  strike = 5000;
  amount = 100;
  buyCall = true;
  expect(() => optionArbProfit(future, call, put, strike, index, amount, buyCall))
  .toThrow("Ran out of orders, amount too large");
});

test('pure function', () => {
  future = {
    bids: [[5002,1],[5001,1],[5000,1],[4999,1],[4998,1]],
    asks: [[4998,1],[4999,1],[5000,1],[5001,1],[5002,1]]
  };
  copyFuture = JSON.parse(JSON.stringify(future));
  call = {
    bids: [[102,1],[101,1],[100,1],[99,1],[98,1]],
    asks: [[98,1],[99,1],[100,1],[101,1],[102,1]]
  };
  copyCall = JSON.parse(JSON.stringify(call));
  put = {
    bids: [[102,1],[101,1],[100,1],[99,1],[98,1]],
    asks: [[98,1],[99,1],[100,1],[101,1],[102,1]]
  };
  copyPut = JSON.parse(JSON.stringify(put));
  index = 5050;
  strike = 5000;
  amount = 3;
  buyCall = true;
  optionArbProfit(future, call, put, strike, index, amount, buyCall);
  expect(future).toEqual(copyFuture);
  expect(call).toEqual(copyCall);
  expect(put).toEqual(copyPut);
});

test('rounding issues', () => {
  future = {
    bids: [[5000.01, 3]],
    asks: [[5100.01, 3]]
  };
  call = {
    bids: [[200.01, 5]],
    asks: [[250.01, 1]]
  };
  put = {
    bids: [[500.01, 5]],
    asks: [[550.01, 1]]
  };
  index = 5050.01;
  strike = 5000.01;
  amount = 0.1;
  buyCall = true;
  expect(optionArbProfit(future, call, put, strike, index, amount, buyCall).toString()).toBe('24.22');
});

test('sell call single order', () => {
  future = {
    bids: [[4000, 3]],
    asks: [[4001, 3]]
  };
  call = {
    bids: [[200, 5]],
    asks: [[201, 1]]
  };
  put = {
    bids: [[250, 5]],
    asks: [[251, 1]]
  };
  index = 4000;
  strike = 5000;
  amount = 0.1;
  buyCall = false;
  expect(optionArbProfit(future, call, put, strike, index, amount, buyCall).toString()).toBe('94.18');
});
