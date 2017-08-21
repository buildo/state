import stateInit from '../src';
import * as t from 'tcomb';

describe('connect', () => {
  type ST = { view: string };
  const { connect } = stateInit(t.interface<ST>({ view: t.String }, { strict: true }));

  it('should throw if select is invalid', () => {
    expect(() => connect(['bar'])).toThrowError('bar is not defined in state');
  });
});
