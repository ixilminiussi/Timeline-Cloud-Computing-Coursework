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
  app.started = true
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

function _getGameID() {
  const pathComponents = window.location.pathname.split("/")
  return pathComponents[pathComponents.length - 1]
}

var draggingCardID = null
var startPoint = null

// =================================== Vue ====================================
var app = new Vue({
  el: '#vue-app',
  data: {
    // Lobby
    started: true, // Boolean describing if the game has started
    showModal: true,
    joinLink: window.location.href,
    copiedJoinLink: false,

    // Players and turns
    username: "Admin",
    currentTurn: "Admin",
    players: JSON.parse(`[{"username":"Admin","cardsRemaining":5},{"username":"John","cardsRemaining":5}]`),

    // Cards and timeline animations
    dropPlaceholderIndex: null,
    timelineTransitionsEnabled: true,
    timeline: JSON.parse(`[{"id":"32","frontValue":"Saw","backValue":"28/07/2006","absoluteOrder":32},{"id":"32","frontValue":"Saw","backValue":"28/07/2006","absoluteOrder":32},{"id":"32","frontValue":"Saw","backValue":"28/07/2006","absoluteOrder":32},{"id":"32","frontValue":"Saw","backValue":"28/07/2006","absoluteOrder":32},{"id":"32","frontValue":"Saw","backValue":"28/07/2006","absoluteOrder":32},{"id":"32","frontValue":"Saw","backValue":"28/07/2006","absoluteOrder":32},{"id":"32","frontValue":"Saw","backValue":"28/07/2006","absoluteOrder":32},{"id":"32","frontValue":"Saw","backValue":"28/07/2006","absoluteOrder":32},{"id":"32","frontValue":"Saw","backValue":"28/07/2006","absoluteOrder":32},{"id":"32","frontValue":"Saw","backValue":"28/07/2006","absoluteOrder":32}]`),
    hand: JSON.parse(`[{"id":"12","frontValue":"The Exorcist","backValue":"16/03/1974","absoluteOrder":12},{"id":"4","frontValue":"Citizen Kane","backValue":"24/01/1942","absoluteOrder":4},{"id":"9","frontValue":"The Good, the Bad and the Ugly","backValue":"22/08/1968","absoluteOrder":9},{"id":"30","frontValue":"Finding Nemo","backValue":"10/10/2003","absoluteOrder":30},{"id":"46","frontValue":"Interstellar","backValue":"07/11/2014","absoluteOrder":46}]`),
    justDroppedInfo: null,  // { index: int, isCorrect: bool }
    flippedIndices: [],
    removedIndex: null,     // The index of the card that's pulled up out of the timeline
    undealtHandIndices: [], // Indices of cards in the hand that are animated out
    isDealingInNewCard: false,
    handTransitionsEnabled: true,
    draggingCardIndex: null,
    draggingCardTranslation: { dx: 0, dy: 0 },
    dragTransform: "",
  },
  mounted: function () {
    connect()
    socket.emit("register_with_game", _getGameID())

    window.onmousedown = function(e) {
      if (!app.isMyTurn) { return }
      const x = e.clientX
      const y = e.clientY
      let div = document.elementFromPoint(x, y)
      while (div && !div.id.startsWith("handCard")) {
        div = div.parentElement
      }

      if (div) {
        startPoint = { x, y }
        app.handTransitionsEnabled = false
        app.draggingCardIndex = parseInt(div.id.split("-")[1])
        app.dragTransform = `transform: translate(0px, 0px);`
      }
    }

    window.onmousemove = (e) => {
      if (app.draggingCardIndex === null) { return }

      const x = e.clientX
      const y = e.clientY
      const dx = x - startPoint.x
      const dy = y - startPoint.y
      app.dragTransform = `transform: translate(${dx}px, ${dy}px);`

      const tlRect = document.getElementById("timeline").getBoundingClientRect()
      const inTimeline = x > tlRect.left && x < tlRect.right && y > tlRect.top && y < tlRect.bottom
      if (!inTimeline) { 
        app.dropPlaceholderIndex = null
        return 
      }

      const xOffset = document.getElementById("timeline").scrollLeft
      const dragX = x + xOffset - _remToPixels(8)
      const cardWidth = _remToPixels(10)
      const margin = _remToPixels(1)
      const index = dragX / (cardWidth + margin)
      app.dropPlaceholderIndex = Math.round(index)
    }

    window.onmouseup = (e) => {
      const cardIndex = app.draggingCardIndex
      app.draggingCardIndex = null
      app.handTransitionsEnabled = true

      const x = e.clientX
      const y = e.clientY
      const tlRect = document.getElementById("timeline").getBoundingClientRect()
      const inTimeline = x > tlRect.left && x < tlRect.right && y > tlRect.top && y < tlRect.bottom
      if (!inTimeline) { return }

      const card = app.hand[cardIndex]

      app.handTransitionsEnabled = false
      app.timelineTransitionsEnabled = false
      app.hand.splice(cardIndex, 1)
      app.timeline.splice(app.dropPlaceholderIndex, 0, card)
      const index = app.dropPlaceholderIndex
      app.dropPlaceholderIndex = null
      socket.emit("card_placed", card.id, index)
      _insertCardAtDropIndexWithAutocorrection(card, index)

      // Re-enable hover effects
      _chill(10).then(() => app.handTransitionsEnabled = true)
    }
  },
  methods: {
    usernameEntered: function () {
      this.showModal = !this.showModal
      console.log("Username Entered", this.username)
      socket.emit("register_username", this.username)
    },
    startGame: function () {
      console.log("Emitting start command...")
      socket.emit("start_game")
    },
    copyJoinLink: function () {
      if (this.joinLink) {
        navigator.clipboard.writeText(this.joinLink)
        this.copiedJoinLink = true
        new Promise(resolve => setTimeout(resolve, 1000))
            .then(() => this.copiedJoinLink = false)
      }
    },
  },
  computed: {
    isMyTurn: function () {
      return this.currentTurn === this.username && this.username !== ""
    },
    background: function() {
      return `background-color: #f8fafc;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cg fill='%23f1f5f9' fill-opacity='1'%3E%3Cpolygon fill-rule='evenodd' points='8 4 12 6 8 8 6 12 4 8 0 6 4 4 6 0 8 4'/%3E%3C/g%3E%3C/svg%3E");`
    }
  }
})

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

  socket.on("deal_replacement", (card) => {
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

  socket.on("game_over", () => {
    console.log("socket: game_over unimplemented")
    console.log(app.players)
  })
}