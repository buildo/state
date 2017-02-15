import React from 'react';
import debug from 'debug';
import { filter } from 'rxjs/operator/filter';
import { map } from 'rxjs/operator/map';
import omit from 'lodash/omit';
import identity from 'lodash/identity';
import t, { isType } from 'tcomb';
import shallowEqual from './shallowEqual';

const warn = debug('state:connect');
warn.log = ::console.warn; // eslint-disable-line no-console

export const ConnectContextTypes = {
  transition: React.PropTypes.func.isRequired,
  state: React.PropTypes.object.isRequired
};

const isValidType = ty => {
  if (!t.Object.is(ty)) {
    return false;
  }
  const keys = Object.keys(ty);
  return keys.map(k => ty[k]).filter(isType).length === keys.length;
};

const filterForType = ty => v => Object.keys(ty).reduce((ac, k) => ({
  ...ac,
  [k]: v[k]
}), {});

// expects a select function
// or type declaration in the form
//
// { key1: TcombType, ..., keyN: TcombType }
//
// and an optional configuration object
export default function connect(select = identity, {
  // implement a standard shouldComponentUpdate with shallowEquals
  // do not use on non-pure components, e.g. react-router `RouteHandler`s
  //
  // Boolean
  //
  pure = true,

  // do not update the component props if the type declaration doesn't match
  // useful to skip "router transitioning" problems: old container that should be unmounted
  // soon (but still async) by re-rendering after a router change would otherwise receive
  // the new (and possibly incorrect from their POV) state
  // TODO(gio): elaborate better / try to remove
  //
  // Boolean
  //
  filterValid = true,

  // optionally kill some props using lodash omit
  // useful to stay strict in @props declaration, a typical default could be:
  // ['router', 'query', 'params']
  //
  // Array<String>
  //
  killProps = []
} = {}) {
  const isTypeSelect = isValidType(select);

  const decorator = Component => {
    const displayName = `connect(${Component.displayName || Component.name || 'Component'})`;

    const isValidState = filterValid && isTypeSelect ? v => {
      const invalid = [];
      for (const k in select) { // eslint-disable-line no-loops/no-loops
        if (!select[k].is(v[k])) {
          invalid.push(k);
        }
      }
      if (invalid.length > 0 && process.env.NODE_ENV === 'development') {
        warn(`Skipping update for ${displayName}. Invalid keys: ${invalid.join(', ')}`);
      }
      return invalid.length === 0;
    } : () => true;
    const filterKeys = isTypeSelect ? filterForType(select) : select;

    return class ConnectWrapper extends React.Component {
      static contextTypes = ConnectContextTypes

      static displayName = displayName;

      constructor(props, context) {
        super(props, context);
        const value = context.state.value;
        if (isValidState(value)) {
          this.state = filterKeys(value);
        } else {
          this.state = {};
        }
      }

      componentDidMount() {
        this._subscription = this.context.state::filter(isValidState)::map(filterKeys).subscribe(::this.setState);
      }

      componentWillUnmount() {
        if (this._subscription) {
          this._subscription.unsubscribe();
        }
      }

      shouldComponentUpdate(nextProps, nextState) {
        return pure ? !shallowEqual(this.props, nextProps) || !shallowEqual(this.state, nextState) : true;
      }

      render() {
        const props = {
          // state first: connected props are overridable by "actual" (passed) props
          // it's useful for av@queries, av@commands
          ...this.state,
          ...omit(this.props, killProps),
          transition: this.context.transition
        };
        return (
          <Component {...props}/>
        );
      }
    };
  };
  if (isTypeSelect) {
    decorator.Type = { ...select, transition: t.Function };
  }
  return decorator;
}
