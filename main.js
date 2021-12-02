"use strict"

require('dotenv').config()

const Database = require("./database")

const express = require("express")
const app = express()

const server = require("http").Server(app)
const io = require("socket.io")(server)

app.set("view engine", "ejs")
app.use("/static", express.static("public"))

app.get("/", (req, res) => {
  console.log("BBB")
  res.render("newgame", { version: process.version })
})

app.get("/play/:code", (req, res) => {
  console.log("AAAAA")
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
})

if (module === require.main) {
  startServer()
}

module.exports = server
