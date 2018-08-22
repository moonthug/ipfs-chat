module.exports = {
  /**
   *
   * @param {string} input
   * @param {number=8} length
   * @return {*}
   */
  crumple: (input, length) => {
    input = input.toString();
    length = length || 8;

    if(input.length < length * 2) return input;

    return input.substr(0, length) + '...' + input.substr(input.length - length, length);
  }
};