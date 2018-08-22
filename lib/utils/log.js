const chalk = require('chalk');

let contextRoot = process.env.LOGGER_CONTEXT_ROOT || 'logger';

class Logger {

  /**
   *
   * @param {string} title
   */
  constructor (title) {
    this.title = title;

    this.colors = {

      commOut: chalk.black.bgMagenta,
      commIn: chalk.black.bgCyan,

      trace: chalk.gray,
      debug: chalk.blueBright,
      info: chalk.greenBright,
      warn: chalk.yellowBright,
      error: chalk.redBright,
    }
  }


  /**
   *
   * @param {string} message
   * @param {...} options
   */
  banner(message, options) {

  }


  /**
   *
   * @param {string} message
   */
  commOut(message) {
    this._print('commOut', message);
  }

  /**
   *
   * @param {string} message
   */
  commIn(message) {
    this._print('commIn', message);
  }

  /**
   *
   * @param {string} message
   * @param {...} options
   */
  trace(message, ...options) {
    this._print('trace', message, options);
  }


  /**
   *
   * @param {string} message
   * @param {...} options
   */
  debug(message, ...options) {
    this._print('debug', message, options);
  }


  /**
   *
   * @param {string} message
   * @param {...} options
   */
  info(message, ...options) {
    this._print('info', message, options);
  }


  /**
   *
   * @param {string} message
   * @param {...} options
   */
  warn(message, ...options) {
    this._print('warn', message, options);
  }


  /**
   *
   * @param {Error|string} err
   * @param {string|...} message
   * @param {...} options
   */
  error(err, message, ...options) {
    if(err instanceof Error) {
      message += '\n' + chalk.white(err.toString()) + '\n' + chalk.red(err.stack);
    } else {
      options = message;
      message = err;
    }

    this._print('error', message, options);
  }


  /**
   *
   * @param {LevelEnum} level
   * @param {string} message
   * @param {...} options
   * @private
   */
  _print(level, message, options) {
    const output = this.colors[level](`[${contextRoot}][${this.title}][${level}] ${message}`);

    options = this._formatOptions(options);

    console.log.apply(null, [output, ...options]);
  }


  /**
   *
   * @param {Array} options
   * @return {Array}
   * @private
   */
  _formatOptions(options) {
    if(typeof options === 'undefined') return [];

    // @TODO Make better
    return options.map(arg => {
      if(typeof arg === 'string') {
        return chalk.white.underline(arg);
      }

      return arg;
    });
  }
}


/**
 *
 * @param {string} title
 * @return {Logger}
 */
module.exports = (title) => {
  return new Logger(title);
};
