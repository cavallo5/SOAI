/* eslint-disable no-console */
'use strict'

const Libp2p = require('libp2p')
const TCP = require('libp2p-tcp')
const Mplex = require('libp2p-mplex')
const { NOISE } = require('libp2p-noise')
const MulticastDNS = require('libp2p-mdns')

const createNode = async () => {
  const node = await Libp2p.create({
    addresses: {
      listen: ['/ip4/127.0.0.1/tcp/0']
    },
    modules: {
      transport: [TCP],
      streamMuxer: [Mplex],
      connEncryption: [NOISE],
      peerDiscovery: [MulticastDNS]
    },
    config: {
      peerDiscovery: {
        [MulticastDNS.tag]: {
          interval: 20e3,
          enabled: true
        }
      }
    }
  })

  return node
}

;(async () => {
  const [node1, node2] = await Promise.all([
    createNode(),
    createNode()
  ])

  node1.on('peer:discovery', (peerId) => console.log('Nodo 1: ho scoperto nodo con PeerID:', peerId.toB58String()))
  node2.on('peer:discovery', (peerId) => console.log('Nodo 2: ho scoperto nodo con PeerID', peerId.toB58String()))

  await Promise.all([
    node1.start(),
    console.log('Nodo 1 avviato con PeerId %s', node1.peerId.toB58String()),
    node2.start(),
    console.log('Nodo 2 avviato con PeerId %s', node2.peerId.toB58String())
  ])
})();
