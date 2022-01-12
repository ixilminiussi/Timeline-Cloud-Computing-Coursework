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
  app.state = "playing"
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
  app.hasMovedThisTurn = false
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
    let newIndex = app.timeline.length - 1
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

// Drag-and-drop interaction
var _dragStartPoint = null

function _isPointInTimeline(x, y) {
  const tlRect = document.getElementById("timeline").getBoundingClientRect()
  return x > tlRect.left && x < tlRect.right && y > tlRect.top && y < tlRect.bottom
}

function _onMouseDown(e) {
  if (!app.canMove) { return }
  const x = e.clientX
  const y = e.clientY
  let div = document.elementFromPoint(x, y)
  while (div && !div.id.startsWith("handCard")) {
    div = div.parentElement
  }

  if (div) {
    _dragStartPoint = { x, y }
    app.handTransitionsEnabled = false
    app.draggingCardIndex = parseInt(div.id.split("-")[1])
    app.dragTransform = `transform: translate(0px, 0px);`
  }
}

function _onMouseMoved(e) {
  if (app.draggingCardIndex === null) { return }

  const x = e.clientX
  const y = e.clientY
  const dx = x - _dragStartPoint.x
  const dy = y - _dragStartPoint.y
  app.dragTransform = `transform: translate(${dx}px, ${dy}px);`

  if (!_isPointInTimeline(x, y)) { 
    app.dropPlaceholderIndex = null
    return 
  }

  const xOffset = document.getElementById("timeline").scrollLeft
  const dragX = x + xOffset - _remToPixels(8)
  const cardWidth = _remToPixels(10)
  const margin = _remToPixels(1)
  const index = dragX / (cardWidth + margin)
  app.dropPlaceholderIndex = Math.min(Math.round(index), app.timeline.length)
}

function _onMouseUp(e) {
  const cardIndex = app.draggingCardIndex
  if (cardIndex === null) { return }
  app.draggingCardIndex = null
  app.handTransitionsEnabled = true

  const x = e.clientX
  const y = e.clientY
  if (!_isPointInTimeline(x, y)) { return }

  const card = app.hand[cardIndex]

  app.handTransitionsEnabled = false
  app.handPlaceholderIndex = cardIndex
  app.timelineTransitionsEnabled = false
  app.hand.splice(cardIndex, 1)
  app.timeline.splice(app.dropPlaceholderIndex, 0, card)
  const index = app.dropPlaceholderIndex
  app.dropPlaceholderIndex = null
  socket.emit("card_placed", card.id, index)
  _insertCardAtDropIndexWithAutocorrection(card, index)
  app.hasMovedThisTurn = true

  // Re-enable hover effects
  _chill(10).then(() => { 
    app.handTransitionsEnabled = true
    app.handPlaceholderIndex = null
  })

  // If this is the only player, let them make another move after revealing the answer
  if (app.players.length === 1) {
    _chill(3500).then(() => {
      app.hasMovedThisTurn = false
    })
  }
}

// =================================== Vue ====================================
var app = new Vue({
  el: '#vue-app',
  data: {
    // Lobby
    state: "lobby", // lobby, playing, ended
    showModal: true,
    joinLink: window.location.href,
    copiedJoinLink: false,

    // Players and turns
    username: "",
    currentTurn: null,
    players: [],
    hasMovedThisTurn: false,

    // Cards and timeline animations
    dropPlaceholderIndex: null,
    timelineTransitionsEnabled: true,
    timeline: [],
    hand: [],
    justDroppedInfo: null,  // { index: int, isCorrect: bool }
    flippedIndices: [],
    removedIndex: null,         // The index of the card that's pulled up out of the timeline
    undealtHandIndices: [],     // Indices of cards in the hand that are animated out
    isDealingInNewCard: false,
    handTransitionsEnabled: true,
    draggingCardIndex: null,    // Index of card in hand that's being dragged
    dragTransform: "",          // CSS style (transform) of the card currently being dragged
    handPlaceholderIndex: null, // Index of card that's just been dropped into timeline

    //statistics for players
    showAll: false, // If true, shows both the date and event of all cards on screen
    correctlyPlaced: 0,
    winner: ""
  },
  mounted: function () {
    connect()
    this.getScreenNameFromCookie()
    socket.emit("register_with_game", _getGameID())
    document.getElementById("usernameIn").focus()

    // For drag & drop handling
    window.onmousedown = _onMouseDown
    window.onmousemove = _onMouseMoved
    window.onmouseup = _onMouseUp
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
    restartGame: function() {
      console.log("Emitting restart command...")
      socket.emit("restart_game")
    },
    copyJoinLink: function () {
      if (this.joinLink) {
        navigator.clipboard.writeText(this.joinLink)
        this.copiedJoinLink = true
        new Promise(resolve => setTimeout(resolve, 1000))
            .then(() => this.copiedJoinLink = false)
      }
    },
    leaveGame: function() {
      socket.emit("leave_game", _getGameID())
    },
    getCookies: function(str){
      let cookieString = RegExp(str+"=[^;]+").exec(document.cookie);
      return decodeURIComponent(!!cookieString ? cookieString.toString().replace(/^[^=]+./,"") : "");
    },
    getScreenNameFromCookie: function(){
      console.log("Cookie returned: " + document.cookie)
      if(document.cookie.indexOf("username") !== -1){
        this.username = this.getCookies("screenName")
      }
    }
  },
  computed: {
    isMyTurn: function () {
      return this.currentTurn === this.username && this.username !== ""
    },
    handBackground: function () {
      // From https://heropatterns.com with fgcolor=text-gray-100, bgcolor=text-gray-50
      return `background-color: #f8fafc;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cg fill='%23f1f5f9' fill-opacity='1'%3E%3Cpolygon fill-rule='evenodd' points='8 4 12 6 8 8 6 12 4 8 0 6 4 4 6 0 8 4'/%3E%3C/g%3E%3C/svg%3E");`
    },
    canMove: function() {
      return this.username && this.username === this.currentTurn && !this.hasMovedThisTurn
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

  socket.on("reset", () => {
    app.showAll = false
    app.state = "playing"
    app.correctlyPlaced = 0
    app.winner = ""
  })

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

  socket.on("game_over", (correctlyPlaced, winner) => { // shows winner, shows timeline and user cards, shows button to start again, shows button to change deck, shows button to create new game
    app.showAll = true
    app.state = "ended"
    app.correctlyPlaced = correctlyPlaced
    app.winner = winner
    console.log(app.players)
  })
}