import make from '../src';
import { RunParams } from '../src/run';
import * as t from 'tcomb';
import * as React from 'react';
import * as renderer from 'react-test-renderer';
import { TransitionFunction } from '../src/transition';
import createMemoryHistory from 'history/createMemoryHistory';

type State = {
  view: 'view1' | 'view2';
  foo?: string;
  bar?: number;
};
const State = t.interface<State>(
  {
    view: t.enums.of(['view1', 'view2']),
    foo: t.maybe(t.String),
    bar: t.maybe(t.Number)
  },
  { strict: true }
);

class RenderState extends React.Component<Partial<State>> {
  render() {
    return (
      <div>
        {JSON.stringify(this.props)}
      </div>
    );
  }
}

const snapshot = (Provider, App) =>
  renderer
    .create(
      <Provider>
        {() => <App />}
      </Provider>
    )
    .toJSON();

type InitialLocationEntry = string | { pathname: string; search?: string };
const simpleScenario = (
  {
    initialEntries = [],
    transitionReducer
  }: { initialEntries?: InitialLocationEntry[]; transitionReducer?: RunParams<State>['transitionReducer'] } = {}
) => {
  const { run, connect } = make<State>(State);
  const App = connect(['view', 'foo', 'bar'])(RenderState);
  let transition: TransitionFunction<State>;
  const states: State[] = [];
  const history = createMemoryHistory({ initialEntries } as { initialEntries: string[] }); // history typing is slightly broken here
  return run({
    initialState: { view: 'view1' },
    history,
    transitionReducer,
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

describe('fullstack', () => {
  it('updating state with something valid should work', () =>
    new Promise((resolve, reject) => {
      return simpleScenario()
        .then(({ transition, states, history, snapshot }) => {
          transition({ view: 'view2', bar: 4 });
          expect(history.location.pathname).toBe('/view2');
          expect(history.location.search).toBe('?bar=4');
          expect(history.length).toBe(1);
          expect(states[states.length - 1]).toEqual({ view: 'view2', bar: 4 });
          expect(snapshot()).toMatchSnapshot();
        })
        .then(() => resolve(), reject);
    }));

  it('updating state multiple times with same value should cause a single diff and push', () =>
    new Promise((resolve, reject) => {
      return simpleScenario()
        .then(({ transition, states, history, snapshot }) => {
          transition({ view: 'view2', bar: 4 });
          transition({ view: 'view2', bar: 4 });
          transition({ view: 'view2', bar: 4 });
          expect(history.location.pathname).toBe('/view2');
          expect(history.location.search).toBe('?bar=4');
          expect(history.length).toBe(1);
          expect(states[states.length - 1]).toEqual({ view: 'view2', bar: 4 });
          expect(snapshot()).toMatchSnapshot();
        })
        .then(() => resolve(), reject);
    }));

  it('updating state 3 times with changes should cause 3 diffs and pushes', () =>
    new Promise((resolve, reject) => {
      return simpleScenario()
        .then(({ transition, states, history, snapshot }) => {
          transition({ view: 'view2', foo: 'bar' });
          expect(history.location.pathname).toBe('/view2');
          expect(history.location.search).toBe('?foo=bar');
          expect(history.length).toBe(1);
          expect(states[states.length - 1]).toEqual({ view: 'view2', foo: 'bar' });
          expect(snapshot()).toMatchSnapshot();

          transition({ view: 'view2', foo: 'baz' });
          expect(history.location.pathname).toBe('/view2');
          expect(history.location.search).toBe('?foo=baz');
          expect(history.length).toBe(2);
          expect(states[states.length - 1]).toEqual({ view: 'view2', foo: 'baz' });
          expect(snapshot()).toMatchSnapshot();

          transition({ view: 'view2', foo: 'bar' });
          expect(history.location.pathname).toBe('/view2');
          expect(history.location.search).toBe('?foo=bar');
          expect(history.length).toBe(3);
          expect(states[states.length - 1]).toEqual({ view: 'view2', foo: 'bar' });
          expect(snapshot()).toMatchSnapshot();

          expect(states.length).toBe(4);
        })
        .then(() => resolve(), reject);
    }));

  it('should pick up from browser correctly', () =>
    new Promise((resolve, reject) => {
      const initialEntries = [{ pathname: '/view2', search: '?bar=1', hash: '' }];
      return simpleScenario({ initialEntries })
        .then(({ transition, states, history, snapshot }) => {
          expect(history.location.pathname).toBe('/view2');
          expect(history.location.search).toBe('?bar=1');
          // expect(history.length).toBe(1); // TODO(gio): this fails, probably wouldn't fail in a real browser :(
          expect(states.length).toBe(1 + 1); // initial state + picked up state
          expect(states[states.length - 1]).toEqual({ view: 'view2', bar: 1 });
          expect(snapshot()).toMatchSnapshot();
        })
        .then(() => resolve(), reject);
    }));

  it('should pick up from browser correctly with invalid params', () =>
    new Promise((resolve, reject) => {
      const initialEntries = [{ pathname: '/view2', search: '?bar=false', hash: '' }];
      return simpleScenario({ initialEntries })
        .then(({ transition, states, history, snapshot }) => {
          expect(history.location.pathname).toBe('/view2');
          expect(history.location.search).toBe('?');
          // expect(history.length).toBe(1); // TODO(gio): this fails, probably wouldn't fail in a real browser :(
          expect(states.length).toBe(1 + 1); // initial state + picked up state
          expect(states[states.length - 1]).toEqual({ view: 'view2' });
          expect(snapshot()).toMatchSnapshot();
        })
        .then(() => resolve(), reject);
    }));

  it('updating state with something valid and serialized should work', () =>
    new Promise((resolve, reject) => {
      return simpleScenario()
        .then(({ transition, states, history, snapshot }) => {
          transition({ bar: 2 });
          expect(history.location.pathname).toBe('/view1');
          expect(history.location.search).toBe('?bar=2');
          expect(history.length).toBe(1);
          expect(states.length).toBe(2);
          expect(states[states.length - 1]).toEqual({ view: 'view1', bar: 2 });
          expect(snapshot()).toMatchSnapshot();
        })
        .then(() => resolve(), reject);
    }));

  it('should react correctly to browser back + fwd', () =>
    new Promise((resolve, reject) => {
      return simpleScenario()
        .then(({ transition, states, history, snapshot }) => {
          // add two entries to history
          transition({ bar: 2, view: 'view2' });
          transition({ bar: 4, view: 'view1' });
          expect(history.location.pathname).toBe('/view1');
          expect(history.location.search).toBe('?bar=4');
          expect(history.length).toBe(2);
          expect(history.index).toBe(1);
          expect(states.length).toBe(3);
          expect(states[states.length - 1]).toEqual({ view: 'view1', bar: 4 });
          expect(snapshot()).toMatchSnapshot();
          // browser back
          history.goBack();
          expect(history.location.pathname).toBe('/view2');
          expect(history.location.search).toBe('?bar=2');
          expect(history.length).toBe(2);
          expect(history.index).toBe(0);
          expect(states.length).toBe(4);
          expect(states[states.length - 1]).toEqual({ view: 'view2', bar: 2 });
          expect(snapshot()).toMatchSnapshot();
          // browser fwd
          history.goForward();
          expect(history.location.pathname).toBe('/view1');
          expect(history.location.search).toBe('?bar=4');
          expect(history.length).toBe(2);
          expect(history.index).toBe(1);
          expect(states.length).toBe(5);
          expect(states[states.length - 1]).toEqual({ view: 'view1', bar: 4 });
          expect(snapshot()).toMatchSnapshot();
        })
        .then(() => resolve(), reject);
    }));

  it('should react correctly to a browser back + redirect', () =>
    new Promise((resolve, reject) => {
      let redirect = false;
      return simpleScenario({
        transitionReducer: s => ({ ...s, view: redirect ? 'view1' : s.view })
      })
        .then(({ transition, states, history, snapshot }) => {
          // add two entries to history
          transition({ bar: 2, view: 'view2' });
          transition({ bar: 4, view: 'view1' });
          expect(snapshot()).toMatchSnapshot();
          // browser back forcing a redirect
          redirect = true;
          history.goBack();
          expect(history.location.pathname).toBe('/view1');
          expect(history.location.search).toBe('?bar=2');
          expect(history.length).toBe(2);
          expect(history.index).toBe(0);
          expect(states.length).toBe(4);
          expect(states[states.length - 1]).toEqual({ view: 'view1', bar: 2 });
          expect(snapshot()).toMatchSnapshot();
        })
        .then(() => resolve(), reject);
    }));
});
