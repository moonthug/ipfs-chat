require('dotenv').config()

const path = require('path');

const IPFS = require('ipfs');
const restify = require('restify');

const Connectors = require('./lib/connectors');
const Room = require('./lib/room');
const RoomEvents = require('./lib/constants/roomEvents');

const log = require('./lib/utils/log')('index');


//
// ROOM

let room;


let messageLog = [];
const addToLog = (message) => {
  messageLog.push({ date: Date.now(), message });

  if(messageLog.length > 10) {
    messageLog = messageLog.splice(1);
  }
}

//
// IPFS

const ipfsConnector = Connectors.create(Connectors.types.IPFS, new IPFS({
  EXPERIMENTAL: {
    pubsub: true
  },
  repo: path.join(__dirname, '.repo', 'server'),
  config: {
    Addresses: {
      Swarm: [
        '/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star'
      ]
    }
  }
}));

ipfsConnector.on('ready', () => {
  log.debug('IPFS Ready!');

  const roomOptions = {
    key: process.env.KEY,
    iv: process.env.IV,
    privateKey: path.join(__dirname, '.certs', 'private.pem'),
    publicKey: path.join(__dirname, '.certs', 'public.pem'),
  };

  room = new Room(ipfsConnector, process.env.ROOM_NAME, roomOptions);
  room.start();

  // room.on(RoomEvents.USER_UPDATE, (peers) => {
  //   console.log('Peers', peers.length);
  // });

  room.on(RoomEvents.USER_JOIN, (peers) => {
    console.log('Peer(s) joined the room', peers.length);
  });

  room.on(RoomEvents.USER_LEAVE, (peers) => {
    console.log('Peer(s) left the room', peers.length);
  });

  room.on(RoomEvents.MESSAGE, (message) => {
    console.log('Message: ', JSON.stringify(message, null, 2));
    addToLog(message);
  });

  room.on(RoomEvents.JOIN, (topic) => {
    log.debug('IPFS Subscribed to %s', topic);
  });

  room.on(RoomEvents.ERROR, (err) => {
    console.log('Now connected!');
  });
});

ipfsConnector.on('error', err => {
  log.debug(err);
});



//
// RESTIFY

const server = restify.createServer({
  name: 'status-server',
  version: '1.0.0'
});

server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());

server.get('/status', function (req, res, next) {
  res.json({
    ipfs: {
      online: ipfs.isOnline()
    },
    room: {
      name: room.name,
      peerCount: room.peers.length,
      peers: room.peers,
      log: messageLog
    }
  });

  return next();
});

server.listen(4000, function () {
  log.debug('%s listening at %s', server.name, server.url);
});
