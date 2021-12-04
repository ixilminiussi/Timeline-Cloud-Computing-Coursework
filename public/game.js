var socket = null

function remToPixels(rem) {    
  return rem * parseFloat(getComputedStyle(document.documentElement).fontSize)
}

var app = new Vue({
  el: '#vue-app',
  data: {
    dropPlaceholderIndex: null,
    timelineTransitionsEnabled: true,
    timeline: [
      { value: 2 },
      { value: 3 },
      { value: 5 },
      { value: 7 },
      { value: 11 },
      { value: 13 },
      { value: 17 },
      { value: 23 },
      { value: 27 },
    ],
    hand: [
      { value: 4 },
      { value: 8 },
      { value: 26 },
      { value: 32 },
    ],
    isFlipped: false,
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
