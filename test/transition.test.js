import sinon from 'sinon';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { createProvideWrapper } from '../src/run';

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
    transitionReducer: v => v
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

});
