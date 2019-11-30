# deribit-arbitrage-monitor

This program tracks the Deribit bitcoin derivatives exchange, looking for arbitrage profits.

## Finance Details

There's a financial theory called put call parity. It relates the price of a put option to the price of a call option. You can get more details on [Investopedia](https://www.investopedia.com/terms/p/putcallparity.asp). If the real market prices don't match the put call parity equation, then there is *theoretically* arbitrage opportunities.

Theoretically is emphasized, because even if the market prices diverge from the put call equation, you also have to factor in transaction fees.

I calculated put call parity using the price of the bitcoin perpetual as the spot price. The bitcoin perpetual is a unique derivative not found many places in traditional financial markets. It is best to think of a perpetual as an bitcoin *spot price* matching device. It has incentives to keep the market price very close to the market price of bitcoin itself, thus can be used as spot leverage to complete a call put parity arbitrage transaction.

## Usage

This program searches through every live trading option, and will list options that don't follow the theoretical law, as well as the profit after transaction fees are taken into account.

First install the dependencies with `npm install`.

Run it with `node live-watch.js` and it will continually list out the most profitable arbitrage trades, along with the profits.

I was using it to create logs. So the output is a object with a timestamp, the profit due to the trade, the name of the option involved in the trade, and whether the trade consists of buying a call, selling a put, and shorting the perpetual, or selling a call, buying a put, and going long on the perpetual.

Note, there are extra risks in using a perpetual as spot. The mechanism by which its market price tracks the bitcoin price also makes it more risky to hold. This is just a proof of concept, at best preliminary research into the potential for arbitrage profits. Do not trade off this info.

## Technical Details

I keep a copy of every Deribit option order book in memory, updated through a websocket subscription. The exchange data is held in the `Market` class. Every time new data comes in, it recalculates the profit from an arbitrage trade, and will print out the single most profitable one. It only calculates the smallest option trade amount, 0.1 Bitcoins. Thus, if a trade does come out with positive profit, you might be able to make many trades of the listed option.

## Further Details

Send me an email if you want to know more.
