const Connector = require('./Connector');

const connectorEvents = require('../constants/connectorEvents');

const eventLoggerProxy = require('../utils/eventLoggerProxy');

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
   */
  publish() {

  }

  /**
   *
   */
  subscribe(topic) {
    return new Promise((accept, reject) => {
      this.ipfs.pubsub.subscribe(topic,
        this._messageHandler,

        // Subscribed
        err => {
          if(err) {
            log.error('Subscribing to topic \'%s\' failed', topic);
            return reject(err);
          }

          log.debug('Subscribed to topic \'%s\'', topic);
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
    eventLoggerProxy

    //['ready', 'error'].forEach(event => this.ipfs.on(event, () => this.emit(event)));
  }

  /**
   *
   * @param {object} receivedMessage
   * @private
   */
  _messageHandler(receivedMessage) {
    log.debug('receivedMessage: %O', receivedMessage);
    const message = protocol.decode(
      this.cipher.decrypt(receivedMessage.data)
    );

    this.emit(connectorEvents.MESSAGE, {
      from: receivedMessage.from,
      message
    });
  }
}

module.exports = IPFSConnector;
