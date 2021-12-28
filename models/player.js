// Represents a single unique player in a game of Timeline
class Player {
  constructor(username, socket) {
    this.username = username
    this.socket = socket
    this.cards = [] // The player's current hand
  }
}

module.exports = Player