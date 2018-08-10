require('dotenv').config()

const path = require('path');

const IPFS = require('ipfs');
const restify = require('restify');

const Room = require('./lib/room');
const RoomEvents = require('./lib/constants/room-events');

const debug = require('debug')('hello-pubsub');


//
// ROOM

let room;


let log = [];
const addToLog = (message) => {
  log.push({ date: Date.now(), message });

  if(log.length > 10) {
    log = log.splice(1);
  }
}

//
// IPFS

const ipfs = new IPFS({
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
});

ipfs.on('ready', () => {
  debug('IPFS Ready!');

  const roomOptions = {
    key: process.env.KEY,
    iv: process.env.IV,
    privateKey: path.join(__dirname, '.certs', 'private.pem'),
    publicKey: path.join(__dirname, '.certs', 'public.pem'),
  };

  room = new Room(ipfs, process.env.ROOM_NAME, roomOptions);
  room.start();

  // room.on(RoomEvents.PEER_UPDATE, (peers) => {
  //   console.log('Peers', peers.length);
  // });

  room.on(RoomEvents.PEER_JOIN, (peers) => {
    console.log('Peer(s) joined the room', peers.length);
  });

  room.on(RoomEvents.PEER_LEAVE, (peers) => {
    console.log('Peer(s) left the room', peers.length);
  });

  room.on(RoomEvents.MESSAGE, (message) => {
    console.log('Message: ', JSON.stringify(message, null, 2));
    addToLog(message);
  });

  room.on(RoomEvents.SUBSCRIBED, (topic) => {
    debug('IPFS Subscribed to %s', topic);
  });

  room.on(RoomEvents.ERROR, (err) => {
    console.log('Now connected!');
  });
});

ipfs.on('error', err => {
  debug(err);
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
      log: log
    }
  });

  return next();
});

server.listen(4000, function () {
  debug('%s listening at %s', server.name, server.url);
});
