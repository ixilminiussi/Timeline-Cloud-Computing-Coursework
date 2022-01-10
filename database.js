const { CosmosClient } = require("@azure/cosmos")
const bcrypt = require("bcrypt");


const endpoint = process.env.COSMOS_ENDPOINT
const key = process.env.COSMOS_KEY
const dbID = process.env.COSMOS_DB_ID

/**
 * A collection of functions to send and retrieve data from CosmosDb.
 */
class Database {
  constructor() {
    try {
      this._client = new CosmosClient({ endpoint, key })
    } catch {
      this._error("Database client setup failed, make sure you have the correct keys in your .env file. See README.md for setup instructions.");
      this._client = null
    }

    this._db = null
    this._cache = {
      decks: null,
      cards: new Map(), // [deckID: [Card]]
    }
  }

  // PUBLIC
  async getPlayableDecks() {
    if (this._cache.decks) {
      this._log("Cache hit: returning playable decks")
      return this._cache.decks
    }

    this._log("Cache miss: downloading and returning playable decks")
    const db = await this._getDb()
    const { container } = await db.containers.createIfNotExists({ id: "decks" })
    const records = await container.items.readAll().fetchAll()
    const decks = records.resources.map(d => ({ // Strip the CosmosDb properties
      id: d.id,
      name: d.name,
      cardContainer: d.cardContainer,
    }))

    this._cache.decks = decks
    return decks
  }

  async getCardsForDeckWithID(deckID) {
    if (this._cache.cards.has(deckID)) {
      this._log("Cache hit: returning cards for deck ", deckID)
      return this._cache.cards.get(deckID)
    }

    const decks = await this.getPlayableDecks()
    const deck = decks.find(d => d.id === deckID)
    if (!deck) {
      this._error("No deck available for id", deckID)
      return []
    }
    
    this._log("Cache miss: downloading cards for deck", deckID)
    const db = await this._getDb()
    const { container } = await db.containers.createIfNotExists({ id: deck.cardContainer })
    const records = await container.items.readAll().fetchAll()
    const cards = records.resources.map(c => ({ // Strip the CosmosDb properties
      id: c.id,
      frontValue: c.front,
      backValue: c.back,
      absoluteOrder: parseInt(c.absoluteOrder)
    }))

    this._cache.cards.set(deckID, cards)
    return cards
  }

  async login(username, password){
    const db = await this._getDb()
    const { container } = await db.containers.createIfNotExists({ id: "users" })
    const querySpec = {
      query: "SELECT * from c WHERE c.id=@username",
      parameters: [
        { name: "@username", value: username }
      ]
    }
    const { resources: items } = await container.items.query(querySpec).fetchAll();

    if(items.length === 0){
      throw "Username not found."
    }

    let hash = items[0].password
    console.log("Login: Hash fetched: ", hash)

    const passwordCorrect = await bcrypt.compare(password, hash);

    if (!passwordCorrect) throw "Password incorrect."

    return {id: username, screenName: items[0].screenName, decks: items[0].decks}
  }

  async signUp(username, password){
    const db = await this._getDb()
    const { container } = await db.containers.createIfNotExists({ id: "users" })
    const querySpec = {
      query: "SELECT * from c WHERE c.id=@username",
      parameters: [
        { name: "@username", value: username }
      ]
    }
    const { resources: items } = await container.items.query(querySpec).fetchAll();

    if(items.length > 0){
      throw "Username already exists."
    }

    bcrypt.genSalt(10, function(err, salt) {
      bcrypt.hash(password, salt, async function (err, hash) {
        await container.items.create({
          id: username,
          password: hash,
          screenName: username,
          decks: []
        })
        console.log("Sign-Up Hashed Password: " + hash);
      });
    });

    return {id: username, screenName: username, decks: []};
  }

  async authenticate(username, password){
    const db = await this._getDb()
    const { container } = await db.containers.createIfNotExists({ id: "users" })
    const querySpec = {
      query: "SELECT * from c WHERE c.id=@username",
      parameters: [
        { name: "@username", value: username }
      ]
    }
    const { resources: items } = await container.items.query(querySpec).fetchAll();

    if(items.length === 0){
      throw "Username not found."
    }

    let hash = items[0].password
    console.log("Authenticate: Hash fetched: ", hash)

    return await bcrypt.compare(password, hash);
  }

  async updateAccount(username, screenName, oldPassword, newPassword){
    if(newPassword === ''){
      const db = await this._getDb()
      const { container } = await db.containers.createIfNotExists({ id: "users" })
      const querySpec = {
        query: "SELECT * from c WHERE c.id=@username",
        parameters: [
          { name: "@username", value: username }
        ]
      }
      const { resources: items } = await container.items.query(querySpec).fetchAll();

      let currentPassword = items[0].password
      let currentDecks = items[0].decks

      const createdItem = {id: username, password: currentPassword, screenName: screenName, decks: currentDecks}

      const { id, category } = createdItem

      await container.item(id, category).replace(createdItem);
    }
  }

  // PRIVATE
  async _getDb() {
    if (this._db) {
      return this._db
    }

    const { database } = await this._client.databases.createIfNotExists({ id: dbID })
    this._db = database
    return database
  }

  async _log(...args) {
    console.log("[Database]", ...args)
  }

  async _error(...args) {
    console.error("[Database - Error]", ...args)
  }
}

module.exports = Database