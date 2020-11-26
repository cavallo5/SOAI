/* eslint-disable no-console */
'use strict'

const Libp2p = require('libp2p')
const TCP = require('libp2p-tcp')
const WebSockets = require('libp2p-websockets')
const { NOISE } = require('libp2p-noise')
const MPLEX = require('libp2p-mplex')
const pipe = require('it-pipe')

const createNode = async (transports, addresses = []) => {
  if (!Array.isArray(addresses)) {
    addresses = [addresses]
  }

  const node = await Libp2p.create({
    addresses: {
      listen: addresses
    },
    modules: {
      transport: transports,
      connEncryption: [NOISE],
      streamMuxer: [MPLEX]
    }
  })

  await node.start()
  return node
}

function printAddrs(node, number) {
  console.log('node %s is listening on:', number)
  node.multiaddrs.forEach((ma) => console.log(`${ma.toString()}/p2p/${node.peerId.toB58String()}`))
}

function print ({ stream }) {
  pipe(
    stream,
    async function (source) {
      for await (const msg of source) {
        console.log(msg.toString())
      }
    }
  )
}

;(async () => {
  const [node1, node2, node3, node4, node5] = await Promise.all([
    createNode([TCP], '/ip4/127.0.0.1/tcp/0'), //nodo 1 con tcp
    createNode([TCP], '/ip4/127.0.0.1/tcp/0'), //nodo 2 con tcp
    createNode([TCP], '/ip4/127.0.0.1/tcp/0'), //nodo 3 con tcp
    createNode([TCP], '/ip4/127.0.0.1/tcp/0'), //nodo 4 con tcp
    createNode([WebSockets], '/ip4/127.0.0.1/tcp/2020/ws') //nodo 5 con websocket
  ])

  printAddrs(node1, '1')
  printAddrs(node2, '2')
  printAddrs(node3, '3')
  printAddrs(node4, '4')
  printAddrs(node5, '5')

  //Gestori della comunicazione dei nodi che stampano solo i messaggi ricevuti
  node1.handle('/print', print)
  node2.handle('/print', print)
  node3.handle('/print', print)
  node4.handle('/print', print)
  node5.handle('/print', print)


  node1.peerStore.addressBook.set(node2.peerId, node2.multiaddrs)
  node2.peerStore.addressBook.set(node3.peerId, node3.multiaddrs)
  node3.peerStore.addressBook.set(node4.peerId, node4.multiaddrs)
  node4.peerStore.addressBook.set(node5.peerId, node5.multiaddrs)
  node5.peerStore.addressBook.set(node1.peerId, node1.multiaddrs)




  // node 1 (TCP) comunica con il nodo 2 (TCP)
  const { stream } = await node1.dialProtocol(node2.peerId, '/print')
  await pipe(
    ['nodo 1 ha comunicato con il nodo 2 correttamente'],
    stream
  )

  // node 2 (TCP) comunica con il nodo 3 (TCP)
  const { stream: stream2 } = await node2.dialProtocol(node3.peerId, '/print')
  await pipe(
    ['nodo 2 ha comunicato con il nodo 3 correttamente'],
    stream2
  )

  // node 3 (TCP) comunica con il nodo 4 (TCP)
  const { stream: stream3 } = await node3.dialProtocol(node4.peerId, '/print')
  await pipe(
    ['nodo 3 ha comunicato con il nodo 4 correttamente'],
    stream3
  )

  // node 4 (TCP) comunica con il nodo 5 (WebSockets)
  try {
    await node4.dialProtocol(node5.peerId, '/print') //so già che mi darà errore 
  } catch (err) {
    console.log('nodo 4 ha fallito la comunicazione con il nodo 5 con:', err.message)
  }

})();
