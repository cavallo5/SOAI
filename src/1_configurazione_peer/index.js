//moduli p2p
const Libp2p = require('libp2p')
const TCP = require('libp2p-tcp') //trasporto
const SECIO = require('libp2p-secio') //crittografia della connessione
const MPLEX = require('libp2p-mplex') //stream multiplexing per gestire più comunicazioni
const multiaddr = require('multiaddr') //gestione indirizzo del nodo

const main = async () => {
	//Configurazione peer
	const node = await Libp2p.create({
   		addresses: {
    	listen: ['/ip4/127.0.0.1/tcp/0'] // indirizzo di ascolto (localhost) per accettare connessioni TCP su una porta casuale
    	},
    modules: {
    	transport: [TCP], //protocollo di trasporto per connessione tra peer della stessa rete
    	connEncryption: [SECIO], //crittografia della connessione 
    	streamMuxer: [MPLEX] //stream multiplexing 
    	}
 	})

  // avvio del nodo libp2p
  await node.start()
  console.log('Avvio del peer')

  // stampa indirizzi in ascolto
  console.log('ascolto su indirizzi:')
  node.multiaddrs.forEach(addr => {
    console.log(`${addr.toString()}/p2p/${node.peerId.toB58String()}`) //toB58String perchè il peerId è codificato in base 58
  })

  // stop del nodo libp2p
  await node.stop()
  console.log('Arresto del peer')
}

main()