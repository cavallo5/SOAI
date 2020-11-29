'use strict'

/*
 * Nodo mittente che avvia la comunicazione e attende l'echo
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
  const [mittenteId, destinatarioId] = await Promise.all([
    PeerId.createFromJSON(require('./id-m')),
    PeerId.createFromJSON(require('./id-d'))
  ])

  // Mittente
  const mittenteNode =await libp2p.create({
    addresses: {
      listen: ['/ip4/127.0.0.1//tcp/0']
    },
    modules: {
      transport: [TCP], //protocollo di trasporto per connessione tra peer della stessa rete
      connEncryption: [SECIO], //crittografia della connessione 
      streamMuxer: [MPLEX] //stream multiplexing 
    },
    peerId: mittenteId
  })

  //Aggiungo il peer destinatario nel PeerStore
  const destinatarioMultiaddr = '/ip4/127.0.0.1/tcp/10300/p2p/' + destinatarioId.toB58String()

  // Avvio del nodo mittente
  await mittenteNode.start()

  console.log('Peer mittente pronto, in ascolto su:')
  mittenteNode.multiaddrs.forEach((ma) => console.log(ma.toString() +
        '/p2p/' + mittenteId.toB58String()))

  // Avvio la comunicazione con il nodo destinatario
  console.log('Comunicazione con il peer: ', destinatarioMultiaddr)
  const { stream } = await mittenteNode.dialProtocol(destinatarioMultiaddr, '/echo/1.0.0')

  pipe(
    // Source data
    ['hello'],
    //Scrive nello stream
    stream,
    async function (source) {
      for await (const data of source) {//per ogni blocco di dati
        console.log('ricezione:', data.toString()) //mostra messaggio ricevuto
      }
    }
  )
}

run()
