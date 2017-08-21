import * as t from 'tcomb';
import prepareTransition from './prepareTransition';

describe('transition', () => {
  type ST = { view: string };
  const stateType = t.interface<ST>({ view: t.String }, { strict: true });

  it('should do nothing if there is no state diff', () => {
    const { transition, states } = prepareTransition({ stateType, initialState: { view: 'bar' } });

    transition({ view: 'bar' });

    expect(states).toEqual([{ view: 'bar' }]);
  });

  it('should push synchronously if there is state diff', () => {
    const { transition, states } = prepareTransition({ stateType, initialState: { view: 'bar' } });

    transition({ view: 'baz' });

    expect(states).toEqual([{ view: 'bar' }, { view: 'baz' }]);
  });

  it('should throw if it evaluates to a state with a key of invalid type', () => {
    const { transition } = prepareTransition({ stateType, initialState: { view: 'bar' } });

    const invalidTransition = () => {
      transition({ view: 2 });
    };

    expect(invalidTransition).toThrow();
  });

  it('should throw if it evaluates to a state with an extraneous key', () => {
    const { transition } = prepareTransition({ stateType, initialState: { view: 'bar' } });
    const invalidTransition = () => {
      transition({ view: 'bar', bar: 'foo' });
    };

    expect(invalidTransition).toThrow();
  });
});
