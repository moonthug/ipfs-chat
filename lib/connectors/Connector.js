const EventEmitter = require('events').EventEmitter;

class Connector extends EventEmitter {

  /**
   *
   */
  constructor() {
    super();
    this._isOnline = false;
  }

  subscribe() {
    throw new Error('Not implemented');
  }

  /**
   *
   */
  publish() {
    throw new Error('Not implemented');
  }

  /**
   *
   */
  unsubscribe() {
    throw new Error('Not implemented');
  }

  /**
   *
   * @returns {Promise<string>}
   */
  getPeerId() {
    throw new Error('Not implemented');
  }

  /**
   *
   * @returns {boolean}
   */
  isOnline() {
    throw new Error('Not implemented');
  }

  /**
   *
   * @returns {object}
   */
  getStatus() {
    return {
      isOnline: this.isOnline(),
      getPeerId: this.getPeerId()
    }
  }
}

module.exports = Connector;
