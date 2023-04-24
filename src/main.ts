import { IncrementSecret } from './IncrementSecret.js';
import net from 'net'

import {
  isReady,
  shutdown,
  Field,
  Mina,
  PrivateKey,
  AccountUpdate,
  SelfProof,
  Experimental,
  Struct,
  Bool,
  Circuit,
  Poseidon,
  MerkleMap,
  MerkleTree,
  MerkleWitness,
  MerkleMapWitness,
  verify,
} from 'snarkyjs';

await isReady;

const Add = Experimental.ZkProgram({
  publicInput: Field,

  methods: {
    init: {
      privateInputs: [],

      method(state: Field) {
        state.assertEquals(Field(0));
      },
    },
  },
});

console.log('SnarkyJS loaded');




const SOCKET_PATH = '/tmp/mysocket.sock'

async function startServer() {
  console.log('Server: Initializing...')

  const server = net.createServer(async (socket) => {
    console.log('Server: Client connected')

    socket.on('data', (data) => {
      console.log(`Server: Received message: ${data.toString()}`)
      socket.write('Server: Message received')
    })

    socket.on('close', () => {
      console.log('Server: Client disconnected')
    })

    socket.on('error', (error) => {
      console.log(`Server: Error: ${error}`)
    })
  })

  server.listen(SOCKET_PATH, () => {
    console.log(`Server: Listening on socket ${SOCKET_PATH}`)
  })

  console.log('Server: Initialized')
}

async function startClient() {
  console.log('Client: Initializing...')

  const client = net.createConnection(SOCKET_PATH)
  client.on('connect', () => {
    console.log('Client: Connected to server')
    client.write('Client: Hello, server!')
  })

  client.on('data', (data) => {
    console.log(`Client: Received message: ${data.toString()}`)
  })

  client.on('close', () => {
    console.log('Client: Disconnected from server')
  })

  client.on('error', (error) => {
    console.log(`Client: Error: ${error}`)
  })

  console.log('Client: Initialized')
}

async function main() {
  await startServer()
  await startClient()
}

main()






  console.log('compiling...');

//  const { verificationKey } = await Add.compile();

  console.log('making proof 0')

//  const proof0 = await Add.init(Field(0));



//  console.log('proof 2 data', proof0.publicInput.toString());



const map = new MerkleMap();
const key = Field(30);
const value = Field(120);
map.set(key, value);
map.set(value, key);
const rt = map.getRoot().toJSON();
const wt = map.getWitness(key).toJSON();

//console.log(rt, wt);

const useProof = false;

const Local = Mina.LocalBlockchain({ proofsEnabled: useProof });
Mina.setActiveInstance(Local);
const { privateKey: deployerKey, publicKey: deployerAccount } =
  Local.testAccounts[0];
const { privateKey: senderKey, publicKey: senderAccount } =
  Local.testAccounts[1];

const salt = Field.random();

// ----------------------------------------------------

// create a destination we will deploy the smart contract to
const zkAppPrivateKey = PrivateKey.random();
const zkAppAddress = zkAppPrivateKey.toPublicKey();

const zkAppInstance = new IncrementSecret(zkAppAddress);
const deployTxn = await Mina.transaction(deployerAccount, () => {
  AccountUpdate.fundNewAccount(deployerAccount);
  zkAppInstance.deploy();
  zkAppInstance.initState(salt, Field(750));
});
await deployTxn.prove();
await deployTxn.sign([deployerKey, zkAppPrivateKey]).send();

// get the initial state of IncrementSecret after deployment
const num0 = zkAppInstance.x.get();
console.log('state after init:', num0.toString());

// ----------------------------------------------------

const txn1 = await Mina.transaction(senderAccount, () => {
  zkAppInstance.incrementSecret(salt, Field(750));
});
await txn1.prove();
await txn1.sign([senderKey]).send();

const num1 = zkAppInstance.x.get();
console.log('state after txn1:', num1.toString());

// ----------------------------------------------------

console.log('Shutting down');

await shutdown();
