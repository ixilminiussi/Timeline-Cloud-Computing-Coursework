var socket = null

function remToPixels(rem) {    
  return rem * parseFloat(getComputedStyle(document.documentElement).fontSize)
}

function isAbsolutelyOrdered(cards) {
  if (cards.length < 2) return true;

  for (var i = 1; i < cards.length; i++) {
    if (cards[i].absoluteOrder < cards[i-1].absoluteOrder) {
      return false;
    }
  }

  return true;
}

function chill(duration) { // Delay without blocking the main thread
  return new Promise(resolve => setTimeout(resolve, duration))
}

function animateRippledCardFlipsToBack(fromIndex = 0) {
  if (fromIndex >= app.timeline.length) return;
  app.flippedIndices.push(fromIndex)
  chill(50).then(() => animateRippledCardFlipsToBack(fromIndex + 1))
}

function animateRippledCardFlipsToFront() {
  if (app.flippedIndices.length === 0) return;
  app.flippedIndices.splice(0, 1);
  chill(50).then(() => animateRippledCardFlipsToFront())
}

async function animateCardFromIndexToIndex(card, fromIndex, toIndex) {
  await chill(2000)
  
  // Pull the incorrect card up & out of the timeline
  app.timelineTransitionsEnabled = true
  app.removedIndex = fromIndex

  await chill(500)

  // Take the incorrect card out of the model without any visual change
  app.timelineTransitionsEnabled = false
  app.timeline.splice(fromIndex, 1)
  app.dropPlaceholderIndex = app.removedIndex
  app.removedIndex = null
  app.justDroppedInfo = null
  
  await chill(100)

  // Make a space for the insertion point
  app.timelineTransitionsEnabled = true
  app.dropPlaceholderIndex = toIndex
  
  await chill(500)

  // Add the card to the model in the correct place...
  app.timelineTransitionsEnabled = false
  app.dropPlaceholderIndex = null
  app.timeline.splice(toIndex, 0, card)

  await chill(1)

  // ...using this hack to keep it out-of-frame (for now)
  app.removedIndex = toIndex
  
  await chill(100)

  // Animate the card down into the correct position
  app.timelineTransitionsEnabled = true
  app.removedIndex = null
  app.justDroppedInfo = { index: toIndex, isCorrect: true }

  await chill(1000)
  animateRippledCardFlipsToFront()
}

var app = new Vue({
  el: '#vue-app',
  data: {
    // Players and turns
    username: "Jason",
    currentTurn: "Jason",
    players: [
      { username: "Jason", cardsRemaining: 4 },
      { username: "Karl", cardsRemaining: 3 },
      { username: "Beth", cardsRemaining: 5 },
      { username: "Alice", cardsRemaining: 1 },
    ],

    // Cards and timeline animations
    dropPlaceholderIndex: null,
    timelineTransitionsEnabled: true,
    timeline: [
      { frontValue: "Event A", backValue: "1432", absoluteOrder: 1 },
      { frontValue: "Event B", backValue: "1500", absoluteOrder: 3 },
      { frontValue: "Event C", backValue: "1523", absoluteOrder: 5 },
      { frontValue: "Event D", backValue: "1524", absoluteOrder: 7 },
      { frontValue: "Event E", backValue: "1599", absoluteOrder: 9 },
      { frontValue: "Event F", backValue: "1635", absoluteOrder: 11 },
      { frontValue: "Event G", backValue: "1912", absoluteOrder: 13 },
      { frontValue: "Event H", backValue: "1914", absoluteOrder: 15 },
      { frontValue: "Event I", backValue: "1915", absoluteOrder: 17 },
    ],
    hand: [
      { frontValue: "Event W", backValue: "1510", absoluteOrder: 4 },
      { frontValue: "Event X", backValue: "1589", absoluteOrder: 8 },
      { frontValue: "Event Y", backValue: "1634", absoluteOrder: 10 },
      { frontValue: "Event Z", backValue: "2004", absoluteOrder: 18 },
    ],
    justDroppedInfo: null, // { index: int, isCorrect: bool }
    flippedIndices: [],
    removedIndex: null, // The index of the card that's pulled up out of the timeline
  },
  mounted: function () {
    connect()
  },
  methods: {
    cardDragStarted: function (event, cardIndex) {
      console.log("Drag started", this.hand[cardIndex])
      this.timelineTransitionsEnabled = true
      event.dataTransfer.setData("application/timeline", cardIndex)
    },
    cardDropped: function (event) {
      const cardIndex = event.dataTransfer.getData("application/timeline")
      const card = this.hand[cardIndex]
      console.log("Dropped", card)
      event.preventDefault()

      this.timelineTransitionsEnabled = false
      this.hand.splice(cardIndex, 1)
      this.timeline.splice(this.dropPlaceholderIndex, 0, card)
      const isCorrect = isAbsolutelyOrdered(this.timeline)
      this.justDroppedInfo = { index: this.dropPlaceholderIndex, isCorrect }
      this.dropPlaceholderIndex = null
      animateRippledCardFlipsToBack()

      socket.emit("card_dropped", card.id, cardIndex)

      if (isCorrect) {
        chill(2000).then(() => animateRippledCardFlipsToFront())
      } else { // Animate the correction
        const indexAfter = this.timeline.findIndex(c => c.absoluteOrder > card.absoluteOrder)
        let newIndex = this.timeline.length
        if (indexAfter >= 0) {
          newIndex = this.justDroppedInfo.index < indexAfter ? indexAfter - 1 : indexAfter
        }

        animateCardFromIndexToIndex(card, this.justDroppedInfo.index, newIndex)
      }
    },
    cardDraggedOver: function (event) {
      console.log("Dragged over")
      event.preventDefault()
      const xOffset = document.getElementById("timeline").scrollLeft
      const e = event || window.event
      const dragX = e.pageX + xOffset - remToPixels(8)
      const cardWidth = remToPixels(10)
      const margin = remToPixels(1)
      const index = dragX / (cardWidth + margin)
      this.dropPlaceholderIndex = Math.round(index)
    },
    cardDragLeft: function (event) {
      this.dropPlaceholderIndex = null
    },
  },
  computed: {
    isMyTurn: function () {
      return this.currentTurn === this.username
    }
  }
})

function connect() {
  socket = io()

  socket.on("connect", function () {
    console.log("Connected")
  })

  socket.on("connect_error", function (message) {
    console.error("Connection failed", message)
  })

  socket.on("disconnect", function () {
    console.error("Connection dropped")
  })

  // ================ Messages from the server ================

  // Receive a hand of cards to show to the user
  socket.on("deal_hand", (cards) => {
    app.hand = cards
  })

  // Add a card to this player's hand
  socket.on("deal_card", (card) => {
    app.hand.push(card)
  })
  
  // Update the whole timeline without animation (e.g. if you need to load
  // many cards at once).
  socket.on("overwrite_timeline", (cards) => {
    app.timeline = cards
  })

  // Insert a card into the timeline (e.g. if another player has played
  // their turn)
  socket.on("insert_card", (card, index) => {
    console.log(`TODO: Inserting card ${card} at index ${index}`)
  })

  // Update the list of players. For use when players are joining or a turn
  // has been taken.
  socket.on("overwrite_players", (players) => {
    app.players = players
  })
  
  // Set the current turn to the player with the received username.
  socket.on("set_current_turn", (username) => {
    app.currentTurn = username
  })
}
