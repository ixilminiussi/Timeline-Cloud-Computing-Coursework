const { CosmosClient } = require("@azure/cosmos")

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
      customDecks: null,
      cards: new Map(), // [deckID: [Card]]
      customCards: new Map()
    }
  }

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

  async getDecksForUser(user) {

    const db = await this._getDb()
    const { container } = await db.containers.createIfNotExists({ id: "users" })

    const querySpec = {
      query: "SELECT * FROM c WHERE c.id='"+user.username+"'"
    }
    
    const { resources: users } = await container.items.query(querySpec).fetchAll(); // TODO, replace with authenticate function

    if (users.length <= 0) {
      this._error("found no user under name " + user.username)
      return []
    } else {
      if (users[0].deckIDs === null) {
        this._log("no decks found under user ", user.username)
        return
      }

      this._log("found custom decks ", users[0].deckIDs)
      return users[0].deckIDs
    }
  }

  async createDeckForUser(_uuid, deckJson, cardsJson, user) {

    //Checks whether user already has deck with name

    const decks = await this.getDecksForUser(user)

    if (decks === "error") {
      return "error"
    }

    var duplicate = false

    decks.forEach(deck => {

      if (deck.name === deckJson.name) {
        this._error("deck of that name already exists ", deckJson.name)
        duplicate = true
      }
    })

    if (duplicate) { // cannot simply return inside for loop
      return "error"
    }

    // Creates the card container 

    const db = await this._getDb()
    {
      const { container } = await db.containers.createIfNotExists({ id: _uuid }) 
      await Promise.all(cardsJson.map(async (card) => {
        try {
          const { resource: createdCard } = await container.items.create(card)
          this._log("created new card ", createdCard)
        } catch(e) {
          this._error(e)
        }
      }))
      this._log("created new deck ", _uuid);
    }

    // Updates the user with pointer to card container

    const { container } = await db.containers.createIfNotExists({ id: "users" }) // TODO, replace with authenticate function
    const querySpec = {
      query: "SELECT * FROM c WHERE c.id='"+user.username+"'"
    }
    
    const { resources: users } = await container.items.query(querySpec).fetchAll();

    if (users <= 0) {
      this._error("found no user under name " + user.username)
    } else {
      users[0].deckIDs.push(deckJson)

      const { id, key } = users[0]

      const { resource: updatedUser } = await container.item(id, key).replace(users[0])

      this._log(updatedUser)

      return users[0].deckIDs
    }
  }

  async getCardsForDeckWithID(deckID) {

    if (this._cache.customCards.has(deckID)) {
      this._log("Cache hit: returning cards for deck ", deckID)
      return this._cache.customCards.get(deckID)
    }

    if (this._cache.cards.has(deckID)) {
      this._log("Cache hit: returning cards for deck ", deckID)
      return this._cache.cards.get(deckID)
    }

    const db = await this._getDb()

    const decks = await this.getPlayableDecks()
    const deck = decks.find(d => d.id === deckID)
    if (!deck) {
      this._error("No classic deck available for id", deckID)
    } else {
      this._log("Cache miss: downloading cards for deck", deckID)
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

    { // Testing if a custom decks exists under that name (unlike classic decks, custom decks share the same id for cardContainer as the id for the deck)
      const querySpec = {
          query: "SELECT * FROM root r WHERE r.id='"+deckID+"'"
      };
  
      this._log("Cache miss: downloading cards for deck", deckID)
      const records = await db.containers.query(querySpec).fetchNext();
      if(!records.resources[0]){
        this._error("No classic deck available for id", deckID)
        return 
      }

      this._log(records.resources[0])
    }

    const { container } = await db.containers.createIfNotExists({ id: deckID })
    const records = await container.items.readAll().fetchAll()

    const cards = records.resources.map(c => ({ // Strip the CosmosDb properties
      id: c.id,
      frontValue: c.front,
      backValue: c.back,
      absoluteOrder: parseInt(c.absoluteOrder)
    }))

    this._cache.customCards.set(deckID, cards)

    return cards
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