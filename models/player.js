// Represents a single unique player in a game of Timeline
class Player {
  constructor(socket) {
    this.username = null
    this.game = null
    this.socket = socket
    this.cards = [] // The player's current hand
  }

  displayName() {
    return this.username || "Unknown"
  }

  setCards(cards) {
    this.cards = cards
    this.socket.emit("deal_hand", cards)
  }
}

module.exports = Player