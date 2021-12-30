/**
 * Represents a single player in a game of Timeline, whose username uniquely
 * identifies them within their game.
 */
class Player {
  /**
   * @param {Socket} socket The socket belonging to this player's client.
   */
  constructor(socket) {
    this.username = null
    this.game = null
    this.socket = socket
    this.cards = [] // The player's current hand
  }

  /**
   * @returns The string this player should be displayed as.
   */
  displayName() {
    return this.username || "Unknown"
  }

  /**
   * @typedef {Object} Card
   * @property {string} id 
   *    The unique ID of this card within a deck.
   * @property {string} frontValue 
   *    The value on the front of the card (the 'challenge' - e.g. an event).
   * @property {string} backValue 
   *    The vaule of the back of the card (the 'answer' - e.g. a date).
   * @property {number} absoluteOrder 
   *    A number unique to this card in the deck that represents its order in the deck.
   */

  /**
   * Overwrites this player's hand and updates the client.
   * @param {Card[]} cards 
   */
  setCards(cards) {
    this.cards = cards
    this.socket.emit("deal_hand", cards)
  }

  /**
   * Inserts a card into this player's hand and updates the client.
   * @param {Card} card 
   */
  addCard(card) {
    this.cards.push(card)
    this.socket.emit("deal_replacement", card)
  }

  /**
   * Removes a card from this player's hand, if it exists, otherwise does nothing.
   * @param {Card} card The card to remove from the hand.
   */
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