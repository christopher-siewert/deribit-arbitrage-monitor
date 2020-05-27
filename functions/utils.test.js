const binarySearch = require('../functions/utils.js');
const { Order } = require('../classes/book.js');

test('empty array', () => {
  let A = []
  expect(binarySearch(A, 2)).toBe(0);
});

test('int array, equal val, no cmp', () => {
  let A = [0, 1, 2, 3, 4]
  expect(binarySearch(A, 2)).toBe(2);
});

test('int array, unequal val, no cmp', () => {
  let A = [0, 100, 200, 300, 400]
  expect(binarySearch(A, 50)).toBe(1);
});

test('int array, below min, no cmp', () => {
  let A = [0, 100, 200, 300, 400]
  expect(binarySearch(A, -20)).toBe(0);
});

test('int array, above max, no cmp', () => {
  let A = [0, 100, 200, 300, 400]
  expect(binarySearch(A, 500)).toBe(5);
});

test('Order array', () => {
  let A = [new Order(100, 1), new Order(200, 1), new Order(300, 1), new Order(400, 1)]
  let cmp = (order, target) => order.price - target
  expect(binarySearch(A, 250, cmp)).toBe(2);
});

test('Order array, high to low', () => {
  let A = [new Order(500, 1), new Order(400, 1), new Order(300, 1), new Order(200, 1)]
  let cmp = (order, target) => target - order.price
  expect(binarySearch(A, 450, cmp)).toBe(1);
});
