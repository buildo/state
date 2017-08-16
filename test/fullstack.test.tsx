import make from '../src';
import * as t from 'tcomb';
import * as React from 'react';
import * as renderer from 'react-test-renderer';
import { TransitionFunction } from '../src/transition';

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

describe('fulstack', () => {

  it('scenario 1', () => new Promise((resolve, reject) => {
    const { run, connect } = make<State>(State);
    const App = connect(['view'])(RenderState);
    let transition: TransitionFunction<State>;
    const historyLength = window.history.length;
    return run({
      initialState: { view: 'view1' },
      init: (_: any, tr) => {
        transition = tr;
      }
    }).then(Provider => {
      // URL doesn't contain valid state, we'll just receive the initialState
      expect(window.location.pathname).toBe('/');
      expect(window.history.length).toBe(historyLength + 0);
      expect(snapshot(Provider, App)).toMatchSnapshot();
      // update state with something valid
      transition({ view: 'view2', bar: 4 });
      expect(window.location.pathname).toBe('/view2');
      expect(window.history.length).toBe(historyLength + 1);
      expect(snapshot(Provider, App)).toMatchSnapshot();
    }).then(() => resolve(), reject)
  }));
});