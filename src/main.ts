import { IncrementSecret } from './IncrementSecret.js';
import net from 'net';
import fs from 'fs';

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





const readSemaphore = new fs.promises.Semaphore('/path/to/semaphore-for-read');
const writeSemaphore = new fs.promises.Semaphore('/path/to/semaphore-for-write');
const inputMemoryFile = '/path/to/input/memory/file';
const outputMemoryFile = '/path/to/output/memory/file';

const client = new net.Socket();

// Connect to the Go app's TCP server
client.connect(8000, '127.0.0.1', async () => {
    console.log('Connected to Go app');

    while (true) {
        // Wait for the Go app to notify us that it has finished writing
        await readSemaphore.wait();

        // Read the data from the memory file
        const inputData = fs.readFileSync(inputMemoryFile);

        console.log('Received data from Go app:', inputData.toString());

        // Process the data and generate a response
        const outputData = Buffer.from('Response data');

        // Write the response to the memory file
        fs.writeFileSync(outputMemoryFile, outputData);

        // Notify the Go app that we're done writing
        await writeSemaphore.post();
    }
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
