# Timeline: COMP3207 Coursework 2

The source code for Group H's Timeline game, created for COMP3207 Coursework 2. Project management is done over in the Issues.

Contains the server-side game logic as well as the client-side HTML (written with EJS and powered by Vue 2). [TailwindCSS](https://tailwindcss.com/) is used in this project.

### One-Time Setup

Install the packages into `node_modules/`

```bash
npm install
```

Set up access to CosmosDb ([full instructions](https://www.npmjs.com/package/@azure/cosmos)). Add the `.env` file from our Discord `#links` channel to the top-level folder (same folder as `package.json` is in). The format is:

```
COSMOS_ENDPOINT = "https://your-account.documents.azure.com"
COSMOS_KEY = "<database account masterkey>"
COSMOS_DB_ID = "<database ID>"
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
npm run dev
```

This is what the output should look like:

```
aglen@Andrews-MBP Timeline % npm run dev

> timeline@0.1.0 start
> NODE_ENV=development node main.js

Server listening on port 8080
```

Open http://localhost:8080.

## Counting Lines of Code

```bash
cloc --exclude-dir="node_modules" --include-ext="js,ejs" .
```

## Deploying to GAE

Instructions for arg1g19's machine:

```bash
gcloud app deploy --version test --project timeline-337918 
```

## Server: Updating the Client

These are the socket messages the server can use to update the client.

#### reset

Call this to tell the clients to reset certain variables to their default value, usually at the start of a game (such as 'winner', 'correctlyPlaced', and 'status')

```javascript
socket.on("reset", () => { /* ... */ })

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

#### game_over

Call this to let the clients no the game is over. the username given should represent the winner of the game, correctlyPlaced should be kept count of, and represents every succesful placement of a card

Args:
* `correctlyPlaced` (`Int`): the amount of cards correctly placed during the game, kept track of by the server
* `winner` (`String`): the name of the user who won the game, to be displayed as such on the endgame screen

```javascript
socket.on("game_over", (correctlyPlaced, winner) => { /* ... */ })
```

#### available_decks

The server should call this to let the client know which decks are available to play.

Args:
* `decks` (`Deck[]`): An array of `Deck` objects, each one representing a playable, selectable deck.

```javascript
socket.on("available_decks", decks)
```

#### update_cookie

The server should call this to provide the client with updated cookie data.

Args:
* `data`: An object containing cookie data (username, screenName, decks)

```javascript
socket.on("update_cookie", data => {/* ... */})
```

#### login_error

The server should call this to inform the client of a login, sign-up or account settings update error.

Args:
* `error` (`String`): A string describing the error returned by the login/sign-up/account update attempt.

```javascript
socket.on("login_error", error => {/* ... */})
```

#### account_update_success

The server should call this to inform the client of a successful account settings update.

```javascript
socket.on("account_update_success", () => { /* ... */ })
```

## Server: Listening for Client Updates

These are the socket messages the client will use to update the server.

#### available_decks

Called when the client wants to receive all the decks that are available to be played. The server should respond by emitting `available_decks` on the same socket. If the user is connected and sends it's user info, the server should also respond with `available_custom_decks` with the user specific decks.

Args:
* `user` (`Json`): a Json containing the player information (such as user.password, and user.username)

```javascript
socket.emit("available_decks")
socket.emit("available_decks", user)
```

#### select_deck

Called when the client wants to update the deck with which the game will be played.

Args:
* `id` (`String`): The unique ID of the selected deck.

```javascript
socket.emit("select_deck", id)
```

#### create_deck

Called when the client wants to create a new deck, to do so, they first need select a Json file containing the pertinent information. The server should then parse that file, and add it to the database.

Args:
* `deckJson` (`Json`): the Json file sent by the user containing the deck information
* `userJson` (`Json`): a Json containing the player information (such as user.password, and user.username)

```javascript
socket.emit("create_deck", deckJson, userJson)
```

#### hand_size

Called when the client wants to set the number of cards that should be dealt to each player when a game starts.

Args:
* `handSize` (`Number`): The number of cards that should be dealt to each player.

```javascript
socket.emit("hand_size", handSize)
```

#### create_game

Called when the client wants to make a new game (when a player loads the `newgame` view).

```javascript
socket.emit("create_game")
```

#### register_with_game

Called when a the `game` view is loaded (i.e. someone joins a game).

Args:
* `gameID` (`String`): the unique ID of the game that this client would like to join.

```javascript
socket.emit("register_with_game", gameID)
```

#### register_username

Called when a player finishes entering their username.

Args:
* `username` (`String`): the username that should be assigned to this player.

```javascript
socket.emit("register_username", username)
```

#### start_game

Called by the admin player when they decide to start the game.

```javascript
socket.emit("start_game")
```

#### restart_game

Called by the admin player once the game is already over, and they decide to start the game over again

```javascript
socket.emit("restart_game")
```

#### leave_game

Called by any player once the game is already over, and they click on 'exit game'. Removes them from the game and updates every player;

* `gameID` (`String`): the unique ID of the game that this client would like to leave.

```javascript
socket.emit("leave_game", gameID)
```

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
socket.emit("card_placed", id, index)
```

#### player_login

Called by the client when they attempt a login.

Args:
* `username`: The username input to the login form
* `password`: The password input to the login form

```javascript
socket.emit("player_login", username, password)
```

#### player_signup

Called by the client when they attempt to sign-up.

Args:
* `username`: The username input to the sign-up form
* `password`: The password input to the sign-up form

```javascript
socket.emit("player_signup", username, password)
```

#### account_update

Called by the client when they change they click the submit changes button in the account settings page.

Args:
* `data`: An Object containing changes input to the account settings page.

```javascript
socket.emit("account_update", {username:...,screenName:...,oldPassword:...,newPassword:...})
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

### Deck

Represents a deck of cards (e.g. for the game creation page).

```javascript
{
    id: String                  // Unique across all decks
    name: String                // The name of the deck
}
```
