"use strict"

require('dotenv').config()

const Database = require("./database")
const GameStore = require("./models/gamestore")
const gameStore = new GameStore()

const express = require("express")
const app = express()

const server = require("http").Server(app)
const io = require("socket.io")(server)

app.set("view engine", "ejs")
app.use("/static", express.static("public"))

let baseServerURL = ""

app.get("/", (req, res) => {
  baseServerURL = req.protocol + '://' + req.get('host')
  console.log({ baseServerURL })
  res.render("newgame", { version: process.version })
})

app.get("/play/:code", (req, res) => {
  res.render("game", { version: process.version })
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

  // ===== Client-side API ======
  socket.on("available_decks", () => {
    console.log("socket: available_decks")
    // TODO: send back available decks to the client
    console.error("available_decks is unimplemented")
  })

  socket.on("select_deck", deckID => {
    console.log("socket: select_deck")
    // TODO: update deck for this socket's game
    console.error("select_deck is unimplemented")
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

  socket.on("register_username", username => {
    console.error("register_username is unimplemented")
  })
})

if (module === require.main) {
  startServer()
}

module.exports = server
