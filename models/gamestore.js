const Game = require("./game")

// Manages and coordinates all the games active on the server
class GameStore {
  static ID_VALUES = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ123456789".split("")

  constructor(a, b, c) {
    this.games = []
  }

  // PUBLIC
  createGame(socket) {
    do { // Generate unique game ID
      var id = this._generateGameID()
    } while (this.games.find(g => g.id === id))

    const game = new Game(id)
    game.creatorSocket = socket
    this.games.push(game)
    return game
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

