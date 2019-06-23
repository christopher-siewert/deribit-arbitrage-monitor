const priceSlippage = require('./priceSlippage');

let amount, orders, decimals

test('single bid', () => {
  amount = 0.1
  orders = [[100,1],[50,3]]
  decimals = 2
  expect(priceSlippage(amount, orders, decimals).toString()).toBe('10');
});

test('single ask', () => {
  amount = 0.1
  orders = [[50,1],[100,3]]
  decimals = 2
  expect(priceSlippage(amount, orders, decimals).toString()).toBe('5');
});

test('double bid', () => {
  amount = 2
  orders = [[100,1],[50,3]]
  decimals = 2
  expect(priceSlippage(amount, orders, decimals).toString()).toBe('150');
});

test('double ask', () => {
  amount = 2
  orders = [[50,1],[100,3]]
  decimals = 2
  expect(priceSlippage(amount, orders, decimals).toString()).toBe('150');
});

test('5 bid', () => {
  amount = 5
  orders = [[102,1],[101,1],[100,1],[99,1],[98,1]]
  decimals = 2
  expect(priceSlippage(amount, orders, decimals).toString()).toBe('500');
});

test('5 ask', () => {
  amount = 5
  orders = [[98,1],[99,1],[100,1],[101,1],[102,1]]
  decimals = 2
  expect(priceSlippage(amount, orders, decimals).toString()).toBe('500');
});

test('0 amount', () => {
  amount = 0
  orders = [[98,1],[99,1],[100,1],[101,1],[102,1]]
  decimals = 2
  expect(priceSlippage(amount, orders, decimals).toString()).toBe('0');
});

test('0 orders', () => {
  amount = 5
  orders = []
  decimals = 2
  expect(() => priceSlippage(amount, orders, decimals)).toThrow();
});

test('neg decimals', () => {
  amount = 5
  orders = [[98,1],[99,1],[100,1],[101,1],[102,1]]
  decimals = -2
  expect(() => priceSlippage(amount, orders, decimals)).toThrow();
});

test('Order overflow', () => {
  amount = 100
  orders = [[98,1],[99,1],[100,1],[101,1],[102,1]]
  decimals = 2
  expect(() => priceSlippage(amount, orders, decimals)).toThrow();
});

test('Pure function', () => {
  amount = 3
  orders = [[98,1],[99,1],[100,1],[101,1],[102,1]]
  decimals = 2
  copyOrders = JSON.parse(JSON.stringify(orders))
  priceSlippage(amount, orders, decimals)
  expect(copyOrders).toEqual(orders);
});
