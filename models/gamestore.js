const Game = require("./game")

// Manages and coordinates all the games active on the server
class GameStore {
  static ID_VALUES = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ123456789".split("")

  constructor(a, b, c) {
    this._games = []
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

