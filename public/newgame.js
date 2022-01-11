var socket = null

var app = new Vue({
  el: '#vue-app',
  data: {
    decks: [],
    customDecks: [],
    selectedDeckIndex: null,
    joinLink: "Loading...",
    copiedJoinLink: false,
    handSize: 5,
  },
  mounted: function () {
    connect()
    socket.emit("available_decks")
    socket.emit("create_game")
  },
  methods: {
    selectDeckAt: function (index) {
      this.selectedDeckIndex = index
      if (this.selectedDeckIndex < this.decks.length) {
        socket.emit("select_deck", this.decks[index].id)
      } else {
        socket.emit("select_deck", this.customDecks[index-this.decks.length].id)
      }
    },
    copyJoinLink: function () {
      if (this.joinLink) {
        navigator.clipboard.writeText(this.joinLink)
        this.copiedJoinLink = true
        new Promise(resolve => setTimeout(resolve, 1000))
          .then(() => this.copiedJoinLink = false)
      }
    },
    showCreateDeckForm: function() {
      if (user.me.status == -1) {
        user.form.show = 0;
      }
      if (user.me.status == 1) {
        user.form.show = 3;
      }
    },
    openGameLink: function () {
      if (this.joinLink) {
        window.open(this.joinLink)
      }
    },
    handSizeChanged: function () {
      socket.emit("hand_size", this.handSize)
    },
    createDeck: function() {
      user.createDeck();
    }
  }
});

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

  socket.on("update_cookie", data => {
    console.log("socket: update_cookie", data)
    user.me = { status: 1, username: data.id, displayname: data.screenName, password: ''}
    user.form.show = 0
    document.cookie = "username=" + data.id
    document.cookie = "screenName=" + data.screenName
    document.cookie = "decks=" + data.decks
    console.log("Cookie set: ", document.cookie)
  })

  socket.on("login_error", error => {
    console.log("socket: login_error", error)
    user.displayError(error)
  })

  socket.on("account_update_success", function() {
    console.log("socket: account_update_success")
    user.displaySuccess()
  })

  socket.on("available_custom_decks", decks => {
    console.log("socket: available_custom_dekcs", decks)
    app.customDecks = decks
  })

  socket.on("error", message => {
    alert(message)
  })
}
