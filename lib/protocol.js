const crypto = require('crypto')

const uuid = require('uuid');

const secret = 'l33t';

const debug = require('debug')('hello-pubsub:protocol');

/**
 *
 * @param {string} instruction
 * @param {object} data
 * @returns {string}
 */
const generateCommand = (instruction, data) => {
  debug('Generate command: %s', instruction);

  const command = {
    id: uuid(),
    date: Date.now(),
    instruction,
    data,
  };

  return encodeCommand(command);
};

/**
 *
 * @param {object} command
 * @returns {string}
 * @private
 */
const encodeCommand = (command) => {
  const commandPayloadJSON = JSON.stringify(command);

  command.checkSum = crypto.createHmac('sha256', secret)
    .update(commandPayloadJSON)
    .digest('base64');

  const completeCommandJSON = JSON.stringify(command);
  return Buffer.from(completeCommandJSON).toString('base64');
};

/**
 *
 * @param {Buffer} commandBuffer
 * @private
 */
const decodeCommand = (commandBuffer) => {
  const decodedCommand = Buffer.from(commandBuffer.toString('utf8'), 'base64')
    .toString('ascii');
  const command = JSON.parse(decodedCommand);

  const { checkSum, ...commandPayload } = command;

  const commandPayloadJSON = JSON.stringify(commandPayload);

  const checkSumTest = crypto.createHmac('sha256', secret)
    .update(commandPayloadJSON)
    .digest('base64');

  if(checkSum !== checkSumTest) {
    debug('Command checksum fail! (expected: %s, actual: %s)', checkSum, checkSumTest);
    return null;
  }

  return commandPayload;
}

module.exports = {
  commands: {
    join: handle => {
      return generateCommand('JOIN', { handle });
    },

    sendMessage: message => {
      return generateCommand('MSG', { message });
    },

    sendMessageTo: (handle, message) => {
      return generateCommand('MSG_TO', { handle, message })
    },
  },

  decode: message => {
    return decodeCommand(message);
  }
};
