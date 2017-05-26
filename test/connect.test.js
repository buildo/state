import connectFactory from '../src/connect';
import t from 'tcomb';

describe('connect', () => {

  const connect = connectFactory(t.interface({
    foo: t.String
  }, { name: 'AppState', strict: true }));

  it('should throw if select is invalid', () => {
    expect(() => connect(['bar'])).toThrowError('bar is not defined in state');
  });
});
