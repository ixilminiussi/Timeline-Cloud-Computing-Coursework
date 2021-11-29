var socket = null

var app = new Vue({
  el: '#vue-app',
  data: {

  },
  mounted: function () {
    connect()
  },
  methods: {

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
