var socket = null

// ============================= Public Functions =============================
//              (in response to messages sent from the server)

function dealHand(cards) {
  app.hand = cards
  app.undealtHandIndices = cards.map((e,i) => i)
  _animateHandIn()
}

async function dealCard(card) {
  app.hand.push(card)
  app.handTransitionsEnabled = false
  app.isDealingInNewCard = true
  app.undealtHandIndices = [app.hand.length - 1]
  await _chill(50)
  
  app.handTransitionsEnabled = true
  app.isDealingInNewCard = false
  app.undealtHandIndices = []
}

function overwriteTimeline(cards) {
  app.timeline = cards
}

async function insertCard(card, index) {
  console.log(`Inserting card ${card} at index ${index}`)
  app.dropPlaceholderIndex = index
  
  await _chill(200)
  
  app.timelineTransitionsEnabled = false
  app.dropPlaceholderIndex = null
  app.timeline.splice(index, 0, card)
  app.removedIndex = index
  
  await _chill(200)
  
  app.timelineTransitionsEnabled = true
  app.removedIndex = null
  
  await _chill(200)
  _insertCardAtDropIndexWithAutocorrection(card, index)
}

function overwritePlayers(players) {
  app.players = players
}

function setCurrentTurn(username) {
  app.currentTurn = username
}

// ============================ Private Functions =============================
function _remToPixels(rem) {    
  return rem * parseFloat(getComputedStyle(document.documentElement).fontSize)
}

function _isAbsolutelyOrdered(cards) {
  if (cards.length > 1) {
    for (var i = 1; i < cards.length; i++) {
      if (cards[i].absoluteOrder < cards[i-1].absoluteOrder) {
        return false
      }
    }
  }

  return true
}

function _chill(duration) { // Delay without blocking the main thread
  return new Promise(resolve => setTimeout(resolve, duration))
}

async function _animateRippledCardFlipsToBack() {
  for (var i = 0; i < app.timeline.length; i++) {
    app.flippedIndices.push(i)
    await _chill(50)
  }
}

async function _animateRippledCardFlipsToFront() {
  while (app.flippedIndices.length) {
    app.flippedIndices.splice(0, 1);
    await _chill(50)
  }
}

async function _animateCardFromIndexToIndex(card, fromIndex, toIndex) {
  await _chill(2000)
  
  // Pull the incorrect card up & out of the timeline
  app.timelineTransitionsEnabled = true
  app.removedIndex = fromIndex

  await _chill(500)

  // Take the incorrect card out of the model without any visual change
  app.timelineTransitionsEnabled = false
  app.timeline.splice(fromIndex, 1)
  app.dropPlaceholderIndex = app.removedIndex
  app.removedIndex = null
  app.justDroppedInfo = null
  
  await _chill(100)

  // Make a space for the insertion point
  app.timelineTransitionsEnabled = true
  app.dropPlaceholderIndex = toIndex
  
  await _chill(500)

  // Add the card to the model in the correct place...
  app.timelineTransitionsEnabled = false
  app.dropPlaceholderIndex = null
  app.timeline.splice(toIndex, 0, card)

  await _chill(1)

  // ...using this hack to keep it out-of-frame (for now)
  app.removedIndex = toIndex
  
  await _chill(100)

  // Animate the card down into the correct position
  app.timelineTransitionsEnabled = true
  app.removedIndex = null
  app.justDroppedInfo = { index: toIndex, isCorrect: true }

  await _chill(1000)
  _animateRippledCardFlipsToFront()
}

function _insertCardAtDropIndexWithAutocorrection(card, index) {
  const isCorrect = _isAbsolutelyOrdered(app.timeline)
  app.justDroppedInfo = { index: index, isCorrect }
  _animateRippledCardFlipsToBack()

  if (isCorrect) {
    _chill(2000).then(() => _animateRippledCardFlipsToFront())
  } else { // Animate the correction
    const indexAfter = app.timeline.findIndex(c => c.absoluteOrder > card.absoluteOrder)
    let newIndex = app.timeline.length
    if (indexAfter >= 0) {
      newIndex = app.justDroppedInfo.index < indexAfter ? indexAfter - 1 : indexAfter
    }

    _animateCardFromIndexToIndex(card, app.justDroppedInfo.index, newIndex)
  }
}

async function _animateHandIn() {
  while (app.undealtHandIndices.length) {
    await _chill(150)
    app.undealtHandIndices.splice(0,1)
  }
}

// =================================== Vue ====================================
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
    justDroppedInfo: null,  // { index: int, isCorrect: bool }
    flippedIndices: [],
    removedIndex: null,     // The index of the card that's pulled up out of the timeline
    undealtHandIndices: [], // Indices of cards in the hand that are animated out
    isDealingInNewCard: false,
    handTransitionsEnabled: true,
    started: false, //Boolean describing if the game has started
    showModal: false,
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
      const index = this.dropPlaceholderIndex
      this.dropPlaceholderIndex = null
      socket.emit("card_placed", card.id, index)
      _insertCardAtDropIndexWithAutocorrection(card, index)
    },
    cardDraggedOver: function (event) {
      console.log("Dragged over")
      event.preventDefault()
      const xOffset = document.getElementById("timeline").scrollLeft
      const e = event || window.event
      const dragX = e.pageX + xOffset - _remToPixels(8)
      const cardWidth = _remToPixels(10)
      const margin = _remToPixels(1)
      const index = dragX / (cardWidth + margin)
      this.dropPlaceholderIndex = Math.round(index)
    },
    cardDragLeft: function (event) {
      this.dropPlaceholderIndex = null
    },
  },
  computed: {
    isMyTurn: function () {
      return this.currentTurn === this.username && this.username !== ""
    }
  }
})

// register modal component
Vue.component("modal", {
  template: "#modal-template"
});

// ================================== Socket ==================================
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

  // =============== Messages from the server ================
  //          (Each of these call a public function)

  socket.on("deal_hand", (cards) => {
    dealHand(cards)
  })

  socket.on("deal_card", (card) => {
    dealCard(card)
  })
  
  socket.on("overwrite_timeline", (cards) => {
    overwriteTimeline(cards)
  })

  socket.on("insert_card", (card, index) => {
    insertCard(card, index)
  })

  socket.on("overwrite_players", (players) => {
    overwritePlayers(players)
  })
  
  socket.on("set_current_turn", (username) => {
    setCurrentTurn(username)
  })
}