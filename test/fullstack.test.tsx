import make from '../src';
import * as t from 'tcomb';
import * as React from 'react';
import * as renderer from 'react-test-renderer';
import { TransitionFunction } from '../src/transition';
import createMemoryHistory from 'history/createMemoryHistory';

type State = {
  view: 'view1' | 'view2',
  foo?: string,
  bar?: number
};
const State = t.interface<State>({
  view: t.enums.of(['view1', 'view2']),
  foo: t.maybe(t.String),
  bar: t.maybe(t.Number)
}, { strict: true });

class RenderState extends React.Component<Partial<State>> {
  render() {
    return <div>{JSON.stringify(this.props)}</div>;
  }
}

const snapshot = (Provider, App) => renderer.create((
  <Provider>
    {() => <App />}
  </Provider>
)).toJSON();

const simpleScenario = () => {
  const { run, connect } = make<State>(State);
  const App = connect(['view', 'foo', 'bar'])(RenderState);
  let transition: TransitionFunction<State>;
  const states: State[] = [];
  const history = createMemoryHistory();
  return run({
    initialState: { view: 'view1' },
    history,
    init: (_: any, tr) => {
      transition = tr;
    },
    subscribe: s => {
      states.push(s);
    }
  }).then(Provider => ({
    transition,
    states,
    history,
    snapshot: () => snapshot(Provider, App)
  }));
};

describe('fulstack', () => {

  it('scenario 1', () => new Promise((resolve, reject) => {
    return simpleScenario().then(({ transition, states, history, snapshot }) => {
      // URL doesn't contain valid state, we'll just receive the initialState
      expect(history.location.pathname).toBe('/');
      expect(history.length).toBe(1);
      expect(states[states.length - 1]).toEqual({ view: 'view1' });
      expect(snapshot()).toMatchSnapshot();

      // update state with something valid
      transition({ view: 'view2', bar: 4 });
      expect(history.location.pathname).toBe('/view2');
      expect(history.location.search).toBe('?bar=4');
      expect(history.length).toBe(2);
      expect(states[states.length - 1]).toEqual({ view: 'view2', bar: 4 });
      expect(snapshot()).toMatchSnapshot();
    }).then(() => resolve(), reject)
  }));

  it('scenario 2', () => new Promise((resolve, reject) => {
    return simpleScenario().then(({ transition, states, history, snapshot }) => {
      // URL doesn't contain valid state, we'll just receive the initialState
      expect(history.location.pathname).toBe('/');
      expect(history.length).toBe(1);
      expect(states[states.length - 1]).toEqual({ view: 'view1' });
      expect(snapshot()).toMatchSnapshot();

      // update state multiple times, should cause a single diff and push
      transition({ view: 'view2', bar: 4 });
      transition({ view: 'view2', bar: 4 });
      transition({ view: 'view2', bar: 4 });
      expect(history.location.pathname).toBe('/view2');
      expect(history.location.search).toBe('?bar=4');
      expect(history.length).toBe(2);
      expect(states[states.length - 1]).toEqual({ view: 'view2', bar: 4 });
      expect(snapshot()).toMatchSnapshot();
    }).then(() => resolve(), reject)
  }));

  it('scenario 3', () => new Promise((resolve, reject) => {
    return simpleScenario().then(({ transition, states, history, snapshot }) => {
      // URL doesn't contain valid state, we'll just receive the initialState
      expect(history.location.pathname).toBe('/');
      expect(history.length).toBe(1);
      expect(states[states.length - 1]).toEqual({ view: 'view1' });
      expect(snapshot()).toMatchSnapshot();

      // update state 3 times, should cause 3 diffs and pushes
      transition({ view: 'view2', foo: 'bar' });
      expect(history.location.pathname).toBe('/view2');
      expect(history.location.search).toBe('?foo=bar');
      expect(history.length).toBe(2);
      expect(states[states.length - 1]).toEqual({ view: 'view2', foo: 'bar' });

      transition({ view: 'view2', foo: 'baz' });
      expect(snapshot()).toMatchSnapshot();
      expect(history.location.pathname).toBe('/view2');
      expect(history.location.search).toBe('?foo=baz');
      expect(history.length).toBe(3);
      expect(states[states.length - 1]).toEqual({ view: 'view2', foo: 'baz' });
      expect(snapshot()).toMatchSnapshot();

      transition({ view: 'view2', foo: 'bar' });
      expect(history.location.pathname).toBe('/view2');
      expect(history.location.search).toBe('?foo=bar');
      expect(history.length).toBe(4);
      expect(states[states.length - 1]).toEqual({ view: 'view2', foo: 'bar' });
      expect(snapshot()).toMatchSnapshot();

      expect(states.length).toBe(4);
    }).then(() => resolve(), reject);
  }));
});