const IPFS = require('ipfs')

let _instance = null;

class IPFSNode extends EventEmitter {
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
            debug('Subscribing to topic: %s', this.topic);
            return this.emit(roomEvents.ERROR, err);
          }

          debug(`Subscribed!`);
          this.emit(roomEvents.JOIN, this.topic);

          this._startHeartbeat();
          this._getUsers();
        }
      );
    });
  }

  _setupEvents() {
    this.ipfs.on('ready', () => this.emit('ready'))
  }
}

module.exports = () => {
  return (ipfs) => {
    if(!_instance) {
      if(!ipfs) {
        throw new Error('IPFS needs to be initialised');
      }
      _instance = new IPFSNode(ipfs);
    }
    return _instance;
  }
}
