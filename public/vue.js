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
  },
  mounted: function () {
    connect()
  },
  methods: {
    selectDeckAt: function(index) {
      this.selectedDeckIndex = index
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
