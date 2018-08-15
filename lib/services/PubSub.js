const ConnectorService = require('./ConnectorService');

class PubSubService extends ConnectorService {

  /**
   *
   * @param {Connector} connector
   */
  constructor(connector) {
    super(connector);
  }

  on(event, callback) {
    return this._connector.on(event);
  }

  /**
   *
   * @param {string} topic
   */
  subscribe(topic) {
    return this._connector.subscribe(topic);
  }

  /**
   *
   * @param {string} topic
   */
  unsubscribe(topic) {
    return this._connector.unsubscribe(topic);
  }

  /**
   *
   * @param {string} message
   */
  publish(message) {
    return this._connector.publish(message);
  }

}

module.exports = PubSubService;
