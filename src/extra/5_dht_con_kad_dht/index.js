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
  const [node1, node2, node3] = await Promise.all([
    createNode(),
    createNode(),
    createNode()
  ])

  console.log('Nodo 1 avviato:\n PeerId %s \n', node1.peerId.toB58String())
  console.log('Nodo 2 avviato:\n PeerId %s \n', node2.peerId.toB58String())
  console.log('Nodo 3 avviato:\n PeerId %s \n', node3.peerId.toB58String())


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

  node1.peerStore.addressBook.set(node2.peerId, node2.multiaddrs)
  node2.peerStore.addressBook.set(node3.peerId, node3.multiaddrs)

  await Promise.all([
    node1.dial(node2.peerId),
    node2.dial(node3.peerId)
  ])
  await delay(100)

  const cid = new CID('QmTp9VkYvnHyrqKQuFPiuZkiX9gPcqj6x5LJ1rmWuSySnL')
  await node3.contentRouting.provide(cid)

  console.log('Nodo %s fornisce %s', node3.peerId.toB58String(), cid.toBaseEncodedString())

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






