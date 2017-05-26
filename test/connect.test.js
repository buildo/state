import stateInit from '../src';
import t from 'tcomb';

describe('connect', () => {

  const { connect } = stateInit(t.interface({
    foo: t.String
  }, { name: 'AppState', strict: true }));

  it('should throw if select is invalid', () => {
    expect(() => connect(['bar'])).toThrowError('bar is not defined in state');
  });
});
