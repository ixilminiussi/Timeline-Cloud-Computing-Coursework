const Game = require("./game")
const Player = require("./player")

/**
 * Coordinates a collection of concurrent Timeline games and players. This
 * class is the root of all game logic on the server.
 */
class GameStore {
  static ID_VALUES = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ123456789".split("")

  constructor(a, b, c) {
    this._games = []
    this._allPlayers = new Map() // [Socket: Player]
  }

  // PUBLIC
  createGame(socket) {
    do { // Generate unique game ID
      var id = this._generateGameID()
    } while (this._games.find(g => g.id === id))

    const game = new Game(id)
    game.creatorSocket = socket
    this._games.push(game)
    return game
  }

  updateDeckForGameWithCreatorSocket(socket, deckID) {
    const game = this._games.find(g => g.creatorSocket === socket)
    if (!game) {
      console.error("Cannot find game with socket")
      return
    }

    // TODO: confirm this deck ID is valid
    game.selectedDeckID = deckID
  }

  registerSocketWithGame(socket, gameID) {
    let game = this._games.find(g => g.id === gameID)
    if (!game) {
      console.error("Cannot find game with id", gameID, "- creating new one")
      game = new Game(gameID) // Intentionally not setting creatorSocket here
      this._games.push(game)
    }
    const player = new Player(socket)
    game.registerPlayer(player)
    this._allPlayers.set(socket, player)
  }

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

