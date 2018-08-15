const fs = require('fs');

const EventEmitter = require('events').EventEmitter;

const Cipher = require('./Cipher');
const Users = require('./Users');

const PubSubService = require('./services/PubSub');
// const KeyStoreService = require('./services/PubSub');

const roomProtocol = require('./protocol/room');

const connectorEvents = require('./constants/connectorEvents');
const roomEvents = require('./constants/roomEvents');

const eventLoggerProxy = require('./utils/eventLoggerProxy');

const log = require('./utils/log')('Room');

class Room extends EventEmitter {
  /**
   *
   * @param {Connector} connector
   * @param {string} topic
   * @param {Object} options
   */
  constructor(connector, topic, options) {
    super();

    this._connector = connector;
    this.pubsub = new PubSubService(this._connector);

    this.topic = topic;
    this.options = options;

    this.users = new Users();
    this._connector.getPeerId()
      .then((peerId) => this._peerId = peerId)
      .catch((err) => log.error('Cannot retrieve PeerId', err));

    this.cipher = new Cipher(options.key, options.iv);

    this._setupProtocol();
  }

  /**
   *
   * @returns {boolean}
   */
  start() {
    return new Promise((accept, reject) => {
      if (this.pubsub.isOnline() !== true) {
        log.warn(`Not online! Cannot subscribe`);
        return false;
      }

      log.debug('Subscribing to topic \'%s\'', this.topic);

      this.pubsub.subscribe(this.topic)
        .then(() => {
          log.info('Subscribed to topic \'%s\'', this.topic);
          this.emit(roomEvents.JOIN, this.topic);

          this._bindToPubSub();
          this._startHeartbeat();
        })
        .catch((err) =>{
          log.error(err, 'Subscribing to topic \'%s\' failed', this.topic);
          this.emit(roomEvents.ERROR, err);
        });
    });
  }

  /**
   *
   */
  stop() {
    this.pubsub.unsubscribe(this.topic)
      .then(() => {
        log.info('Unsubscribed from topic: %s')
      })
      .catch(err => {
        if(err) {
          return this.emit(roomEvents.ERROR, err);
        }

        this.emit(roomEvents.JOIN, this.topic);
      }
    );
  }

  /**
   *
   * @private
   */
  _setupProtocol() {
    this.protocol = {};

    Object.keys(roomProtocol.commands).forEach(commandName => {
      const commandFunc = roomProtocol.commands[commandName];

      this.protocol[commandName] = (...args) => {
        const result = commandFunc.apply(this, args);
        this._publish(result);
      }
    });

    log.debug('_setupProtocol: Protocol loaded: %o', Object.keys(this.protocol));
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

        log.debug('_publish: Published to %s: %s', this.topic, message);
        this.emit(roomEvents.SENT, message);
      }
    );
  }

  /**
   *
   * @param {string} peerId
   * @param {string} handle
   */
  _addUser(peerId, handle) {
    this.users.addUser(peerId, handle);
  }

  /**
   *
   * @param {string} receivedMessage
   * @private
   */
  _messageHandler(receivedMessage) {
    debug('receivedMessage: %O', receivedMessage);
    const message = protocol.decode(
      this.cipher.decrypt(receivedMessage.data)
    );

    this.emit(roomEvents.MESSAGE, {
      from: receivedMessage.from,
      message
    });
  }

  /**
   *
   * @private
   */
  _getUsers() {
    this.ipfs.pubsub.peers((err, peers) => {
      if (err) {
        debug(`_getUsers: Cannot list peers`, err);
        return false;
      }

      // const joinedUsers = peers.filter(peer => {
      //   return this.peers.(peer) === -1;
      // });
      //
      // const leftUsers = this.peers.filter(peer => {
      //   return peers.indexOf(peer) === -1;
      // });
      //
      // this.peers = peers;
      //
      // if(joinedUsers.length > 0 && leftUsers.length > 0) {
      //   this.emit(roomEvents.USER_UPDATE, this.peers);
      // }
      //
      // if(joinedUsers.length > 0) {
      //   this.emit(roomEvents.USER_JOIN, joinedUsers);
      // }
      //
      // if(leftUsers.length > 0) {
      //   this.emit(roomEvents.USER_LEAVE, leftUsers);
      // }
      //debug('_getUsers: Current peers: %s', peers.length);
    });
  }

  /**
   *
   * @private
   */
  _bindToPubSub() {
    eventLoggerProxy(this.pubsub, connectorEvents.MESSAGE, this._handlePubSubMessage.bind(this));
    eventLoggerProxy(this.pubsub, connectorEvents.ERROR, this._handlePubSubError.bind(this));
  }

  /**
   *
   * @private
   */
  _startHeartbeat() {
    this._stopHeartbeat();
    this._getUsers();
    this._heartbeatTimer = setInterval(this._getUsers, 1000);
  }

  /**
   *
   * @private
   */
  _stopHeartbeat() {
    clearInterval(this._heartbeatTimer);
  }

  /////////////////////////////////////////////////////////////////////////////
  //
  // EVENT HANDLERS

  _handlePubSubMessage(message) {

  }

  _handlePubSubError(err) {

  }
}

module.exports = Room;
