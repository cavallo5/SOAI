'use strict'

/*
 * Nodo destinatario, in ascolto che risponde con lo stesso messaggio ricevuto
 */

const libp2p = require('../node_modules/libp2p')
const multiaddr = require('../node_modules/multiaddr')
const PeerId = require('../node_modules/peer-id')
const pipe = require('../node_modules/it-pipe')
const TCP = require('../node_modules/libp2p-tcp')
const WS = require('../node_modules/libp2p-websockets')
const SECIO = require('../node_modules/libp2p-secio') //crittografia della connessione
const MPLEX = require('../node_modules/libp2p-mplex')
const { NOISE } = require('../node_modules/libp2p-noise')

async function run() {
  const destinatarioId = await PeerId.createFromJSON(require('./id-d'))

  const destinatarioNode =await libp2p.create({
    addresses: {
      listen: ['/ip4/127.0.0.1//tcp/10300']
    },
    modules: {
      transport: [TCP], //protocollo di trasporto per connessione tra peer della stessa rete
      connEncryption: [SECIO], //crittografia della connessione 
      streamMuxer: [MPLEX] //stream multiplexing 
    },
    peerId: destinatarioId
  })

  // log quando riceve una comunicazione 
  destinatarioNode.connectionManager.on('peer:connect', (connection) => {
    console.log('Comunicazione avviata dal peer: ', connection.remotePeer.toB58String()) //connection.remotePeer.toB58String fornisce il PeerId del peer che ha avviato la comunicazione
  })

  //Gestione della comunicazione di ingresso e invio del messaggio echo al mittente
  await destinatarioNode.handle('/echo/1.0.0', ({ stream }) => pipe(stream.source, stream.sink))

  // Avvio peer
  await destinatarioNode.start()

  console.log('Peer destinatario pronto, in ascolto su:')
  destinatarioNode.multiaddrs.forEach((ma) => {
    console.log(ma.toString() + '/p2p/' + destinatarioId.toB58String())
  })
}

run()
