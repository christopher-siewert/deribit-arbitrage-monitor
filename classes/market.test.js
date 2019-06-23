const Market = require('./market');

test("price index updates", () => {
  let events = [
    '{"channel":"deribit_price_index.btc_usd","data":{"timestamp":1000,"price":5000,"index_name":"btc_usd"}}',
    '{"channel":"deribit_price_index.btc_usd","data":{"timestamp":1001,"price":5100,"index_name":"btc_usd"}}',
    '{"channel":"deribit_price_index.btc_usd","data":{"timestamp":1002,"price":5200,"index_name":"btc_usd"}}'
  ];

  let m = new Market();
  events.forEach(value => m.incoming(JSON.parse(value)));
  let expectedState = {
    "btc_usd": {
      "timestamp": 1002,
      "price": 5200
    }
  };
  expect(m.state).toEqual(expectedState);
});


test("old price index doesn't update", () => {
  let events = [
    '{"channel":"deribit_price_index.btc_usd","data":{"timestamp":1556615813647,"price":5153.31,"index_name":"btc_usd"}}',
    '{"channel":"deribit_price_index.btc_usd","data":{"timestamp":1,"price":5100.01,"index_name":"btc_usd"}}'
  ];

  let m = new Market();
  events.forEach(value => m.incoming(JSON.parse(value)));
  let expectedState = {
    "btc_usd": {
      "timestamp": 1556615813647,
      "price": 5153.31
    }
  };
  expect(m.state).toEqual(expectedState);
});

test("market book set", () => {
  let events = [
    '{"channel":"deribit_price_index.btc_usd","data":{"timestamp":1000,"price":5000,"index_name":"btc_usd"}}',
    '{"channel":"book.BTC-3MAY19-6250-P.raw","data":{"timestamp":1001,"instrument_name":"BTC-3MAY19-6250-P","change_id":1001,"bids":[["new",0.21,2]],"asks":[["new",0.218,2]]}}'
  ];

  let m = new Market();
  events.forEach(value => m.incoming(JSON.parse(value)));
  let expectedState = {
    "btc_usd": {
      "timestamp": 1000,
      "price": 5000
    },
    "BTC-3MAY19-6250-P": {
      "change_id": 1001,
      "timestamp":1001,
      "bids": [[0.21, 2]],
      "asks": [[0.218, 2]]
    }
  };
  expect(m.state).toEqual(expectedState);
});

test("market book update", () => {
  let events = [
    '{"channel":"deribit_price_index.btc_usd","data":{"timestamp":1000,"price":5000,"index_name":"btc_usd"}}',
    '{"channel":"book.BTC-3MAY19-6250-P.raw","data":{"timestamp":1001,"instrument_name":"BTC-3MAY19-6250-P","change_id":1001,"bids":[["new",0.2,2],["new",0.1,2]],"asks":[["new",0.3,2],["new",0.4,1]]}}',
    '{"channel":"book.BTC-3MAY19-6250-P.raw","data":{"timestamp":1002,"instrument_name":"BTC-3MAY19-6250-P","change_id":1002,"bids":[["change",0.2,4], ["new",0.3,0.1], ["delete",0.1,0]],"asks":[["change",0.4,4], ["new",0.6,0.1], ["delete",0.3,0]]}}'
  ];

  let m = new Market();
  events.forEach(value => m.incoming(JSON.parse(value)));
  let expectedState = {
    "btc_usd": {
      "timestamp": 1000,
      "price": 5000
    },
    "BTC-3MAY19-6250-P": {
      "change_id": 1002,
      "timestamp":1002,
      "bids": [[0.3, 0.1],[0.2, 4]],
      "asks": [[0.4, 4], [0.6, 0.1]]
    }
  };
  expect(m.state).toEqual(expectedState);
});

test("convertOption pure function", () => {
  let events = [
    '{"channel":"deribit_price_index.btc_usd","data":{"timestamp":1000,"price":5000,"index_name":"btc_usd"}}',
    '{"channel":"book.BTC-3MAY19-6250-P.raw","data":{"timestamp":1001,"instrument_name":"BTC-3MAY19-6250-P","change_id":1001,"bids":[["new",0.2,2],["new",0.1,2]],"asks":[["new",0.3,2],["new",0.4,1]]}}',
    '{"channel":"book.BTC-3MAY19-6250-P.raw","data":{"timestamp":1002,"instrument_name":"BTC-3MAY19-6250-P","change_id":1002,"bids":[["change",0.2,4], ["new",0.3,0.1], ["delete",0.1,0]],"asks":[["change",0.4,4], ["new",0.6,0.1], ["delete",0.3,0]]}}'
  ];

  let m = new Market();
  events.forEach(value => m.incoming(JSON.parse(value)));

  // Check for pure function
  stateCopy = JSON.parse(JSON.stringify(m.state));
  m.convertOption('BTC-3MAY19-6250-P');
  expect(m.state).toEqual(stateCopy);
});

test("convertOption proper output", () => {
  let events = [
    '{"channel":"deribit_price_index.btc_usd","data":{"timestamp":1000,"price":5000,"index_name":"btc_usd"}}',
    '{"channel":"book.BTC-3MAY19-6250-P.raw","data":{"timestamp":1001,"instrument_name":"BTC-3MAY19-6250-P","change_id":1001,"bids":[["new",2,2],["new",1,2]],"asks":[["new",1,2],["new",2,1]]}}'
  ];

  let m = new Market();
  events.forEach(value => m.incoming(JSON.parse(value)));

  let expected = {
    bids:[[10000, 2], [5000, 2]],
    asks:[[5000, 2],[10000, 1]]
  };
  let result = m.convertOption('BTC-3MAY19-6250-P');
  expect(result).toEqual(expected);
});

test("convertFuture pure function", () => {
  let events = [
    '{"channel":"deribit_price_index.btc_usd","data":{"timestamp":1000,"price":5000,"index_name":"btc_usd"}}',
    '{"channel":"book.BTC-PERPETUAL.100ms","data":{"timestamp":1556615813630,"instrument_name":"BTC-PERPETUAL","change_id":11529946036,"bids":[["new",5147.5,182370],["new",5147.25,2000],["new",5147,2020]],"asks":[["new",5147.75,183240],["new",5148,2230],["new",5148.25,24350],["new",5148.5,7220]]}}',
    '{"channel":"book.BTC-3MAY19-6250-P.raw","data":{"timestamp":1002,"instrument_name":"BTC-3MAY19-6250-P","change_id":1002,"bids":[["change",0.2,4], ["new",0.3,0.1], ["delete",0.1,0]],"asks":[["change",0.4,4], ["new",0.6,0.1], ["delete",0.3,0]]}}'
  ];

  let m = new Market();
  events.forEach(value => m.incoming(JSON.parse(value)));

  // Check for pure function
  stateCopy = JSON.parse(JSON.stringify(m.state));
  m.convertFuture('BTC-PERPETUAL');
  expect(m.state).toEqual(stateCopy);
});

test("convertFuture proper output", () => {
  let events = [
    '{"channel":"deribit_price_index.btc_usd","data":{"timestamp":1000,"price":5000,"index_name":"btc_usd"}}',
    '{"channel":"book.BTC-PERPETUAL.raw","data":{"timestamp":1001,"instrument_name":"BTC-PERPETUAL","change_id":1001,"bids":[["new",6000,5000],["new",5000,10000]],"asks":[["new",6000,1000],["new",7000,2500]]}}'
  ];

  let m = new Market();
  events.forEach(value => m.incoming(JSON.parse(value)));

  let expected = {
    bids:[[6000, 1],[5000, 2]],
    asks:[[6000, 0.2],[7000, 0.5]]
  };
  let result = m.convertFuture('BTC-PERPETUAL');
  expect(result).toEqual(expected);
});

test("getOptionNames pure function", () => {
  let events = [
    '{"channel":"deribit_price_index.btc_usd","data":{"timestamp":1000,"price":5000,"index_name":"btc_usd"}}',
    '{"channel":"book.BTC-PERPETUAL.100ms","data":{"timestamp":1556615813630,"instrument_name":"BTC-PERPETUAL","change_id":11529946036,"bids":[["new",5147.5,182370],["new",5147.25,2000],["new",5147,2020]],"asks":[["new",5147.75,183240],["new",5148,2230],["new",5148.25,24350],["new",5148.5,7220]]}}',
    '{"channel":"book.BTC-3MAY19-6250-P.raw","data":{"timestamp":1002,"instrument_name":"BTC-3MAY19-6250-P","change_id":1002,"bids":[["change",0.2,4], ["new",0.3,0.1], ["delete",0.1,0]],"asks":[["change",0.4,4], ["new",0.6,0.1], ["delete",0.3,0]]}}'
  ];

  let m = new Market();
  events.forEach(value => m.incoming(JSON.parse(value)));

  // Check for pure function
  stateCopy = JSON.parse(JSON.stringify(m.state));
  m.getOptionNames();
  expect(m.state).toEqual(stateCopy);
});

test("getOptionNames proper output", () => {
  let events = [
    '{"channel":"book.BTC-3MAY19-6250-P.raw","data":{"timestamp":1556615809649,"instrument_name":"BTC-3MAY19-6250-P","change_id":11529943154,"bids":[["new",0.21,2],["new",0.0015,1],["new",0.001,10],["new",0.0005,1]],"asks":[["new",0.218,2]]}}',
    '{"channel":"book.BTC-3MAY19-6500-C.raw","data":{"timestamp":1556615808605,"instrument_name":"BTC-3MAY19-6500-C","change_id":11529833758,"bids":[],"asks":[["new",0.0005,10],["new",0.001,16.9],["new",0.0015,37],["new",0.002,10],["new",0.0025,10.6]]}}',
    '{"channel":"book.BTC-3MAY19-6250-C.raw","data":{"timestamp":1556615809650,"instrument_name":"BTC-3MAY19-6250-C","change_id":11529833630,"bids":[["new",0.0005,12.4]],"asks":[["new",0.001,17.9],["new",0.0015,34.6],["new",0.002,10],["new",0.0035,10]]}}',
    '{"channel":"book.BTC-3MAY19-6500-P.raw","data":{"timestamp":1556615809649,"instrument_name":"BTC-3MAY19-6500-P","change_id":11529943033,"bids":[["new",0.114,2],["new",0.0005,10.2]],"asks":[["new",0.122,2],["new",0.1395,0.1],["new",0.14,0.1]]}}',
    '{"channel":"book.BTC-3MAY19-6000-P.raw","data":{"timestamp":1556615809650,"instrument_name":"BTC-3MAY19-6000-P","change_id":11529943085,"bids":[["new",0.162,2],["new",0.0005,10.3]],"asks":[["new",0.17,2]]}}'
  ];

  let m = new Market();
  events.forEach(value => m.incoming(JSON.parse(value)));

  let expected = ['BTC-3MAY19-6250', 'BTC-3MAY19-6500', 'BTC-3MAY19-6000'];
  let result = m.getOptionNames();;
  expect(result).toEqual(expected);
});
