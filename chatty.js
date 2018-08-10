require('dotenv').config()

const cluster = require('cluster');
const path = require('path');

const IPFS = require('ipfs');
const randomwords = require('random-words');

const Room = require('./lib/room');
const RoomEvents = require('./lib/constants/room-events');


const workerEvents = {
  SUBSCRIBED: 'SUBSCRIBED',
  MESSAGE: 'MESSAGE',
}

if (cluster.isMaster) {
  const debug = require('debug')('chatty:master');

  debug('Master started: #%s', process.pid);

  const workerCount = process.env.WORKER_COUNT && process.env.WORKER_COUNT !== '-1' ? parseInt(process.env.WORKER_COUNT) : require('os').cpus().length;

  debug('Starting %s workers', workerCount);

  for (let i = 0; i < workerCount; i++) {
    debug('Worker %s started', i);
    cluster.fork();
  }

  for (const id in cluster.workers) {
    cluster.workers[id].on('message', message => {
      switch (message.event) {
        case workerEvents.SUBSCRIBED:
          debug('Worker %s Subscribed: %O', id, message.payload.peerId.id);
          break;
        case workerEvents.MESSAGE:
          debug('Worker %s sent: %s', id, message.payload.message);
          break;
      }
    });
  }

  cluster.on('exit', (worker, code, signal) => {
    debug('Worker #%s died [code: %s, signal: %s]', worker.process.pid, code, signal);
  });
}
else {
  const debug = require('debug')('chatty:' + process.pid);
  debug('Starting IPFS...');

  //
  // HELPER

  const sendWorkerEvent = (workerEventName, payload) => {
    process.send({ event: workerEventName, payload })
  }

  //
  // IPFS

  const ipfs = new IPFS({
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
  });

  ipfs.on('ready', () => {
    debug('IPFS Ready');

    const roomOptions = {
      key: process.env.KEY,
      iv: process.env.IV,
      privateKey: path.join(__dirname, '.certs', 'private.pem'),
      publicKey: path.join(__dirname, '.certs', 'public.pem'),
    };

    const room = new Room(ipfs, process.env.ROOM_NAME, roomOptions);
    room.start();

    room.on(RoomEvents.SUBSCRIBED, (topic) => {
      debug('IPFS Subscribed to %s', topic);

      ipfs.id(function (err, peerId) {
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

    room.on(RoomEvents.ERROR, (err) => {
      console.log('Error!', err);
    });
  });
}
