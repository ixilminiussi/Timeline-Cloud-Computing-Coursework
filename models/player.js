/**
 * Represents a single player in a game of Timeline, whose username uniquely
 * identifies them within their game.
 */
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

  addCard(card) {
    this.cards.push(card)
    this.socket.emit("deal_replacement", card)
  }

  removeCard(card) {
    const index = this.cards.findIndex(c => c.id === card.id)
    if (index < 0) {
      this.game._error("Cannot remove card from player, card does not exist")
      return
    }
    this.cards.splice(index, 1)
  }
}

module.exports = Player