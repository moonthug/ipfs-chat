const log = require('./log')('events');

/**
 *
 * @param {EventEmitter} eventDispatcher
 * @param {string} eventName
 */
const logEvent = (eventDispatcher, eventName) => {
  log.trace('%s emitted \'%s\'', eventDispatcher.constructor.name || typeof eventDispatcher, eventName);
};

/**
 *
 * @param {EventEmitter} eventDispatcher
 * @param {string} eventName
 * @param {function} callback
 */
module.exports = (eventDispatcher, eventName, callback) => {
  log.trace('%s bound to \'%s\'', eventDispatcher.constructor.name || typeof eventDispatcher, eventName);
  return eventDispatcher.on(eventName, (...args) => {
    logEvent(eventDispatcher, eventName);
    return callback(...args);
  });
};
