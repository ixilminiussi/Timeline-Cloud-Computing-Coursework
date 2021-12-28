// Miscellaneous helper functions

const chill = (duration) => new Promise(resolve => setTimeout(resolve, duration))

module.exports = {
  chill,
}