import make from '../src';
import * as t from 'tcomb';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

type State = {
  view: 'foo' | 'bar',
  foo?: number
}

const State = t.interface<State>({
  view: t.enums.of(['foo', 'bar']),
  foo: t.maybe(t.Number)
}, { strict: true, name: 'State' });

const { run, connect } = make<State>(State);

class _MyComponent extends React.Component<{ view: State['view'] }> {
  render() {
    return <div>{this.props.view}</div>;
  }
}
const MyComponent = connect(['view'])(_MyComponent);

run({ initialState: { view: 'foo' } }).then(Provider => {
  ReactDOM.render((
    <Provider>
      {() => <MyComponent />}
    </Provider>
  ), document.body);
});
