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

module.exports = {
  chill,
}