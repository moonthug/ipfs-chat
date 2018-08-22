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

const StringUtils = require('./utils/string');

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
      .then((peerId) => {
        this._peerId = peerId;
        log.debug('My PeerID is \'%s\'', this._peerId);
      })
      .catch((err) => log.error('Cannot retrieve PeerId', err));

    this.cipher = new Cipher(options.key, options.iv);

    this._setupProtocol();
  }

  /**
   *
   * @return {Promise<any>}
   */
  start() {
    return new Promise((accept, reject) => {
      if (this.pubsub.isOnline() !== true) {
        log.warn(`Not online! Cannot subscribe`);
        reject(new Error('Not online! Cannot subscribe'));
      }

      log.debug('Subscribing to topic \'%s\'', this.topic);

      this.pubsub.subscribe(this.topic)
        .then(() => {
          log.info('Subscribed to topic \'%s\'', this.topic);
          this.emit(roomEvents.JOIN, this.topic);

          this._bindToPubSub();
          this._startHeartbeat();

          // @todo REMOVE
          setTimeout(()=> {
            this.protocol.join('alex');
          }, 1000);

          return accept();
        })
        .catch((err) =>{
          log.error(err, 'Subscribing to topic \'%s\' failed', this.topic);
          this.emit(roomEvents.ERROR, err);

          return reject(err);
        });
    });
  }

  /**
   *
   */
  stop() {
    this.pubsub.unsubscribe(this.topic)
      .then(() => {
        log.info('Unsubscribed from topic: %s');
        this.emit(roomEvents.LEAVE, this.topic);
      })
      .catch(err => {
        log.error(err, 'Unsubscribing from topic \'%s\' failed', this.topic);
        return this.emit(roomEvents.ERROR, err);
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

    log.debug('Protocol loaded: %o', Object.keys(this.protocol));
  }

  /**
   *
   * @param {string} message
   */
  _publish(message) {
    const messageBuffer = this.cipher.encrypt(message);

    this.pubsub.publish(this.topic, messageBuffer)
      .then(() => {
        log.commOut(Buffer.from(message, 'base64').toString('utf8'));
        log.debug('Published to \'%s\': %s', this.topic, StringUtils.crumple(message));
        this.emit(roomEvents.SENT, message);
      })
      .catch(err => {
        log.error(err, 'Publishing to \'%s\' failed', this.topic);
        this.emit(roomEvents.ERROR, err);
      });
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
   * @private
   */
  _getUsers() {
    // this.ipfs.pubsub.peers((err, peers) => {
    //   if (err) {
    //     debug(`_getUsers: Cannot list peers`, err);
    //     return false;
    //   }
    //
    //   // const joinedUsers = peers.filter(peer => {
    //   //   return this.peers.(peer) === -1;
    //   // });
    //   //
    //   // const leftUsers = this.peers.filter(peer => {
    //   //   return peers.indexOf(peer) === -1;
    //   // });
    //   //
    //   // this.peers = peers;
    //   //
    //   // if(joinedUsers.length > 0 && leftUsers.length > 0) {
    //   //   this.emit(roomEvents.USER_UPDATE, this.peers);
    //   // }
    //   //
    //   // if(joinedUsers.length > 0) {
    //   //   this.emit(roomEvents.USER_JOIN, joinedUsers);
    //   // }
    //   //
    //   // if(leftUsers.length > 0) {
    //   //   this.emit(roomEvents.USER_LEAVE, leftUsers);
    //   // }
    //   //debug('_getUsers: Current peers: %s', peers.length);
    // });
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

  /**
   *
   * @param receivedMessage
   * @private
   */
  _handlePubSubMessage(receivedMessage) {
    const message = roomProtocol.decode(
      this.cipher.decrypt(receivedMessage.data)
    );

    log.commIn(JSON.stringify(message));

    this.emit(roomEvents.MESSAGE, {
      from: receivedMessage.from,
      message
    });
  }

  /**
   *
   * @param err
   * @private
   */
  _handlePubSubError(err) {

  }
}

module.exports = Room;
