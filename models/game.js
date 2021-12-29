const { chill } = require("../utility")

/**
 * Represents and manages a single game of Timeline.
 */
class Game {
  static ID_LENGTH = 6
  static MAX_PLAYERS = 5 // TODO: enforce max players
  static MAX_HAND_SIZE = 5

  static STAGE_LOBBY = "lobby"
  static STAGE_PLAYING = "playing"
  static STAGE_ENDED = "ended"

  constructor(id) {
    this.id = id
    this.creationTime = Date.now()
    this.creatorSocket = null
    this.selectedDeckID = null
    this._players = []
    this._deck = []
    this._originalDeck = []
    this._timeline = []
    this.stage = Game.STAGE_LOBBY // TODO: use stage to disable certain operations
    this.currentPlayerIndex = 0
  }

  registerPlayer(player) {
    this._players.push(player)
    player.game = this
    this._updateClientsWithPlayers()
  }

  registerUsernameForPlayer(player, username) {
    const playerIndex = this._players.findIndex(p => p === player)
    if (playerIndex < 0) {
      this._error("Cannot register username of player outside this game")
      return null
    }

    const existingPlayer = this._players.find(p => p.username === username)
    let migrationInfo = null
    if (existingPlayer) {
      this._log(`${username} already exists in-game, switching to the existing player`)
      migrationInfo = { 
        oldSocket: existingPlayer.socket,
        targetPlayer: existingPlayer,
      }
      existingPlayer.socket = player.socket
      // Remove this player because they're a duplicate of `existingPlayer`.
      this._players.splice(playerIndex, 1) 
    } else {
      player.username = username
    }

    this._updateClientsWithPlayers()
    return migrationInfo
  }

  adminPlayer() {
    if (!this._players.length) {
      return null
    }
    return this._players[0]
  }

  async cardPlaced(player, cardID, index) {
    const card = this._originalDeck.find(c => c.id === cardID)
    if (!card) {
      this._error("Card placed with invalid ID:", cardID)
      return
    }

    const wasPlacedCorrectly = this._timeline
      .map(c => c.absoluteOrder - card.absoluteOrder)
      .every((x, i) => i < index ? (x < 0) : (x > 0))

    // Update clients
    this._players.filter(p => p !== player)
      .forEach(p => p.socket.emit("insert_card", card, index))
    
    player.removeCard(card)

    await chill(2000)

    if (wasPlacedCorrectly) {
      this._log("Card placed correctly")
      this._timeline.splice(index, 0, card)
    } else {
      this._log(`Card placed incorrectly, dealing replacement to ${player.displayName()}`)
      const correctIndex = this._correctInsertionIndex(card, this._timeline)
      this._timeline.splice(correctIndex, 0, card)

      // Deal replacement
      if (this._deck.length) {
        const card = this._deck.shift()
        player.addCard(card)
      } else {
        this._error("Deck is empty, cannot deal replacement card")
      }
    }

    this._updateClientsWithPlayers()

    // Update current turn
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this._players.length
    this._updateClientsWithCurrentTurn()
  }

  async start() {
    this._log("starting")
    this.stage = Game.STAGE_PLAYING
    this._originalDeck = await this._loadSelectedDeck()
    this._deck = [...this._originalDeck]

    if (!this._deck.length) {
      this._error("No cards in deck, aborting game")
      return
    }

    // Place down starting card
    this._timeline = [this._deck.shift()]
    this._updateClientsWithTimeline()

    // Deal hands
    const availableCards = this._deck.length
    const nPlayers = this._players.length
    const handSize = Math.min(Math.floor(availableCards / nPlayers), Game.MAX_HAND_SIZE)
    this._players.forEach(p => p.setCards(this._deck.splice(0, handSize)))
    this._updateClientsWithPlayers()

    // Update current turn
    this.currentPlayerIndex = 0
    this._updateClientsWithCurrentTurn()
  }

  // PRIVATE
  _correctInsertionIndex(card, cards) {
    const indexOfFirstCardAfter = this._timeline.findIndex(c => c.absoluteOrder > card.absoluteOrder)
    return indexOfFirstCardAfter < 0 ? cards.length : indexOfFirstCardAfter
  }

  async _loadSelectedDeck() {
    // TODO: connect to DB
    return [
      { id: "a", frontValue: "Event A", backValue: "1432", absoluteOrder: 1 },
      { id: "b", frontValue: "Event B", backValue: "1500", absoluteOrder: 3 },
      { id: "c", frontValue: "Event C", backValue: "1523", absoluteOrder: 5 },
      { id: "d", frontValue: "Event D", backValue: "1524", absoluteOrder: 7 },
      { id: "e", frontValue: "Event E", backValue: "1599", absoluteOrder: 9 },
      { id: "f", frontValue: "Event F", backValue: "1635", absoluteOrder: 11 },
      { id: "g", frontValue: "Event G", backValue: "1912", absoluteOrder: 13 },
      { id: "h", frontValue: "Event H", backValue: "1914", absoluteOrder: 15 },
      { id: "i", frontValue: "Event I", backValue: "1915", absoluteOrder: 17 },
      { id: "w", frontValue: "Event W", backValue: "1510", absoluteOrder: 4 },
      { id: "x", frontValue: "Event X", backValue: "1589", absoluteOrder: 8 },
      { id: "y", frontValue: "Event Y", backValue: "1634", absoluteOrder: 10 },
      { id: "z", frontValue: "Event Z", backValue: "2004", absoluteOrder: 18 },
    ]
  }

  _updateClientsWithPlayers() {
    const displayPlayers = this._players.map(p => ({
      username: p.displayName(),
      cardsRemaining: p.cards.length,
    }))
    this._log("Updating with player info:", displayPlayers)
    this._players.forEach(p => p.socket.emit("overwrite_players", displayPlayers))
  }
  
  _updateClientsWithTimeline() {
    this._log("Updating with timeline:", this._timeline)
    this._players.forEach(p => p.socket.emit("overwrite_timeline", this._timeline))
  }

  _updateClientsWithCurrentTurn() {
    const username = this._players[this.currentPlayerIndex].username
    this._log("Updating current turn:", username)
    this._players.forEach(p => p.socket.emit("set_current_turn", username))
  }

  _updateAllPlayers() {
    let state = { stage: this.stage }

    switch (this.stage) {
      case Game.STAGE_LOBBY:
        state.players = this._players.map(p => ({
          username: p.displayName(),
          cardsRemaining: 0, // not used in the lobby stage
        }))
        break
      default:
        break
    }

    this._players.forEach(p => p.socket.emit("game_state", state))
  }

  _log(...args) {
    console.log(`[Game ${this.id}]`, ...args)
  }

  _error(...args) {
    console.error(`[Game ${this.id}]`, ...args)
  }
}

module.exports = Game