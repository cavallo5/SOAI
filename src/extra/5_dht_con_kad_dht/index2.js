'use strict'
const Libp2p = require('../node_modules/libp2p')
const TCP = require('../node_modules/libp2p-tcp')
const Mplex = require('../node_modules/libp2p-mplex')
const { NOISE } = require('../node_modules/libp2p-noise')
const CID = require('../node_modules/cids')
const pipe = require('../node_modules/it-pipe')
const KadDHT = require('../node_modules/libp2p-kad-dht')

const all = require('../node_modules/it-all')
const delay = require('../node_modules/delay')

const createNode = async () => {
  const node = await Libp2p.create({
    addresses: {
      listen: ['/ip4/127.0.0.1/tcp/0']
    },
    modules: {
      transport: [TCP],
      streamMuxer: [Mplex],
      connEncryption: [NOISE],
      dht: KadDHT
    },
    config: {
      dht: {
        enabled: true
      }
    }
  })

  await node.start()
  return node
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
  const [node1, node2, node3, node4, node5, node6, node7, node8, node9, node10] = await Promise.all([
    createNode(),
    createNode(),
    createNode(),
    createNode(),
    createNode(),
    createNode(),
    createNode(),
    createNode(),
    createNode(),
    createNode()
  ])

  console.log('Nodo 1 avviato:\n PeerId %s \n', node1.peerId.toB58String())
  console.log('Nodo 2 avviato:\n PeerId %s \n', node2.peerId.toB58String())
  console.log('Nodo 3 avviato:\n PeerId %s \n', node3.peerId.toB58String())
  console.log('Nodo 4 avviato:\n PeerId %s \n', node4.peerId.toB58String())
  console.log('Nodo 5 avviato:\n PeerId %s \n', node5.peerId.toB58String())
  console.log('Nodo 6 avviato:\n PeerId %s \n', node6.peerId.toB58String())
  console.log('Nodo 7 avviato:\n PeerId %s \n', node7.peerId.toB58String())
  console.log('Nodo 8 avviato:\n PeerId %s \n', node8.peerId.toB58String())
  console.log('Nodo 9 avviato:\n PeerId %s \n', node9.peerId.toB58String())
  console.log('Nodo 10 avviato:\n PeerId %s \n', node10.peerId.toB58String())



  node1.handle('/print', print)
  node2.handle('/print', print)
  //node3.handle('/print', print)
  node3.handle('/print', ({ stream }) => {
  pipe(
    stream,
    source => (async function () {
      for await (const msg of source) {
        console.log(msg.toString())
        const { stream: stream3 } = await node3.dialProtocol(node1.peerId, '/print')
        await pipe(
          ['Nodo 3: Invio file'],
          stream3
        )

      }
    })()
  )
  })
  node4.handle('/print', print)
  node5.handle('/print', print)
  node6.handle('/print', print)
  node7.handle('/print', print)
  node8.handle('/print', print)
  node9.handle('/print', print)
  node10.handle('/print', ({ stream }) => {
  pipe(
    stream,
    source => (async function () {
      for await (const msg of source) {
        console.log(msg.toString())
        const { stream: stream10 } = await node10.dialProtocol(node1.peerId, '/print')
        await pipe(
          ['Nodo 10: Invio file'],
          stream10
        )

      }
    })()
  )
  })



  node1.peerStore.addressBook.set(node2.peerId, node2.multiaddrs)
  node2.peerStore.addressBook.set(node3.peerId, node3.multiaddrs)
  node3.peerStore.addressBook.set(node4.peerId, node4.multiaddrs)
  node4.peerStore.addressBook.set(node5.peerId, node5.multiaddrs)
  node5.peerStore.addressBook.set(node6.peerId, node6.multiaddrs)
  node6.peerStore.addressBook.set(node7.peerId, node7.multiaddrs)
  node7.peerStore.addressBook.set(node8.peerId, node8.multiaddrs)
  node8.peerStore.addressBook.set(node9.peerId, node9.multiaddrs)
  node9.peerStore.addressBook.set(node10.peerId, node10.multiaddrs)
  node10.peerStore.addressBook.set(node1.peerId, node1.multiaddrs)

  await Promise.all([
    node1.dial(node2.peerId),
    node2.dial(node3.peerId),
    node3.dial(node4.peerId),
    node4.dial(node5.peerId),
    node5.dial(node6.peerId),
    node6.dial(node7.peerId),
    node7.dial(node8.peerId),
    node8.dial(node9.peerId),
    node9.dial(node10.peerId),
    node10.dial(node1.peerId)

  ])
  await delay(100)

  const cid = new CID('QmTp9VkYvnHyrqKQuFPiuZkiX9gPcqj6x5LJ1rmWuSySnL')
  await node10.contentRouting.provide(cid)

  console.log('Nodo %s fornisce %s', node10.peerId.toB58String(), cid.toBaseEncodedString())

  // attesa per la propagazione ai nodi vicini
  await delay(300)


  //Nodo 1 cerca il nodo che ha il CID
  const providers = await all(node1.contentRouting.findProviders(cid, { timeout: 3000 }))
  console.log('Nodo 1: Risorsa trovata nel nodo possessore con PeerId ', providers[0].id.toB58String())
  console.log('COMUNICAZIONE')

  const { stream } = await node1.dialProtocol(providers[0].id, '/print')
  console.log('Nodo 1:Richiesta -cid:'+cid)
  await pipe(
    [''+cid],
    stream
  )


})();






