const Connector = require('./Connector');

const connectorEvents = require('../constants/connectorEvents');

const eventLoggerProxy = require('../utils/eventLoggerProxy');

const StringUtils = require('../utils/string');
const log = require('../utils/log')('IPFSConnector');

class IPFSConnector extends Connector {
  /**
   *
   * @param {IPFS} ipfs
   */
  constructor(ipfs) {
    super();
    this.ipfs = ipfs;

    this._setupEvents();
  }

  /**
   *
   * @param {string} topic
   * @param {Buffer} message
   * @return {Promise}
   */
  publish(topic, message) {
    return new Promise((accept, reject) => {
      this.ipfs.pubsub.publish(topic, message, err => {
          if(err) {
            log.error(err, 'Publishing message \'%s\' failed', StringUtils.crumple(message));
            return reject(err);
          }
          this.emit(connectorEvents.PUBLISHED, message);
          return accept(message);
        }
      );
    });
  }

  /**
   *
   * @param {string} topic
   * @return {Promise}
   */
  subscribe(topic) {
    return new Promise((accept, reject) => {
      this.ipfs.pubsub.subscribe(topic,
        this._handleMessage.bind(this),
        err => {
          if(err) {
            log.error('Subscribing to topic \'%s\' failed', topic);
            return reject(err);
          }
          this.emit(connectorEvents.SUBSCRIBED, topic);
          return accept(topic);
        }
      );
    });
  }

  /**
   *
   * @returns {boolean}
   */
  isOnline() {
    return this.ipfs.isOnline();
  }

  /**
   *
   * @returns {Promise<string>}
   */
  getPeerId() {
    return new Promise((accept, reject) => {
      this.ipfs.id(function (err, peerId) {
        if (err) {
          log.error('Getting \`peerId\` failed', err);
          return reject(err);
        }
        accept(peerId);
      });
    });
  }

  /**
   *
   * @private
   */
  _setupEvents() {
    eventLoggerProxy(this.ipfs, 'ready', this._handleConnected.bind(this));
    eventLoggerProxy(this.ipfs, 'error', e => this.emit(connectorEvents.ERROR, e));
  }

  /**
   *
   * @private
   */
  _handleConnected() {
    this.getPeerId();
    this.emit(connectorEvents.CONNECTED);
  }

  /**
   *
   * @param {object} receivedMessage
   * @private
   */
  _handleMessage(receivedMessage) {
    this.emit(connectorEvents.MESSAGE, receivedMessage);
  }


}

module.exports = IPFSConnector;
