const Game = require("./game")
const Player = require("./player")

/**
 * Coordinates a collection of concurrent Timeline games and players. This
 * class is the root of all game logic on the server.
 */
class GameStore {
  static ID_VALUES = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ123456789".split("")

  /**
   * @param {Database} database
   */
  constructor(database) {
    this._games = []
    this._allPlayers = new Map() // [Socket: Player] for all players across all games
    this._db = database
  }

  // PUBLIC
  /**
   * Creates and stores a new game with a unique ID.
   * @param {Socket} socket The socket requesting a new game.
   * @returns {Game} The newly created Game instance.
   */
  createGame(socket) {
    do { // Generate unique game ID
      var id = this._generateGameID()
    } while (this._games.find(g => g.id === id))

    const game = new Game(id, this._db)
    game.creatorSocket = socket
    this._games.push(game)
    return game
  }

  /**
   * Select a new deck for a game. Only valid while the game is not currently playing.
   * @param {Socket} socket The same socket that requested a new game with `GameStore.createGame`.
   * @param {string} deckID The id of the deck that this game should use when gameplay starts.
   */
  updateDeckForGameWithCreatorSocket(socket, deckID) {
    const game = this._games.find(g => g.creatorSocket === socket)
    if (!game) {
      console.error("Cannot find game with socket")
      return
    }

    // TODO: confirm this deck ID is valid
    game.selectDeckWithID(deckID)
  }

  /**
   * Select a new hand size for a game. Only valid while the game is not currently playing.
   * @param {Socket} socket The same socket that requested a new game with `GameStore.createGame`.
   * @param {number} handSize The number of cards that each player should be dealt when the game starts.
   */
  updateHandSizeForGameWithSocket(socket, handSize) {
    const game = this._games.find(g => g.creatorSocket === socket)
    if (!game) {
      console.error("Cannot find game with socket")
      return
    }

    game.selectHandSize(handSize)
  }

  /**
   * Adds a new player to a game using this socket.
   * @param {Socket} socket The socket the new player is using.
   * @param {string} gameID The unique ID of the game that the player should
   * be added to. If this game does not already exist, it will be created.
   */
  registerSocketWithGame(socket, gameID) {
    let game = this._games.find(g => g.id === gameID)
    if (!game) {
      console.error("Cannot find game with id", gameID, "- creating new one")
      game = new Game(gameID, this._db) // Intentionally not setting creatorSocket here
      this._games.push(game)
    }
    const player = new Player(socket)
    if (game.registerPlayer(player)) {
      this._allPlayers.set(socket, player)
    }
  }

  /**
   * Assign a username to the player with the current socket. If a player with the
   * username already exists in the game then it's assumed this socket belongs to
   * the existing player (i.e. in case of a page reload) and existing player's info
   * is transferred over to this new socket.
   * @param {Socket} socket The socket belonging to the player requesting the username change.
   * @param {string} username The new username of the player. Should be a non-empty string.
   */
  registerUsernameForPlayerWithSocket(socket, username) {
    const player = this._allPlayers.get(socket)
    if (!player) {
      console.error("Cannot find player with socket")
      return
    }

    const migrationInfo = player.game.registerUsernameForPlayer(player, username)
    if (migrationInfo) { // Username already exists for a player, assign socket to this player
      this._allPlayers.delete(migrationInfo.oldSocket)
      this._allPlayers.set(socket, migrationInfo.targetPlayer)
    }
  }

  /**
   * Start the game that this socket is an admin player in. Deals the deck and begins
   * turn-by-turn playing. The deck can no longer be changed until the game ends.
   * @param {Socket} socket The socket belonging to the admin player of the game.
   * If this socket does not belong to the admin player, nothing happens.
   */
  startGameViaSocket(socket) {
    const player = this._allPlayers.get(socket)
    if (!player) {
      console.error("Cannot find player with socket")
      return
    }

    if (player.game.adminPlayer() !== player) {
      console.error("Player does not have authority to start game")
      return
    }

    player.game.start()
  }

  /**
   * Notify the game this socket belongs to that a player has made a move.
   * @param {Socket} socket The socket belonging to the player that made their move.
   * @param {string} cardID The ID of the card that the player moved.
   * @param {int} index The index in the timeline that the player inserted their card.
   */
  cardPlacedViaSocket(socket, cardID, index) {
    const player = this._allPlayers.get(socket)
    if (!player) {
      console.error("Cannot find player with socket")
      return
    }

    player.game.cardPlaced(player, cardID, index)
  }

  // PRIVATE
  _generateGameID() {
    const chars = GameStore.ID_VALUES
    var id = ""
    while (id.length < Game.ID_LENGTH) {
      id += chars[Math.floor(Math.random() * chars.length)]
    }
    return id
  }
}

module.exports = GameStore

