const fs = require('fs');

const EventEmitter = require('events').EventEmitter;

const Cipher = require('./cipher');
const protocol = require('./protocol');
const roomEvents = require('./constants/room-events');

const debug = require('debug')('hello-pubsub:room');

class Room extends EventEmitter {
  /**
   *
   * @param ipfs
   * @param topic
   * @param options
   */
  constructor(ipfs, topic, options) {
    super();
    this.ipfs = ipfs;
    this.topic = topic;
    this.options = options;

    this.peers = [];

    this.cipher = new Cipher(options.key, options.iv);

    this._setupProtocol();
  }

  /**
   *
   * @returns {boolean}
   */
  start() {
    if (this.ipfs.isOnline() !== true) {
      debug(`Not online! Cannot subscribe`);
      return false;
    }

    debug(`Subscribing to topic: ${this.topic}`);

    this.ipfs.pubsub.subscribe(
      this.topic,

      receivedMessage => {
        debug('receivedMessage: %O', receivedMessage);
        const message = protocol.decode(
          this.cipher.decrypt(receivedMessage.data)
        );

        this.emit(roomEvents.MESSAGE, {
          from: receivedMessage.from,
          message
        });
      },

      err => {
        if(err) {
          debug('Subscribing to topic: %s', this.topic);
          return this.emit(roomEvents.ERROR, err);
        }

        debug(`Subscribed!`);
        this.emit(roomEvents.SUBSCRIBED, this.topic);

        this._startPoll();
        this._getPeers();
      }
    );
  }

  /**
   *
   */
  stop() {
    this.ipfs.pubsub.unsubscribe(
      this.topic, err => {
        if(err) {
          return this.emit(roomEvents.ERROR, err);
        }

        this.emit(roomEvents.SUBSCRIBED, this.topic);
      }
    );
  }

  /**
   *
   * @private
   */
  _setupProtocol() {
    this.protocol = {};

    Object.keys(protocol.commands).forEach(commandName => {
      const commandFunc = protocol.commands[commandName];

      this.protocol[commandName] = (...args) => {
        const result = commandFunc.apply(this, args);
        this._publish(result);
      }
    });

    debug('Protocol loaded: %o', Object.keys(this.protocol));
  }

  /**
   *
   * @param {string} message
   */
  _publish(message) {
    const messageBuffer = this.cipher.encrypt(message);

    this.ipfs.pubsub.publish(
      this.topic, messageBuffer, err => {
        if(err) {
          return this.emit(roomEvents.ERROR, err);
        }

        debug('Published to %s: %s', this.topic, message);
        this.emit(roomEvents.PUBLISHED, message);
      }
    );
  }

  _getPeers() {
    this.ipfs.pubsub.peers((err, peers) => {
      if (err) {
        debug(`Cannot list peers`, err);
        return false;
      }

      const joinedPeers = peers.filter(peer => {
        return this.peers.indexOf(peer) === -1;
      });

      const leftPeers = this.peers.filter(peer => {
        return peers.indexOf(peer) === -1;
      });

      this.peers = peers;
      this.emit(roomEvents.PEER_UPDATE, this.peers);

      if(joinedPeers.length > 0) {
        this.emit(roomEvents.PEER_JOIN, joinedPeers);
      }

      if(leftPeers.length > 0) {
        this.emit(roomEvents.PEER_LEAVE, leftPeers);
      }

      debug('Current peers: %s', peers.length);
    });
  }

  /**
   *
   * @private
   */
  _startPoll() {
    this._pollTimer = setInterval(() => {
      this._getPeers();
    }, 5000);
  }

  /**
   *
   * @private
   */
  _stopPoll() {
    clearInterval(this._pollTimer);
  }
}

module.exports = Room;
