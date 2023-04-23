import { Field, SmartContract, state, State, method, Poseidon } from 'snarkyjs';

export class IncrementSecret extends SmartContract {
  @state(Field) x = State<Field>();

  @method initState(salt: Field, firstSecret: Field) {
    this.x.set(Poseidon.hash([firstSecret]));
  }

  @method incrementSecret(salt: Field, secret: Field) {
    const x = this.x.get();
    this.x.assertEquals(x);

    Poseidon.hash([secret]).assertEquals(x);
    this.x.set(Poseidon.hash([secret.add(1)]));
  }
}
