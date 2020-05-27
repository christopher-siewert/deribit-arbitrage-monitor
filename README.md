# deribit-arbitrage-monitor

This program tracks the Deribit bitcoin derivatives exchange, looking for arbitrage profits.

## Finance Details

There's a financial theory called put call parity. It relates the price of a put option to the price of a call option of the same strike and expiration. Where $C$ is the cost of a call, $P$ is the cost of a put, $X$ is the strike price, $F$ is the forward price and $D$ is the discount factor: $C - P = D(F - X)$.

This relationship comes from the idea of replication in finance. Basically if you find two differnt portfolios that have the same payoffs and risk, then those two different portfolios should be equal in value. Here, buying a call and selling a put, ends up being the exact same as being long a forward contract with forward price $X$. So this combination of a long call and short put is like a synthetic future.

You can get more details on [Wikipedia](https://en.wikipedia.org/wiki/Put%E2%80%93call_parity).

If the real market prices don't match the put call parity equation, then there is *theoretically* arbitrage opportunities.

Theoretically is emphasized, because even if the market prices diverge from the put call equation, you also have to factor in transaction fees.

Deribit has options as well as futures. If the price of a real future, is different from the price of one of these syenthetic futures (long call, short put) then you can make free money by buying the cheap one and selling the expensive one.

So the program looks through prices for futures contracts and options that have the same expiration and calculates if there are any arbitrage profits.

## Usage

This program searches through all live trading options with a matching future, and will list options that don't follow the theoretical law, as well as the profit after transaction fees are taken into account.

First install the dependencies with `npm install`.

Run it with `node live-watch.js` and it will continually list out the most profitable arbitrage trades, along with the profits.

I was using it to create logs. So the output is a object with a timestamp, the profit due to the trade, the name of the option involved in the trade, and whether the trade consists of buying a call, selling a put, and shorting the future, or selling a call, buying a put, and going long on the future.

## Technical Details

I keep a copy of every Deribit option order book in memory, updated through a websocket subscription. The exchange data is held in the `Market` class. Every time new data comes in, it recalculates the profit from an arbitrage trade, and will print out the single most profitable one. It only calculates the smallest option trade amount, 0.1 Bitcoins. Thus, if a trade does come out with positive profit, you might be able to make many trades of the listed option.

## Further Details

Send me an email if you want to know more.
