// This is the market data object
// It updates itself when passed the subscription events from deribit

module.exports = class Market
{
  constructor()
  {
    this.state = {}
  }
  incoming(e)
  {
    // every subscription event gets passed through incoming
    
    // e.channel looks like "book.BTC-28JUN19-1500-P.raw"
    let channel = e.channel.split('.');

    // This is all price index data
    if (channel[0] === 'deribit_price_index') {

      // If there is already a price index,
      // and data is older than current return
      if (this.state[e.data.index_name] && this.state[e.data.index_name].timestamp > e.data.timestamp) return;

      // Updates price index
      this.state[e.data.index_name] = e.data

      // Don't need index name again
      delete this.state[e.data.index_name].index_name

    } else if (channel[0] === 'book') { // This is all book data
      this.update(e.data);
    }
  }
  // Update state based on event
  update(incoming)
  {
    // If there is no previous entry, just set this.state to new data
    if (!this.state[incoming.instrument_name]) {

      // each array entry has a "new" in it that we want to shift off
      for (let i = 0; i < incoming.bids.length; i++) {
        incoming.bids[i].shift()
      }
      for (let i = 0; i < incoming.asks.length; i++) {
        incoming.asks[i].shift()
      }
      // Set market data for that instrument
      this.state[incoming.instrument_name] = incoming

      // Don't need name again
      delete this.state[incoming.instrument_name].instrument_name

    } else {
      // If there is a previous entry

      // Do some continuity checking to make sure ids match
      if (this.state[incoming.instrument_name].change_id != incoming.prev_change_id) {
        // throw new Error("ID's don't match");
      }
      // First thing to do is to update change ids/timestamp
      this.state[incoming.instrument_name].timestamp = incoming.timestamp;
      this.state[incoming.instrument_name].change_id = incoming.change_id;
      this.state[incoming.instrument_name].prev_change_id = incoming.prev_change_id;

      // Then update bids
      // bids look like ['delete', 0.2165, 0]
      for (let i = 0; i < incoming.bids.length; i++) {
        switch (incoming.bids[i][0]) {
          case 'new':
            incoming.bids[i].shift()
            if (this.state[incoming.instrument_name].bids.length === 0) {
              this.state[incoming.instrument_name].bids.push(incoming.bids[i]);
            } else {
              for (let counter = 0; counter <= this.state[incoming.instrument_name].bids.length; counter++) {
                if (!this.state[incoming.instrument_name].bids[counter]) {
                  this.state[incoming.instrument_name].bids.push(incoming.bids[i]);
                  break;
                }
                if (this.state[incoming.instrument_name].bids[counter][0] < incoming.bids[i][0]) {
                  this.state[incoming.instrument_name].bids.splice(counter, 0, incoming.bids[i]);
                  break;
                }
              }
            }
            break;
          case 'delete':
            incoming.bids[i].shift()
            for (let counter = 0; counter < this.state[incoming.instrument_name].bids.length; counter++) {
              if (this.state[incoming.instrument_name].bids[counter][0] === incoming.bids[i][0]) {
                this.state[incoming.instrument_name].bids.splice(counter, 1);
                break;
              }
            }
            break;
          case 'change':
            incoming.bids[i].shift()
            for (let counter = 0; counter < this.state[incoming.instrument_name].bids.length; counter++) {
              if (this.state[incoming.instrument_name].bids[counter][0] === incoming.bids[i][0]) {
                this.state[incoming.instrument_name].bids[counter] = incoming.bids[i];
                break;
              }
            }
            break;
          default:
            throw new Error("Tried to update order but not new change or delete");
        }
      }

      // Then update asks
      // asks look like ['delete', 0.2165, 0]
      for (let i = 0; i < incoming.asks.length; i++) {
        switch (incoming.asks[i][0]) {
          case 'new':
            incoming.asks[i].shift()
            if (this.state[incoming.instrument_name].asks.length === 0) {
              this.state[incoming.instrument_name].asks.push(incoming.asks[i]);
            } else {
              for (let counter = 0; counter <= this.state[incoming.instrument_name].asks.length; counter++) {
                if (!this.state[incoming.instrument_name].asks[counter]) {
                  this.state[incoming.instrument_name].asks.push(incoming.asks[i]);
                  break;
                }
                if (this.state[incoming.instrument_name].asks[counter][0] > incoming.asks[i][0]) {
                  this.state[incoming.instrument_name].asks.splice(counter, 0, incoming.asks[i]);
                  break;
                }
              }
            }
            break;
          case 'delete':
            incoming.asks[i].shift()
            for (let counter = 0; counter < this.state[incoming.instrument_name].asks.length; counter++) {
              if (this.state[incoming.instrument_name].asks[counter][0] === incoming.asks[i][0]) {
                this.state[incoming.instrument_name].asks.splice(counter, 1);
                break;
              }
            }
            break;
          case 'change':
            incoming.asks[i].shift()
            for (let counter = 0; counter < this.state[incoming.instrument_name].asks.length; counter++) {
              if (this.state[incoming.instrument_name].asks[counter][0] === incoming.asks[i][0]) {
                this.state[incoming.instrument_name].asks[counter] = incoming.asks[i];
                break;
              }
            }
            break;
          default:
            throw new Error("Tried to update order but not new change or delete");
        }
      }
    }
  }
  // This takes an instrument name and gets the bids and asks in [dollar, bitcoin] form
  convertFuture(prop)
  {
    // check if it's in state
    if (!this.state[prop]) throw new Error("Future not found in state");
    if (!this.state['btc_usd']) throw new Error("Need an index in state");

    // Initialize variables
    let bids = [];
    let asks = [];

    // Get only top 20 bids and asks and convert to [dollars, bitcoins]
    // Currently this.state bids are in [dollars, dollars]
    for (let i = 0; i < this.state[prop].bids.length; i++) {
      // Initialize bids as array of arrays
      bids[i] = [];
      // item by item copy to prevent change of this.state
      bids[i][0] = this.state[prop].bids[i][0]
      bids[i][1] = this.state[prop].bids[i][1] / this.state['btc_usd'].price
      bids[i][1] = Math.round(bids[i][1] * (10**8)) / (10**8)
      if (i === 19) break;
    }

    // now asks
    for (let i = 0; i < this.state[prop].asks.length; i++) {
      // Initialize asks as array of arrays
      asks[i] = [];
      // item by item copy to prevent change of this.state
      asks[i][0] = this.state[prop].asks[i][0]
      asks[i][1] = this.state[prop].asks[i][1] / this.state['btc_usd'].price
      asks[i][1] = Math.round(asks[i][1] * (10**8)) / (10**8)
      if (i === 19) break;
    }
    return {
      bids,
      asks
    }
  }
  // This takes an instrument name and gets the bids and asks in [dollar, bitcoin] form
  convertOption(prop)
  {
    // check if it's in state
    if (!this.state[prop]) throw new Error("Option not found in state");
    if (!this.state['btc_usd']) throw new Error("Need an index in state");

    let bids = [];
    let asks = [];

    // Get only top 20 bids and asks and convert to [dollars, bitcoins]
    // Currently this.state bids are in [bitcoins, bitcoins]
    for (let i = 0; i < this.state[prop].bids.length; i++) {
      // Initialize bids as array of arrays
      bids[i] = [];
      // item by item copy to prevent change of this.state
      bids[i][0] = this.state[prop].bids[i][0] * this.state['btc_usd'].price
      bids[i][0] = Math.round(bids[i][0] * 100) / 100
      bids[i][1] = this.state[prop].bids[i][1]
      if (i === 19) break;
    }

    // now asks
    for (let i = 0; i < this.state[prop].asks.length; i++) {
      // Initialize asks as array of arrays
      asks[i] = [];
      // item by item copy to prevent change of this.state
      asks[i][0] = this.state[prop].asks[i][0] * this.state['btc_usd'].price
      asks[i][0] = Math.round(asks[i][0] * 100) / 100
      asks[i][1] = this.state[prop].asks[i][1]
      if (i === 19) break;
    }
    return {
      bids,
      asks
    }
  }
  getOptionNames()
  {
    let options = Object.keys(this.state)

    // remove future
    let index = options.indexOf('BTC-PERPETUAL');
    if (index > -1) {
        options.splice(index, 1);
    }
    // remove index
    index = options.indexOf('btc_usd');
    if (index > -1) {
        options.splice(index, 1);
    }
    // Remove all ending -C and -Ps
    for (let i = 0; i < options.length; i++) {
      options[i] = options[i].split("-");
      options[i].splice(3, 1);
      options[i] = options[i].join('-')
    }
    let uniq = [...new Set(options)];
    return uniq
  }
};
