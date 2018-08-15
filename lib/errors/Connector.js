class ConnectorError extends Error {
  constructor(message) {
    super(message);
  }
}

module.exports = ConnectorError;
