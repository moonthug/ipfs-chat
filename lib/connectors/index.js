const IPFSConnector = require('./IPFS');

const ConnectorError = require('../errors/Connector');

const ConnectorTypes = {
  IPFS: 'IPFS'
};

let _instance = null;

/**
 *
 * @param {ConnectorTypes} type
 * @param {*} client
 * @param {Object=} options
 * @throws {Error}
 * @returns {Connector}
 */
const createConnector = (type, client, options) => {
  if(_instance) {
    throw new ConnectorError(`Connector already exists with status: ${_instance.getStatus()}`);
  }

  switch (type) {
    case ConnectorTypes.IPFS: {
      return new IPFSConnector(client);
    }
  }

  throw new ConnectorError(`Unknown connector type: ${type}`);
};

/**
 *
 * @returns {Connector}
 */
const getConnector = () => {
  return _instance;
};

/**
 *
 */
module.exports = {
  create: createConnector,
  get: getConnector,
  types: ConnectorTypes
};
