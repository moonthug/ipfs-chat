const chalk = require('chalk');

let contextRoot = process.env.LOGGER_CONTEXT_ROOT || 'logger';

class Logger {

  constructor (title) {
    this.title = title;

    this.colors = {
      trace: chalk.gray,
      debug: chalk.blueBright,
      info: chalk.greenBright,
      warn: chalk.yellowBright,
      error: chalk.redBright,
    }
  }

  banner(message, args) {

  }

  trace(message, ...args) {
    this._print('trace', message, args);
  }

  debug(message, ...args) {
    this._print('debug', message, args);
  }

  info(message, ...args) {
    this._print('info', message, args);
  }

  warn(message, ...args) {
    this._print('warn', message, args);
  }

  error(message, ...args) {
    this._print('error', message, args);
  }

  _print(level, message, args) {
    const output = this.colors[level](`[${contextRoot}][${this.title}][${level}] ${message}`);

    args = this._formatArgs(args);

    console.log.apply(null, [output, ...args]);
  }

  _formatArgs(args) {
    // @TODO Make better
    return args.map(arg => {
      if(typeof arg === 'string') {
        return chalk.white.underline(arg);
      }

      return arg;
    });
  }
}

module.exports = (title) => {
  return new Logger(title);
}
