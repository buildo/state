import stateInit from '../src';
import * as t from 'tcomb';

describe('run', () => {
  it('should throw if initialState is invalid', () => {
    type StateType = { view: string };
    const stateType = t.interface<StateType>({ view: t.String }, { name: 'AppState', strict: true });
    const { run } = stateInit(stateType);
    expect(() => run({ initialState: { foo: 1 } })).toThrow();
  });
});
