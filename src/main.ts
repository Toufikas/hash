import { IncrementSecret } from './IncrementSecret.js';
import * as net from 'net';
import * as fs from 'fs';

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





const SOCKET_FILE = '/tmp/my_unix_socket.sock';

const server = net.createServer((socket) => {
  console.log('Client connected.');

  socket.on('data', (data) => {
    console.log(`Received data: ${data.toString()}`);

    // Echo the received data back to the client.
    socket.write(data);
  });

  socket.on('close', () => {
    console.log('Client disconnected.');
  });
});

// Delete the Unix domain socket file if it already exists.
if (fs.existsSync(SOCKET_FILE)) {
  fs.unlinkSync(SOCKET_FILE);
}

// Listen for incoming connections on the Unix domain socket.
server.listen(SOCKET_FILE, () => {
  console.log(`Server listening on ${SOCKET_FILE}`);
});

// Handle server errors.
server.on('error', (err) => {
  console.error(`Server error: ${err}`);
});

// Handle server shutdown.
process.on('SIGINT', () => {
  console.log('Shutting down server.');

  server.close(() => {
    console.log('Server stopped.');

    // Delete the Unix domain socket file.
    fs.unlinkSync(SOCKET_FILE);
  });
});






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
