const log = require('./log')('events');

module.exports = (eventDispatcher, eventName, callback) => {
  log.trace('%s emitted \'%s\'', typeof eventDispatcher, eventName);
  return eventDispatcher.on(eventName, callback);
}
