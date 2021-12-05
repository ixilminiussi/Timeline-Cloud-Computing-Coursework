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

function wait(duration) {
  return new Promise(function(resolve, reject) {
    setTimeout(function(){
      resolve();
    }, duration)
  })
}

function animateRippledCardFlipsToBack(fromIndex = 0) {
  if (fromIndex >= app.timeline.length) return;
  app.flippedIndices.push(fromIndex)
  wait(50).then(() => animateRippledCardFlipsToBack(fromIndex + 1))
}

function animateRippledCardFlipsToFront() {
  if (app.flippedIndices.length === 0) return;
  app.flippedIndices.splice(0, 1);
  wait(50).then(() => animateRippledCardFlipsToFront())
}

var app = new Vue({
  el: '#vue-app',
  data: {
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

      if (isCorrect) {
        wait(2000).then(() => animateRippledCardFlipsToFront())
      } else {
        const indexAfter = this.timeline.findIndex(c => c.absoluteOrder > card.absoluteOrder)
        const newIndex = indexAfter === -1 ? this.timeline.length : indexAfter - 1
        wait(2000)
        .then(() => {
          this.dropPlaceholderIndex = this.justDroppedInfo.index
          this.timeline.splice(this.justDroppedInfo.index, 1)
          this.justDroppedInfo = null
        })
        .then(() => wait(500))
        .then(() => {
          this.timelineTransitionsEnabled = true
          this.dropPlaceholderIndex = newIndex - 1
        })
        .then(() => wait(500))
        .then(() => {
          this.timelineTransitionsEnabled = false
          this.timeline.splice(this.dropPlaceholderIndex, 0, card)
          this.justDroppedInfo = { index: this.dropPlaceholderIndex, isCorrect: true }
          this.dropPlaceholderIndex = null
        })
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
  }
})

function connect() {
  socket = io();
  socket.on('connect', function () {

  })

  socket.on('connect_error', function (message) {
    console.error("Connection failed", message)
  })

  socket.on('disconnect', function () {
    console.error("Connection dropped")
  })
}
