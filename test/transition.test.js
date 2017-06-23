import sinon from 'sinon';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { createProvideWrapper } from '../src/run';
import t from 'tcomb';

const prepareTransition = ({ initialState = {}, syncToBrowser = () => true } = {}) => {
  const stateSubject = new BehaviorSubject(initialState);
  const states = [];
  stateSubject.subscribe(s => {
    states.push(s);
  });
  const { transition } = createProvideWrapper({
    stateSubject,
    getPendingState: () => undefined,
    setPendingState: () => {},
    syncToBrowser,
    transitionReducer: v => v,
    stateType: t.interface({
      foo: t.maybe(t.String),
      bar: t.maybe(t.String)
    }, { name: 'AppState', strict: true })
  });
  return { transition, states };
};

describe('transition', () => {

  it('should do nothing if there is no state diff', () => new Promise((resolve) => {

    const { transition, states } = prepareTransition({ initialState: { foo: 'bar' } });
    transition({ foo: 'bar' });

    expect(states).toEqual([{ foo: 'bar' }]);

    resolve();
  }));

  it('should not push to state synchronously if there is a browser diff', () => new Promise((resolve) => {

    const { transition, states } = prepareTransition();
    transition({ foo: 'bar' });

    expect(states).toEqual([{}]);

    resolve();
  }));

  it('should push to state synchronously if there is no browser diff', () => new Promise((resolve) => {

    const { transition, states } = prepareTransition({ syncToBrowser: () => false });
    transition({ foo: 'bar' });

    expect(states).toEqual([{}, { foo: 'bar' }]);

    resolve();
  }));

  it('should not syncToBrowser synchronously multiple transitions after a browser diff', () => new Promise((resolve) => {

    const syncToBrowser = sinon.stub();
    syncToBrowser.onCall(0).returns(false);
    syncToBrowser.returns(true);

    const { transition, states } = prepareTransition({ syncToBrowser });
    transition({ foo: 'bar' });
    transition({ bar: 'baz' });

    expect(syncToBrowser.callCount).toBe(2);
    expect(states).toEqual([{}, { foo: 'bar' }]);

    resolve();
  }));

  it('should throw if it evaluates to a state with a key of invalid type', () => {

    const { transition } = prepareTransition({ syncToBrowser: () => false });
    const invalidTransition = () => {
      transition({ foo: 'bar', bar: 2 });
    };

    expect(invalidTransition).toThrow();

  });

  it('should throw if it evaluates to a state with an extraneous key', () => {

    const { transition } = prepareTransition({ syncToBrowser: () => false });
    const invalidTransition = () => {
      transition({ foo: 'bar', barb: 'foo' });
    };

    expect(invalidTransition).toThrow();

  });

});
