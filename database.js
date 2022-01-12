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
    const userQueryResult = await this._getUserWithUsername(user.username, container)

    if(userQueryResult.length > 0) {

      if (userQueryResult[0].deckIDs === null) {
        this._log("no decks found under user ", user.username)
        return []
      }

      this._log("found custom decks ", userQueryResult[0].deckIDs)
      return userQueryResult[0].deckIDs
    } else {
      throw "Username not found."
    }
  }

  async deleteDeck(deckJson, user) {

    try {
      if(!(await this.authenticate(user.username, user.password))){
        console.log("Delete deck: Authentication failed")
        throw "Password incorrect."
      }
    } catch(e) {
      throw(e)
    }

    const db = await this._getDb()

    { // Removes card container
      const { container } = await db.containers.createIfNotExists({ id: deckJson.cardContainer })
      await container.delete();

      this._log("deleted container ", deckJson.cardContainer)
    }

    { // Removes from user collection
      const { container } = await db.containers.createIfNotExists({ id: "users" })
      
      const userQueryResult = await this._getUserWithUsername(user.username, container)

      userQueryResult[0].deckIDs = userQueryResult[0].deckIDs.filter(item => item.id != deckJson.id);
  
      const { id, key } = userQueryResult[0]
      const { resource: updatedUser } = await container.item(id, key).replace(userQueryResult[0])
      this._log(updatedUser)
    }
  }

  async createDeckForUser(_uuid, deckJson, cardsJson, user) {

    //Checks whether user already has deck with name

    var decks = []

    try {
      decks = await this.getDecksForUser(user)
    } catch(e) {
      throw(e)
    }

    decks.forEach(deck => {

      if (deck.name === deckJson.name) {
        throw("Incorrect deck name - duplicate")
      }
    })

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

    const { container } = await db.containers.createIfNotExists({ id: "users" })
    const userQueryResult = await this._getUserWithUsername(user.username, container)

    userQueryResult[0].deckIDs.push(deckJson)

    const { id, key } = userQueryResult[0]
    const { resource: updatedUser } = await container.item(id, key).replace(userQueryResult[0])
    this._log(updatedUser)

    return userQueryResult[0].deckIDs
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

  async login(username, password){
    const db = await this._getDb()
    const { container } = await db.containers.createIfNotExists({ id: "users" })

    const userQueryResult = await this._getUserWithUsername(username, container)

    if(userQueryResult.length === 0){
      throw "Username not found."
    }

    let hash = userQueryResult[0].password
    console.log("Login: Hash fetched: ", hash)

    const passwordCorrect = await bcrypt.compare(password, hash);

    if (!passwordCorrect) throw "Password incorrect."

    return {id: username, screenName: userQueryResult[0].screenName, decks: userQueryResult[0].decks}
  }

  async signUp(username, password){
    const db = await this._getDb()
    const { container } = await db.containers.createIfNotExists({ id: "users" })

    const userQueryResult = await this._getUserWithUsername(username, container)

    if(userQueryResult.length > 0){
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

    const userQueryResult = await this._getUserWithUsername(username, container)

    if(userQueryResult.length === 0){
      throw "Username not found."
    }

    let hash = userQueryResult[0].password
    console.log("Authenticate: Hash fetched: ", hash)

    return await bcrypt.compare(password, hash);
  }

  async updateAccount(username, screenName, oldPassword, newPassword){
    const db = await this._getDb()
    const { container } = await db.containers.createIfNotExists({ id: "users" })

    const userQueryResult = await this._getUserWithUsername(username, container)

    let currentPassword = userQueryResult[0].password
    let currentDecks = userQueryResult[0].decks

    if(newPassword === ''){
      const createdItem = {id: username, password: currentPassword, screenName: screenName, decks: currentDecks}
      const { id, category } = createdItem
      await container.item(id, category).replace(createdItem);
    } else {
      if(await this.authenticate(username, oldPassword)){
        console.log("Update Account: Authentication successful")
        bcrypt.genSalt(10, function(err, salt) {
          bcrypt.hash(newPassword, salt, async function (err, hash) {
            const createdItem = {id: username, password: hash, screenName: screenName, decks: currentDecks}
            const { id, category } = createdItem
            await container.item(id, category).replace(createdItem);
          });
        });
      } else {
        console.log("Update Account: Authentication failed")
        throw "Old password incorrect."
      }
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

  async _getUserWithUsername(username, container){
    const querySpec = {
      query: "SELECT * from c WHERE c.id=@username",
      parameters: [
        { name: "@username", value: username }
      ]
    }
    const { resources: items } = await container.items.query(querySpec).fetchAll();

    return items;
  }
}

module.exports = Database