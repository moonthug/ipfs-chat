class ConnectorService {
  /**
   *
   * @param {Connector} connector
   */
  constructor(connector) {
    this._connector = connector;
  }

  /**
   *
   * @returns {boolean}
   */
  isOnline() {
    return this._connector.isOnline();
  }
}

module.exports = ConnectorService;
