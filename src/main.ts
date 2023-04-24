import { IncrementSecret } from './IncrementSecret.js';
import fs from 'fs';
import net from 'net';
import { AddressInfo } from 'net';

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




  console.log('compiling...');

//  const { verificationKey } = await Add.compile();

  console.log('making proof 0')

//  const proof0 = await Add.init(Field(0));


const server = net.createServer((socket) => {
  console.log('Server: client connected');
  socket.write('Hello from server!');

  socket.on('data', (data) => {
    console.log(`Server: received data: ${data}`);
    socket.write(`Server: received ${data.length} bytes`);
  });

  socket.on('end', () => {
    console.log('Server: client disconnected');
  });
});

const SOCK_PATH = './test.sock';

if (fs.existsSync(SOCK_PATH)) {
  fs.unlinkSync(SOCK_PATH);
}

server.listen(SOCK_PATH, () => {
  console.log('Server listening on ' + SOCK_PATH);
  
  // Connect to the server via the same socket
  const client = net.connect(SOCK_PATH, () => {
    console.log('Client: connected to server');
    client.write('Hello from client!');
  });

  client.on('data', (data) => {
    console.log(`Client: received data: ${data}`);
    client.end();
  });

  client.on('end', () => {
    console.log('Client: disconnected from server');
  });
});




//  console.log('proof 2 data', proof0.publicInput.toString());



const map = new MerkleMap();
const key = Field(30);
const value = Field(120);
map.set(key, value);
map.set(value, key);
const rt = map.getRoot().toJSON();
const wt = map.getWitness(key).toJSON();

console.log(rt, wt);

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
