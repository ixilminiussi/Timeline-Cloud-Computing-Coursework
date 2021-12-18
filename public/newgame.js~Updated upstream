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
    joinLink: "http://localhost:8080/play/xyz123",
    copiedJoinLink: false,
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
  }
});

var user = new Vue({
  el: '#account',
  data: {
    me: { status: -1, username: '', password: '', email: '' }, // -1 - disconnected; 1 - connected
    form: { show: -1, passwordInput: 'password' }, // -1 - nothing; 0 - show login form; 1 - show register form; 2 - show account applet (profile, disconnect)
  },
  mounted: function () {
    connect();

    // Allows for closing the login form with keypress
    window.addEventListener('keydown', (e) => {
      if (e.key == 'Escape') {
        this.closeLoginForm();
      }
    });

    // Allows for closing the login form by clicking outside
    window.addEventListener('mousedown', (e) => {
      if (this.form.show != -1 && !document.getElementById('loginForm').contains(e.target)) {
        this.closeLoginForm();
      }
    });
  },
  methods: {
    login: function (username, password) {

    },
    signup: function (username, password, email) {

    },
    createDeck: function () {

    },
    importDecks: function () {

    },
    showLoginForm: function () {
      this.form.show = 0;
    },
    showSignupForm: function () {
      this.form.show = 1;
    },
    closeLoginForm: function () {
      this.form.show = -1;
    },
    openAccount: function () {
      if (this.me.status == -1) {
        this.status = 0;
      }
    },
    closeAccount: function () {
      this.me.status = -1;
    },
    togglePassword: function () {
      if (this.form.passwordInput == 'password') {
        this.form.passwordInput = 'text';
      } else {
        this.form.passwordInput = 'password';
      }
    }
  }
});

function connect() {
  socket = io();
  socket.on('connect', function () {

  });

  socket.on('connect_error', function (message) {
    console.error("Connection failed", message)
  });

  socket.on('disconnect', function () {
    console.error("Connection dropped")
  });
}