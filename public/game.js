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

var app = new Vue({
  el: '#vue-app',
  data: {
    dropPlaceholderIndex: null,
    timelineTransitionsEnabled: true,
    timeline: [
      { frontValue: 2, backValue: "123", absoluteOrder: 1 },
      { frontValue: 3, backValue: "123", absoluteOrder: 3 },
      { frontValue: 5, backValue: "123", absoluteOrder: 5 },
      { frontValue: 7, backValue: "123", absoluteOrder: 7 },
      { frontValue: 11, backValue: "123", absoluteOrder: 9 },
      { frontValue: 13, backValue: "123", absoluteOrder: 11 },
      { frontValue: 17, backValue: "123", absoluteOrder: 13 },
      { frontValue: 23, backValue: "123", absoluteOrder: 15 },
      { frontValue: 27, backValue: "123", absoluteOrder: 17 },
    ],
    hand: [
      { frontValue: 4, backValue: "567", absoluteOrder: 4 },
      { frontValue: 8, backValue: "567", absoluteOrder: 8 },
      { frontValue: 26, backValue: "567", absoluteOrder: 26 },
      { frontValue: 32, backValue: "567", absoluteOrder: 32 },
    ],
    isFlipped: false,
    justDroppedInfo: null, // or { index: int, isCorrect: bool }
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
      this.justDroppedInfo = { index: this.dropPlaceholderIndex, isCorrect: isAbsolutelyOrdered(this.timeline) }
      this.dropPlaceholderIndex = null
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
    }
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
