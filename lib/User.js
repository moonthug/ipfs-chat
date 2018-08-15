const uuid = require('uuid');

const log = require('./utils/log')('user');

class User {

  /**
   *
   * @param {string} peerId
   * @param options
   */
  constructor(peerId, options = { handle: null, joined: false }) {
    this.peerId = peerId;
    this.handle = options.handle || uuid();
    this.joined = options.joined === true;
  }

  /**
   *
   * @param {string} handle
   */
  setJoined(handle) {
    this.handle = handle;
    this.joined = true;
  }
}
