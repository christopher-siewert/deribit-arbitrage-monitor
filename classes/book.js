const binarySearch = require('../functions/utils.js');

class Book {
  constructor(price_currency = 'USD', ammount_currency = 'BTC') {
    this.bids = []
    this.asks = []
    this.price_currency = price_currency
    this.ammount_currency = ammount_currency
  }
  modify_order(type, isBid, price, amount=0) {
    let orders = isBid ? this.bids : this.asks
    let compare = isBid ? (a, b) => b - a.price : (a, b) => a.price - b
    let index = binarySearch(orders, price, compare)
    switch (type) {
      case "new":
        orders.splice(index, 0, new Order(price, amount))
        break
      case "delete":
        if (orders[index] && orders[index].price == price) {
          orders.splice(index, 1)
        }
        break
      case "change":
        if (orders[index]) {
          orders[index].amount = amount
        }
        break
    }
  }
}

class Order {
  constructor(price, amount) {
    this.price = price
    this.amount = amount
  }
}

module.exports = { Order, Book }
