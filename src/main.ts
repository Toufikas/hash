import { IncrementSecret } from './IncrementSecret.js';



import net from 'net';
import { Buffer } from 'buffer';


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


/*
class MerkleWitness20 extends MerkleWitness(20) {}


  

const Add = Experimental.ZkProgram({
  publicInput: Field,

  methods: {
    init: {
      privateInputs: [],

      method(state: Field) {
        state.assertEquals(Field(0));
      },
    },

    addNumber: {
      privateInputs: [SelfProof, Field ],

      method(newState: Field, earlierProof: SelfProof<Field>, numberToAdd: Field) {
        earlierProof.verify();
        newState.assertEquals(earlierProof.publicInput.add(numberToAdd));
      },
    },

    add: {
      privateInputs: [ SelfProof, SelfProof ],

      method(
        newState: Field, 
        earlierProof1: SelfProof<Field>,
        earlierProof2: SelfProof<Field>,
      ) {
        earlierProof1.verify();
        earlierProof2.verify();
        newState.assertEquals(earlierProof1.publicInput.add(earlierProof2.publicInput));
      },
    },
  },
});
await isReady;

  console.log('SnarkyJS loaded');

  console.log('compiling...');

  const { verificationKey } = await Add.compile();

  console.log('making proof 0')

  const proof0 = await Add.init(Field(0));

  console.log('making proof 1')

  const proof1 = await Add.addNumber(Field(4), proof0, Field(4));

  console.log('making proof 2')

  const proof2 = await Add.add(Field(4), proof1, proof0);

  console.log('verifying proof 2');
  console.log('proof 2 data', proof2.publicInput.toString());

  const ok = await verify(proof2.toJSON(), verificationKey);
  console.log('ok', ok);

  console.log('Shutting down');

  await shutdown();

*/



await isReady;
/*
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

*/
export function zkcode(buffer: Buffer): Buffer {
  // your logic here


console.log("Connecting to zk server.");





  console.log('compiling...');

//  const { verificationKey } = await Add.compile();

  console.log('making proof 0')

//  const proof0 = await Add.init(Field(0));



//  console.log('proof 2 data', proof0.publicInput.toString());
const myint = buffer.slice(0,4).readInt32LE(0);



const map = new MerkleMap();
const key = Field(30);
const value = Field(myint);
for(let i = 0; i < 10; i++) {

map.set(key, value);
map.set(value, key);

}
const rt = map.getRoot().toJSON();
const wt = map.getWitness(key).toJSON();

    return Buffer.from(rt);
}
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
  zkAppInstance.initState(Field(3));
});
await deployTxn.prove();
await deployTxn.sign([deployerKey, zkAppPrivateKey]).send();

// get the initial state of IncrementSecret after deployment
const num0 = zkAppInstance.x.get();
console.log('state after init:', num0.toBigInt());

// ----------------------------------------------------

const txn1 = await Mina.transaction(senderAccount, () => {
  zkAppInstance.incrementSecret(salt, Field(3));
});
await txn1.prove();
await txn1.sign([senderKey]).send();

const num1 = zkAppInstance.x.get();
console.log('state after txn1:', num1.toString());

// ----------------------------------------------------

console.log('Shutting down');

//await shutdown();

