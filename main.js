"use strict"

require('dotenv').config()

const Database = require("./database")
const GameStore = require("./models/gamestore")
const db = new Database()
const gameStore = new GameStore(db)

const express = require("express")
const { emit } = require('process')
const app = express()

const server = require("http").Server(app)
const io = require("socket.io")(server)

app.set("view engine", "ejs")
app.use("/static", express.static("public"))

let baseServerURL = ""

app.get("/", (req, res) => {
  baseServerURL = req.protocol + '://' + req.get('host')
  res.render("newgame", {version: process.version})
})

app.get("/play/:code", (req, res) => {
  res.render("game", {version: process.version})
})

app.get("/accountsettings", (req, res) => {
  res.render("accountsettings", {version: process.version})
})

function startServer() {
  const PORT = process.env.PORT || 8080
  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`)
  })
}

io.on("connection", socket => {
  console.log("New connection")

  socket.on("disconnect", () => {
    console.log("Dropped connection")
  })

  // ========================== Client-side API ==========================
  socket.on("available_decks", async () => {
    console.log("socket: available_decks")
    const decks = await db.getPlayableDecks()
    socket.emit("available_decks", decks)
  })

  socket.on("select_deck", deckID => {
    console.log("socket: select_deck", deckID)
    gameStore.updateDeckForGameWithCreatorSocket(socket, deckID)
  })

  socket.on("hand_size", handSize => {
    console.log("socket: hand_size", handSize, typeof handSize)
    gameStore.updateHandSizeForGameWithSocket(socket, handSize)
  })

  socket.on("create_game", () => {
    console.log("socket: create_game")
    if (!baseServerURL) {
      console.error("baseServerURL has not been populated - cannot create join link")
      return
    }

    const game = gameStore.createGame(socket)
    const id = game.id
    const link = baseServerURL + "/play/" + id
    socket.emit("join_link", link)
  })

  socket.on("register_with_game", gameID => {
    console.log("socket: register_with_game", gameID)
    gameStore.registerSocketWithGame(socket, gameID)
  })

  socket.on("register_username", username => {
    console.log("socket: register_username", username)
    gameStore.registerUsernameForPlayerWithSocket(socket, username)
  })

  socket.on("start_game", () => {
    console.log("socket: start_game")
    gameStore.startGameViaSocket(socket)
  })

  socket.on("card_placed", (cardID, index) => {
    console.log("socket: card_placed")
    gameStore.cardPlacedViaSocket(socket, cardID, index)
  })

  socket.on("create_deck", (json, user) => {
    console.log("socket: create_deck", user.username)

    var deckJson
    var cardJson

    if (json.name === null) {
      socket.emit("error", "json missing 'name' field")
      return
    }

    deckJson = { name: json.name }

    if (json.cards === null) {
      socket.emit("error", "json missing 'cards' array")
      return
    }

    cardJson.cards = []

    var i = 0
    while (json.cards[i] != null) { // iterating through cards

      if (json.cards[i].backValue === null) {
        socket.emit("error", "json missing 'backValue' in card index ", i)
      }
      if (json.cards[i].frontValue === null) {
        socket.emit("error", "json missing 'frontValue' in card index ", i)
      }

      cardJson.cards.push({ "backValue": json.cards[i].backValue, "frontValue": json.cards[i].frontValue })

      i ++
    }

    console.log(cardJson)
  })
})

if (module === require.main) {
  startServer()
}

module.exports = server