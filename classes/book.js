const binarySearch = require('../functions/utils.js');

class Order {
  constructor(price, amount) {
    this.price = price
    this.amount = amount
  }
}

class Book {
  constructor() {
    this.bids = []
    this.asks = []
  }
  modify_order(isBid, [type, price, amount]) {
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

class Asset {
  constructor(dic) {
    for (let [key, value] of Object.entries(dic)) {
      this[key] = value
    }
    this.book = new Book();
  }
}

class Market {
  constructor(assets) {
    for (let a of assets) {
      this[a.instrument_name] = new Asset(a)
    }
  }
  asset_list() {
    return Object.keys(this)
  }
  get_expirations() {
    const expirations = new Set()
    for (const asset of Object.values(this)) {
      expirations.add(asset.expiration_timestamp)
    }
    return expirations
  }
  get_sorted_assets() {
    const sets = {}
    for (const asset of Object.values(this)) {
      if (!sets[asset.expiration_timestamp]) {
        sets[asset.expiration_timestamp] = {'future': [], 'option':[]}
      }
      sets[asset.expiration_timestamp][asset.kind].push(asset)
    }
    for (const [key, value] of Object.entries(sets)) {
      if (!value.future.length || !value.option.length) {
        delete sets[key]
      }
    }
    for (const [key, value] of Object.entries(sets)) {
      value.future = value.future[0]
      const strikes = {}
      for (const option of value.option) {
        if (!strikes[option.strike]) {
          strikes[option.strike] = {}
        }
        strikes[option.strike][option.option_type] = option
      }
      value.option = strikes
    }
    return sets
  }
  update({instrument_name, bids, asks}) {
    for (let bid of bids) {
      this[instrument_name].book.modify_order(true, bid)
    }
    for (let ask of asks) {
      this[instrument_name].book.modify_order(false, ask)
    }
  }
}

module.exports = { Order, Book, Asset, Market }
