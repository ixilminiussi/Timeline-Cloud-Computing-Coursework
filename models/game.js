const { chill } = require("../utility")

/**
 * Represents and manages a single game of Timeline.
 */
class Game {
  static ID_LENGTH = 6
  static MAX_PLAYERS = 5
  static MAX_HAND_SIZE = 2

  static STAGE_LOBBY = "lobby"
  static STAGE_PLAYING = "playing"
  static STAGE_ENDED = "ended"


  /**
   * @param {string} id The unique ID of this game.
   */
  constructor(id) {
    this.id = id
    this.creationTime = Date.now()  // TODO: remove unplayed games after time
    this.creatorSocket = null
    this._selectedDeckID = null
    this._players = []
    this._deck = []
    this._originalDeck = []
    this._timeline = []
    this._stage = Game.STAGE_LOBBY
    this._currentPlayerIndex = 0
    
    // Used for stats on end screen
    this._correctlyPlaced = 0
    this._incorrectlyPlaced = 0
  }

  // PUBLIC
  /**
   * Adds a player to the list and sets the inverse relationship on the player. If the
   * game is full then the player will not be added.
   * @param {Player} player The player to add to this game.
   * @returns {boolean} `true` if there was room to add the player, `false` otherwise.
   */
  registerPlayer(player) {
    if (this._players.length >= Game.MAX_PLAYERS) {
      this._error("Max players reached, ignoring new player")
      return false
    }

    this._players.push(player)
    player.game = this
    this._updateClientsWithPlayers()
    return true
  }

  /**
   * @typedef {Object} MigrationInfo
   * @property {Socket} oldSocket The socket the existing player used to use.
   * @property {Player} targetPlayer The existing player that `player` was merged with.
   */

  /**
   * Set the username for a player. If the username already exists in this game then
   * the existing player will be merged with the new player.
   * @param {Player} player The player requesting a username.
   * @param {string} username The new username of the player.
   * @returns {MigrationInfo|null} The migration info in the case of a username conflict,
   *                               otherwise `null`.
   */
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

  /**
   * @returns {Player|null} The admin player of this game, if one exists.
   */
  adminPlayer() {
    if (!this._players.length) {
      return null
    }
    return this._players[0]
  }

  /**
   * Handles a turn being made during the game. Notifies the other clients,
   * deals replacements if necessary, and moves to the next turn (or ends the game).
   * @param {Player} player The player that made the move.
   * @param {string} cardID The unique ID of the card that the player placed.
   * @param {number} index The index in the timeline where the player placed the card.
   */
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

    await chill(2500)

    if (wasPlacedCorrectly) {
      this._log("Card placed correctly")
      this._correctlyPlaced += 1
      this._timeline.splice(index, 0, card)
    } else {
      this._incorrectlyPlaced += 1
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
    
    if (!player.cards.length) { // Game over
      this._log(`${player.displayName()} has cleared hand, ending game`)
      this._stage = Game.STAGE_ENDED
      this._players.forEach(p => p.socket.emit("set_current_turn", null))
      var name = player.username
      this._players.forEach(p => p.socket.emit("game_over", this._correctlyPlaced, this._incorrectlyPlaced, name))
    } else { // Update current turn
      this._currentPlayerIndex = (this._currentPlayerIndex + 1) % this._players.length
      this._updateClientsWithCurrentTurn()
    }
  }

  /**
   * Starts the game. Updates the game stage, downloads the deck, and deals hands
   * to players before starting turn-by-turn play.
   */
  async start() {
    this._log("starting")
    this._stage = Game.STAGE_PLAYING
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
    this._currentPlayerIndex = 0
    this._updateClientsWithCurrentTurn()
  }

  /**
   * Updates the current deck the game is using. If the game is playing, nothing happens.
   * @param {string} deckID The unique ID of the deck this game should use.
   * Must be a valid deck ID.
   */
  selectDeckWithID(deckID) {
    if (this._stage === Game.STAGE_PLAYING) {
      this._error("Stage is playing, cannot change change deck")
      return
    }

    this._selectedDeckID = deckID
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
    const username = this._players[this._currentPlayerIndex].username
    this._log("Updating current turn:", username)
    this._players.forEach(p => p.socket.emit("set_current_turn", username))
  }

  _log(...args) {
    console.log(`[Game ${this.id}]`, ...args)
  }

  _error(...args) {
    console.error(`[Game ${this.id}]`, ...args)
  }
}

module.exports = Game