const ConnectorService = require('./ConnectorService');

class KeyStoreService extends ConnectorService {
  /**
   *
   * @param {Connector} connector
   */
  constructor(connector) {
    super(connector);
  }
}

module.exports = KeyStoreService;
