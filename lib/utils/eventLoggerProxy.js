const log = require('./log')('events');

module.exports ={
  bindEventReMapAndLog: (eventDispatcher, eventName, callback) => {
    eventDispatcher.on(eventName, callback);
  }
}
