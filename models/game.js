const Player = require("./player")

// Manages and coordinates a single game of Timeline
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
    this._timeline = []
    this.stage = Game.STAGE_LOBBY
  }

  // PUBLIC
  registerPlayer(player) {
    this._players.push(player)
    player.game = this
    this._updateClientsWithPlayers()
  }

  registerUsernameForPlayer(player, username) {
    const playerIndex = this._players.findIndex(p => p === player)
    if (playerIndex < 0) {
      console.error("Cannot register username of player outside this game")
      return null
    }

    const existingPlayer = this._players.find(p => p.username === username)
    let migrationInfo = null
    if (existingPlayer) {
      console.log(`${username} already exists in-game, switching to the existing player`)
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

  async start() {
    this.stage = Game.STAGE_PLAYING
    await this._loadSelectedDeck()

    const availableCards = this._deck.length
    const nPlayers = this._players.length
    const handSize = Math.min(Math.floor(availableCards / nPlayers), Game.MAX_HAND_SIZE)
    this._players.forEach(p => p.setCards(this._deck.splice(0, handSize)))
  }

  // PRIVATE
  async _loadSelectedDeck() {
    // TODO: connect to DB
    this._deck = [
      { frontValue: "Event A", backValue: "1432", absoluteOrder: 1 },
      { frontValue: "Event B", backValue: "1500", absoluteOrder: 3 },
      { frontValue: "Event C", backValue: "1523", absoluteOrder: 5 },
      { frontValue: "Event D", backValue: "1524", absoluteOrder: 7 },
      { frontValue: "Event E", backValue: "1599", absoluteOrder: 9 },
      { frontValue: "Event F", backValue: "1635", absoluteOrder: 11 },
      { frontValue: "Event G", backValue: "1912", absoluteOrder: 13 },
      { frontValue: "Event H", backValue: "1914", absoluteOrder: 15 },
      { frontValue: "Event I", backValue: "1915", absoluteOrder: 17 },

      { frontValue: "Event W", backValue: "1510", absoluteOrder: 4 },
      { frontValue: "Event X", backValue: "1589", absoluteOrder: 8 },
      { frontValue: "Event Y", backValue: "1634", absoluteOrder: 10 },
      { frontValue: "Event Z", backValue: "2004", absoluteOrder: 18 },
    ]
  }

  _updateClientsWithPlayers() {
    const displayPlayers = this._players.map(p => ({
      username: p.displayName(),
      cardsRemaining: 0, // not used in the lobby stage
    }))
    this._players.forEach(p => p.socket.emit("overwrite_players", displayPlayers))
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
}

module.exports = Game