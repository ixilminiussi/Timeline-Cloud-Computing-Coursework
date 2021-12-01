var socket = null

function remToPixels(rem) {    
  return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}

var app = new Vue({
  el: '#vue-app',
  data: {
    decks: [
      "Computer Science History",
      "Movies 1960-1990",
      "Pop Songs 1980-2010",
      "19th Century Geopolitical Conflicts",
      "20th Century Scientists",
    ],
    selectedDeckIndex: null,
    joinLink: "https://localhost:8080/xyz123",
    copiedJoinLink: false,
    dropPlaceholderIndex: null,
    cards: [
      { type: "fixed", value: 1 },
      { type: "fixed", value: 2 },
      { type: "fixed", value: 3 },
      { type: "fixed", value: 4 },
      { type: "fixed", value: 5 },
      { type: "fixed", value: 6 },
      { type: "fixed", value: 7 },
      { type: "fixed", value: 8 },
      { type: "fixed", value: 9 },
      { type: "fixed", value: 10 },
    ]
  },
  mounted: function () {
    connect()
  },
  methods: {
    selectDeckAt: function (index) {
      this.selectedDeckIndex = index
    },
    copyJoinLink: function () {
      if (this.joinLink) {
        navigator.clipboard.writeText(this.joinLink)
        this.copiedJoinLink = true
        new Promise(resolve => setTimeout(resolve, 1000))
          .then(() => this.copiedJoinLink = false)
      }
    },
    openGameLink: function () {
      if (this.joinLink) {
        window.open(this.joinLink)
      }
    },

    cardDragStarted: function (event) {
      console.log("Drag started")
    },
    cardDropped: function (event) {
      console.log("Dropped")
      event.preventDefault()

      this.cards.splice(this.dropPlaceholderIndex, 0, { type: "dropped", value: 99 })
      this.dropPlaceholderIndex = null
    },
    cardDraggedOver: function (event) {
      event.preventDefault()
      const xOffset = document.getElementById("timeline").scrollLeft
      console.log("Dragged over!", xOffset)
      const e = event || window.event
      const dragX = e.pageX + xOffset
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
