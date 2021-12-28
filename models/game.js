// Manages and coordinates a single game of Timeline
class Game {
  static ID_LENGTH = 6

  constructor(id) {
    this.id = id
    this.creationTime = Date.now()
    this.creatorSocket = null
    this.players = []
    this.selectedDeckID = null
    this.deck = []
  }
}

module.exports = Game