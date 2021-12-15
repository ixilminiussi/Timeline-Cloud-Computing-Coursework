# Timeline: COMP3207 Coursework 2

The source code for Group H's Timeline game, created for COMP3207 Coursework 2. Project management is done over in the Issues.

Contains the server-side game logic as well as the client-side HTML (written with EJS and powered by Vue 2). [TailwindCSS](https://tailwindcss.com/) is used in this project.

### One-Time Setup

Install the packages into `node_modules/`

```bash
npm install
```

Set up access to CosmosDb ([full instructions](https://www.npmjs.com/package/@azure/cosmos)). Create a `.env` file in the project root and copy in the following. Replace the values of the variables with the values from your Azure portal:

```
COSMOS_ENDPOINT = "https://your-account.documents.azure.com"
COSMOS_KEY = "<database account masterkey>"
```

### Every Time

To start development, first start TailwindCSS by running:

```bash
npx tailwindcss -o public/main.css --watch
```

This is what the output should look like:

```
aglen@Andrews-MBP Timeline % npx tailwindcss -o public/main.css --watch                        

Rebuilding...
Done in 82ms.
```

> **Warning:** It should not take more than 500ms to rebuild. If that's the case, you're probably still on Tailwind 2. Run `npm install` to update to Tailwind 3, then try this step again.

Then, *in another shell*, start the server with:

```bash
npm run start
```

This is what the output should look like:

```
aglen@Andrews-MBP Timeline % npm run start

> timeline@0.1.0 start
> node main.js

Server listening on port 8080
```

Open http://localhost:8080.

## Server: Updating the Client

These are the socket messages the server can use to update the client.

#### deal_hand

Call this once at the start of the game to give the player a hand of cards from the game deck. This replaces the current hand.

Args:
* `cards`: An array of `Card` objects to place in the player's hand.

```javascript
socket.on("deal_hand", (cards) => { /* ... */ })
```

#### deal_replacement

Call this to add a card to a player's hand, e.g. in response to an incorrect move. This may be an animated transition so prefer this over `deal_hand` when inserting only a single card.

Args:
* `card`: A `Card` object to add to the hand.

```javascript
socket.on("deal_card", (card) => { /* ... */ })
```

#### overwrite_timeline

Call this to update the client's entire record of the current timeline with no animation. This will be useful if, for example, a player reconnects mid-game.

Args:
* `cards`: An array of `Card` objects to place on the canvas as 'already played'.

```javascript
socket.on("overwrite_timeline", (cards) => { /* ... */ })
```

#### insert_card

Call this to insert a single card into the timeline&mdash;for example, when someone else has made a move and you need to update all the other players. The addition may be animated, so prefer this method over `overwrite_timeline` if only one card is being inserted.

Args:
* `card`: A single `Card` object to add to the timeline. 
* `index`: An integer. The index in the timeline into which this card was inserted.

```javascript
socket.on("insert_card", (card, index) => { /* ... */ })
```

#### overwrite_players

Call this to update the list of players the client holds. The list of players should remain in a stable order across successive calls. Use this method if a new player joins or after a player makes a move that decreases the number of cards in their hand.

Args:
* `players`: An array of `Player` objects with information about all players in this game.

```javascript
socket.on("overwrite_players", (players) => { /* ... */ })
```

#### set_current_turn

Call this to let the client know which player's turn it is. The username given should be present in the current list of players the client keeps.

Args:
* `username`: The username of the player whose turn it is.

```javascript
socket.on("set_current_turn", (username) => { /* ... */ })
```

## Server: Listening for Client Updates

These are the socket messages the client will use to update the server.

#### card_placed

Called when the current player drops a card onto the timeline. The server should:
* retrieve the information about the card
* figure out whether it was placed in the correct position (see `_isAbsolutelyOrdered` in _game.js_)
* Update all clients by emitting `insert_card`
* If incorrect, send a replacement card with `deal_card`
* Update the clients with the new player states
* Update the clients with the new current player

The client provides less information than it actually has because it's untrustworthy source of information.

Args:
* `id`: The identifier of the card that was placed
* `index`: The index in the timeline at which the card was placed

```javascript
socket.emit("card_placed", card.id, cardIndex)
```

## Client Object Schemas

### Card

The card object represents a card in the timeline or in a player's hand. Note that the `absoluteOrder` property should be the order of the card in the whole deck, not just the cards being used in the game (to account for replacement).

```javascript
{
    id: String,                 // The unique identifier of this card
    frontValue: String,         // The 'event' that the player will see
    backValue: String,          // The 'answer' that will be revealed
    absoluteOrder: Number       // The order of this card in the whole deck
}
```

### Player

The player object represents everything the client needs to know about a player.

```javascript
{
    username: String            // Unique within any particular game
    cardsRemaining: Number      // The number of cards in this player's hand
}
```