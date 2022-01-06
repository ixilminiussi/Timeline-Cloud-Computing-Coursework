// Miscellaneous helper functions

/**
 * A convenience function to asynchronously delaying execution.
 * @example
 * async function foo() {
 *   bar()
 *   await chill(1000) // Wait for 1 second
 *   baz()
 * }
 * @param {number} duration The number of milliseconds to wait for.
 * @returns {Promise} a promise resolving in `duration` milliseconds.
 */
const chill = (duration) => new Promise(resolve => setTimeout(resolve, duration))

/**
 * In-place Fisher-Yates shuffle, taken from https://stackoverflow.com/a/2450976.
 * @example
 * var arr = [2, 11, 37, 42];
 * shuffle(arr);
 * @param {Array} array 
 * @returns {Array}
 */
const shuffle = (array) => {
  let currentIndex = array.length,  randomIndex;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

module.exports = {
  chill,
  shuffle,
}