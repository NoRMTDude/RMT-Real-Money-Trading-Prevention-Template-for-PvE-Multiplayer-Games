# RMT-Real-Money-Trading-Prevention-Template-for-PvE-Multiplayer-Games

A design template for co-op/PvE multiplayer games that completely avoids RMT (real-money trading), while still allowing player-to-player trading.

Instead of making RMT harder to do, this template makes it pointless: every item can be bought at a fixed price, and the only thing players can freely edit is their locally stored currency.

> **About this template:** The code and docs here were generated with AI. I'm not a programmer. I only have the concept, so please treat this as an idea plus a rough example, not production-ready code. It hasn't been tested at scale, and feedback and fixes are welcome.

> **Why I made this:** More and more solo developers are building multiplayer games with AI, and many get hit by cheats and RMT/boosting services. The result is overloaded servers and limits that make the game worse for people who just want to play, while developers spend their time handling ban appeals from people putting on Oscar-worthy performances. Instead of fighting sellers, this template tries to remove the reason to buy and sell in the first place.

> **Free to use:** Anyone is welcome to modify or build on this concept to create better game environments. No need to ask for permission. This is just a concept, and it's completely free.

## The problem

RMT, boosting, and "I'll farm it for you" services only make money when items are scarce and hard to get. Trying to stop sellers is a never-ending fight. So is trying to stop cheats and bots, or handling ban appeals from people giving Oscar-worthy performances. It all wastes a developer's time and energy. Raising the cost (for example, to account trading) doesn't help either: sellers just farm on the buyers' accounts, and server load doesn't go down.

## The idea

1. Every item can be bought in the shop/auction house at a fixed price set by the developer, no matter what affixes it has. Unlimited stock, always available, event items included.
2. If pricing every affix combination is too much work, use a formula (for example, based on affix values). The developer decides the price, never supply or luck.
3. Buying uses currency that is stored locally, and players can freely edit it.
4. Publish an official tutorial or add a built-in option for editing currency.
5. Optional: once a player obtains an item type through gameplay, its shop price drops a little for them. It only goes down, never up.
6. Build sharing: players can view anyone's build, and save it or buy the whole thing in one click. A popular builds list works the same way. Nobody can sell "I'll set up your build for you", since the game already does it for free.
7. Player-to-player trading can stay on. Since everything is buyable by anyone and currency is editable, there is nothing worth paying real money for. Show a big notice at game start saying that everything is available in the shop, currency can be edited, and paying real money for items or currency is a scam. Players must hold a button for 10 seconds to confirm, with a "don't show again" checkbox.

## Why it should work

Since anyone can get anything whenever they want, there is nothing left to sell. Selling currency, boosting, build setup services, and farming services all lose their customers. Players who enjoy earning currency by playing can still do that. The server doesn't have to track or validate currency, and bots farming 24/7 lose their purpose, so the load should drop.

## Rules that keep it airtight

- Anything obtainable only from drops or limited-time events brings scarcity back, and RMT with it. Everything must also be buyable in the shop, and event items must stay buyable after the event ends.
- Every update must keep the player's current currency balance. Otherwise players have to re-edit after every patch and may pay someone else to do it.
- Don't give drops a visible "hand-farmed" mark or any other showable proof of luck or effort. Anything that can be screenshotted and compared becomes a flex item, and flex items can be sold.

## Scope

- Good fit: co-op and PvE games.
- Not a fit: competitive PvP, where cheating can hurt other players directly. Combat and positions still need server validation.

## What the server still does

- Stores item ownership.
- Checks that a purchased item is on the price list and that the price is the developer's price.
- Does not track or validate currency.

## Not solved by this template

Scams against new players, repackaged copies, and malware-bundled "trainers" are not RMT, so this template doesn't fully address them. Clear messaging in the game and on the official page helps. One way to do it: on first login, show a big notice (for example: everything is available in the shop, currency can be edited, and paying real money for items or currency is a scam), and make players hold a button for 10 seconds to confirm they've seen it. Add a "don't show again" checkbox for players who already know.
## Contributing

This repo only contains the concept and a template generated with AI. I don't know any programming, so I can't review or maintain code. Please feel free to extend the concept in any way that makes game environments better. Forking and building your own version is encouraged, and no permission is needed.

## License

MIT
