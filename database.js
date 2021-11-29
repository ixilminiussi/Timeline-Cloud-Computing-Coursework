const { CosmosClient } = require("@azure/cosmos")

const endpoint = process.env.COSMOS_ENDPOINT
const key = process.env.COSMOS_KEY

try {
    const client = new CosmosClient({ endpoint, key })
} catch {
    console.warn("[WARNING] Database client setup failed, make sure you have the correct keys in your .env file. See README.md for setup instructions.");
}

// A collection of functions to send and retrieve data from CosmosDb
class Database {
    
}

module.exports = Database