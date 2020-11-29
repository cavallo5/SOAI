'use strict'

const Libp2p = require('../node_modules/libp2p')
const multiaddr = require('../node_modules/multiaddr')
const TCP = require('../node_modules/libp2p-tcp')
const PeerId = require('../node_modules/peer-id')
const Mplex = require('../node_modules/libp2p-mplex')
const { NOISE } = require('../node_modules/libp2p-noise')
const pipe = require('../node_modules/it-pipe')
const concat = require('../node_modules/it-concat')

const createNode = async (peerid , numero)=> {
  const node = await Libp2p.create({
    addresses: {
      listen: ['/ip4/127.0.0.1/tcp/0']
    },
    peerId: peerid,
    modules: {
      transport: [TCP],
      streamMuxer: [Mplex],
      connEncryption: [NOISE]
    },
  })
  node.spaceId=numero
  node.data=new Object()

  return node
}

function printAddrs(node, number) {
  console.log('nodo %s è in ascolto su:', number)
  node.multiaddrs.forEach((ma) => console.log(`${ma.toString()}`))
}

function print({ stream }) {
  pipe(
    stream,
    async function (source) {
      for await (const msg of source) {
        console.log(msg)
      }
    }
  )
}

function hash(s){
  return s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);              
}

function getRandomArbitrary(min,max) {
  //return Math.random() * (max - min) + min;
  //return Math.floor(Math.random() * max)+min;
  return Math.floor(Math.random() * (max - min) + min);
}


//PeerId da file JSON
;(async () => {
  const [node1ID, node2ID, node3ID,node4ID,node5ID] = await Promise.all([
    PeerId.createFromJSON(require('./peerId/node1')),
    PeerId.createFromJSON(require('./peerId/node2')),
    PeerId.createFromJSON(require('./peerId/node3')),
    PeerId.createFromJSON(require('./peerId/node4')),
    PeerId.createFromJSON(require('./peerId/node5'))
  ])

  //Creazione 5 nodi
  const [node1, node2, node3, node4, node5] = await Promise.all([
    createNode(node1ID,0),
    createNode(node2ID,10),
    createNode(node3ID,20),
    createNode(node4ID,30),
    createNode(node5ID,40)
  ])


  await Promise.all([
  	console.log('\n------PASSO 1---------'),
    console.log('\n------CREAZIONE RETE---------'),
    node1.start(),
    console.log('Nodo 1 avviato:\n PeerId %s \n SpaceID %s \n', node1.peerId.toB58String(), node1.spaceId),
    node2.start(),
    console.log('Nodo 2 avviato:\n PeerId %s \n SpaceID %s \n', node2.peerId.toB58String(),node2.spaceId),
    node3.start(),
    console.log('Nodo 3 avviato_:\n PeerId %s \n SpaceID %s \n', node3.peerId.toB58String(),node3.spaceId),
    node4.start(),
    console.log('Nodo 4 avviato:\n PeerId %s \n SpaceID %s \n', node4.peerId.toB58String(),node4.spaceId),
    node5.start(),
    console.log('Nodo 5 avviato:\n PeerId %s \n SpaceID %s \n', node5.peerId.toB58String(),node5.spaceId)
  ])

  /*
  console.log(node1.peerId.toB58String())
  console.log(node2.peerId.toB58String())
  console.log(node3.peerId.toB58String())
  console.log(node4.peerId.toB58String())
  console.log(node5.peerId.toB58String())
  */

  console.log('------INDIRIZZI---------')
  printAddrs(node1, '1')
  printAddrs(node2, '2')
  printAddrs(node3, '3')
  printAddrs(node4, '4')
  printAddrs(node5, '5')

  //Dato da salvare in un nodo della rete
  var dato = new Object();
  var key=getRandomArbitrary(10,50);
  
  var hashkey=hash(key.toString());
  //console.log(hashkey)


  console.log('\n------PASSO 2---------'),
  dato[hashkey] = 'messaggio segreto';
  console.log('\n------DATO DA ARCHIVIARE---------')
  var i;
  var valore;
  for (i in dato) {
    valore=dato[i];
    console.log('(chiave,valore)='+'('+i + ',' + dato[i]+')') ;
  }


  console.log('\n------ARCHIVIAZIONE CON HASH---------')
  if(key>=node1.spaceId && key<=(node5.spaceId+10)){
    if(key>=node5.spaceId){
      node5.data=dato;
      console.log('hash('+key+')='+hashkey+' con valore '+valore+' archiviato nel nodo 5')
    }else if(key>=node4.spaceId){
      node4.data=dato;
      console.log('hash('+key+')='+hashkey+' con valore '+valore+' archiviato nel nodo 4')
    }else if(key>=node3.spaceId){
      node3.data=dato;
      console.log('hash('+key+')='+hashkey+' con valore '+valore+' archiviato nel nodo 3')
    }else if(key>=node2.spaceId){
      node2.data=dato;  
      console.log('hash('+key+')='+hashkey+' con valore '+valore+' archiviato nel nodo 2')
    }else if(key>=node1.spaceId){
      node1.data=dato;      
      console.log('hash('+key+')='+hashkey+' con valore '+valore+' archiviato nel nodo 1')
    }
  }else{
    console.error("Inserire chiave compresa nello spaceID dei peer [0,50]")
    return;
  }

  node1.peerStore.addressBook.set(node2.peerId, node2.multiaddrs)
  node2.peerStore.addressBook.set(node1.peerId, node1.multiaddrs)
  node2.peerStore.addressBook.set(node3.peerId, node3.multiaddrs)
  node3.peerStore.addressBook.set(node1.peerId, node1.multiaddrs)
  node3.peerStore.addressBook.set(node4.peerId, node4.multiaddrs)
  node4.peerStore.addressBook.set(node1.peerId, node1.multiaddrs)
  node4.peerStore.addressBook.set(node5.peerId, node5.multiaddrs)
  node5.peerStore.addressBook.set(node1.peerId, node1.multiaddrs)
  node5.peerStore.addressBook.set(node1.peerId, node1.multiaddrs)

  console.log('\n------PASSO 3---------'),
  console.log('\n------SIMULAZIONE---------')
  //Nodo 1 cerca il peer che ha il valore
  //Occorre cercare il peer con key>=spaceId

  //node1.handle('/print', print)
  node1.handle('/print', ({ stream }) => {
  pipe(
    stream,
    source => (async function () {
      for await (const msg of source) {
        console.log('Nodo 1: Ho ricevuto la risposta '+'('+hashkey+','+msg.toString()+')')
        //console.log(msg.toString())
      }
    })()
  )
  })

  node2.handle('/print', ({ stream }) => {
  pipe(
    stream,
    source => (async function () {
      for await (const msg of source) {
        //console.log(msg.toString())
        if(node2.data.hasOwnProperty(msg.toString())){
           //console.log(node2.data[msg.toString()])
           //Rispondo al peer che mi ha contattato
           console.log("Nodo 2: Nella mia hashtable ho il dato richiesto")
           const { stream: stream2 } = await node2.dialProtocol(node1.peerId, '/print')
            await pipe(
            [''+node2.data[msg.toString()]],
            stream2
            )
        }
        else{
          console.log("Nodo 2: Invio la richiesta al nodo successivo")
          const { stream: stream2 } = await node2.dialProtocol(node3.peerId, '/print')
          await pipe(
          [''+msg.toString()],
          stream2
          )
        }
      }
    })()
  )
  })

  //node3.handle('/print', print)

  node3.handle('/print', ({ stream }) => {
  pipe(
    stream,
    source => (async function () {
      for await (const msg of source) {
        //console.log(msg.toString())
        if(node3.data.hasOwnProperty(msg.toString())){
           //console.log(node3.data[msg.toString()])
           //Rispondo al peer che mi ha contattato
           console.log("Nodo 3: Nella mia hashtable ho il dato richiesto")
           const { stream: stream3 } = await node3.dialProtocol(node1.peerId, '/print')
            await pipe(
            [''+node3.data[msg.toString()]],
            stream3
            )
        }
        else{
          console.log("Nodo 3: Invio la richiesta al nodo successivo")
          const { stream: stream3 } = await node3.dialProtocol(node4.peerId, '/print')
          await pipe(
          [''+msg.toString()],
          stream3
          )
        }
      }
    })()
  )
  })

 //node4.handle('/print', print)

 node4.handle('/print', ({ stream }) => {
  pipe(
    stream,
    source => (async function () {
      for await (const msg of source) {
        //console.log(msg.toString())
        if(node4.data.hasOwnProperty(msg.toString())){
           //console.log(node4.data[msg.toString()])
           //Rispondo al peer che mi ha contattato
           console.log("Nodo 4: Nella mia hashtable ho il dato richiesto")
           const { stream: stream4 } = await node4.dialProtocol(node1.peerId, '/print')
            await pipe(
            [''+node4.data[msg.toString()]],
            stream4
            )
        }
        else{
          console.log("Nodo 4: Invio la richiesta al nodo successivo")
          const { stream: stream4 } = await node4.dialProtocol(node5.peerId, '/print')
          await pipe(
          [''+msg.toString()],
          stream4
          )
        }
      }
    })()
  )
  })


  //node5.handle('/print', print)
  node5.handle('/print', ({ stream }) => {
  pipe(
    stream,
    source => (async function () {
      for await (const msg of source) {
        //console.log(msg.toString())
        if(node5.data.hasOwnProperty(msg.toString())){
           //console.log(node4.data[msg.toString()])
           //Rispondo al peer che mi ha contattato
           console.log("Nodo 5: Nella mia hashtable ho il dato richiesto")
           const { stream: stream5 } = await node5.dialProtocol(node1.peerId, '/print')
            await pipe(
            [''+node5.data[msg.toString()]],
            stream5
            )
        }
        else{
          console.log("Nodo 4: Invio la richiesta al nodo successivo")
          const { stream: stream5 } = await node5.dialProtocol(node1.peerId, '/print')
          await pipe(
          [''+msg.toString()],
          stream5
          )
        }
      }
    })()
  )
  })
 
// node 1 (TCP) comunica con il nodo 2 (TCP)
  const { stream } = await node1.dialProtocol(node2.peerId, '/print')
  console.log('Nodo 1: Sto cercando '+'(hash('+key+'),valore)')
  await pipe(
    [''+hashkey],
    stream
  )
})();