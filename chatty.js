require('dotenv').config()

const cluster = require('cluster');
const path = require('path');

const IPFS = require('ipfs');
const randomwords = require('random-words');

const Connectors = require('./lib/connectors');

const Room = require('./lib/room');
const RoomEvents = require('./lib/constants/roomEvents');


const workerEvents = {
  SUBSCRIBED: 'JOIN',
  MESSAGE: 'MESSAGE',
}

if (cluster.isMaster) {
  const log = require('./lib/utils/log')('chatty-master');

  log.debug('Master started: #%s', process.pid);

  const workerCount = process.env.WORKER_COUNT && process.env.WORKER_COUNT !== '-1' ? parseInt(process.env.WORKER_COUNT) : require('os').cpus().length;

  log.debug('Starting %s workers', workerCount);

  for (let i = 0; i < workerCount; i++) {
    log.debug('Worker %s started', i);
    cluster.fork();
  }

  for (const id in cluster.workers) {
    cluster.workers[id].on('message', message => {
      switch (message.event) {
        case workerEvents.SUBSCRIBED:
          log.trace('Worker %s Subscribed: %O', id, message.payload.peerId.id);
          break;
        case workerEvents.MESSAGE:
          log.trace('Worker %s sent: %s', id, message.payload.message);
          break;
      }
    });
  }

  cluster.on('exit', (worker, code, signal) => {
    debug('Worker #%s died [code: %s, signal: %s]', worker.process.pid, code, signal);
  });
}
else {
  const log = require('./lib/utils/log')('chatty-' + process.pid);

  log.debug('Starting IPFS...');

  //
  // HELPER

  const sendWorkerEvent = (workerEventName, payload) => {
    process.send({ event: workerEventName, payload })
  }

  //
  // IPFS

  const ipfsConnector = Connectors.create(Connectors.types.IPFS, new IPFS({
    EXPERIMENTAL: {
      pubsub: true
    },
    repo: path.join(__dirname, '.repo', 'chatty', process.pid.toString()),
    config: {
      Addresses: {
        Swarm: [
          '/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star'
        ]
      }
    }
  }));

  ipfsConnector.on('ready', () => {
    log.debug('IPFS Ready');

    const roomOptions = {
      key: process.env.KEY,
      iv: process.env.IV,
      privateKey: path.join(__dirname, '.certs', 'private.pem'),
      publicKey: path.join(__dirname, '.certs', 'public.pem'),
    };

    const room = new Room(ipfsConnector, process.env.ROOM_NAME, roomOptions);

    room.on(RoomEvents.JOIN, (topic) => {
      log.debug('IPFS Subscribed to %s', topic);

      this.ipfs.id((err, peerId) => {
        if (err) {
          throw err
        }
        sendWorkerEvent(workerEvents.SUBSCRIBED, { peerId, topic })
      });

      setInterval(() => {
        const words = randomwords({ min: 4, max: 20, join: ' ' })
        room.protocol.sendMessage(words);
        sendWorkerEvent(workerEvents.MESSAGE, { message: words })
      }, Math.random() * 20000 + 5000);
    });

    room.on(RoomEvents.MESSAGE, (topic) => {
      log.debug('Got Message');
    });

    room.on(RoomEvents.ERROR, (err) => {
      log.error('Error!', err);
    });

    room.start();
  });
}
