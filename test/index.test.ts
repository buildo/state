import stateInit from '../src';
import * as t from 'tcomb';

describe('stateInit', () => {
  it('should throw if stateType is invalid', () => {
    expect(() => stateInit()).toThrow();
    expect(() => stateInit({})).toThrow();
    expect(() => stateInit(t.struct({}))).toThrow();
    expect(() => stateInit(t.interface({}, { strict: false }))).toThrowError('`stateType` must be a strict tcomb interface');
  });
});
