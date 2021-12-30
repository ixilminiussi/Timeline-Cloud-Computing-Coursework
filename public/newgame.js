var socket = null

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
    joinLink: "Loading...",
    copiedJoinLink: false,
  },
  mounted: function () {
    connect()
    socket.emit("available_decks")
    socket.emit("create_game")
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

  socket.on("join_link", link => {
    console.log("socket: join_link", link)
    app.joinLink = link
  })

  socket.on("available_decks", decks => {
    console.log("socket: available_decks", decks)
    app.decks = decks
  })
}
