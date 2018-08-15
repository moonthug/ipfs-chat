const uuid = require('uuid');


const debug = require('debug')('hello-pubsub:peers');

class Peers {
  /**
   *
   */
  constructor() {
    this._peerMap = {};
  }

  /**
   *
   * @param {string} peerId
   * @param {string=} handle
   * @returns {boolean}
   */
  addPeer(peerId, handle) {
    if(!peerId) {
      debug('addPeer: No peerId set');
      return false;
    }

    if(this._peerMap.hasOwnProperty(peerId)) {
      debug('addPeer: Peer already exists');
      return false;
    }

    handle = handle || uuid();

    this._peerMap[peerId] = handle;
  }
}
