const User = require('./User');

const log = require('./utils/log')('users');

class Users {
  /**
   *
   */
  constructor() {
    this._peerMap = {};


  }

  /**
   *
   * @param {string} peerId
   */
  addOperator(peerId) {
    this.addUser(peerId, '<me>');
  }

  /**
   *
   * @param {string} peerId
   * @param {string=} handle
   * @returns {boolean}
   */
  addUser(peerId, handle) {
    if(!peerId) {
      log.warn('addPeer: No peerId set');
      return false;
    }

    if(this._peerMap.hasOwnProperty(peerId)) {
      log.warn('addPeer: Peer already exists');
      return false;
    }

    this._peerMap[peerId] = new User(peerId, handle);
  }
}

module.exports = Users;
