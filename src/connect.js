import React from 'react';
import debug from 'debug';
import { filter } from 'rxjs/operator/filter';
import { map } from 'rxjs/operator/map';
import omit from 'lodash/omit';
import identity from 'lodash/identity';
import pick from 'lodash/pick';
import t from 'tcomb';
import shallowEqual from './shallowEqual';

const warn = debug('state:connect');
warn.log = ::console.warn; // eslint-disable-line no-console

export const ConnectContextTypes = {
  transition: React.PropTypes.func.isRequired,
  state: React.PropTypes.object.isRequired
};

const defaultPickKeys = ty => v => pick(v, ty);

// expects a select function or a list of keys
// and an optional configuration object
export default stateType => (select = identity, {
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
} = {}) => {

  const isKeyList = t.list(t.String).is(select);
  if (!isKeyList && !t.Function.is(select)) {
    throw new Error('connect expects a select function or a list of keys');
  }

  select.forEach(k => {
    if (!stateType.meta.props.hasOwnProperty(k)) {
      throw new Error(`${k} is not defined in state`);
    }
  });

  const decorator = Component => {
    const displayName = `connect(${Component.displayName || Component.name || 'Component'})`;

    const pickKeys = isKeyList ? defaultPickKeys(select) : select;

    const shouldUpdateState = filterValid && isKeyList ? v => {
      const invalid = select.reduce((acc, k) => {
        return !stateType.meta.props[k].is(v[k]) ? [...acc, k] : acc;
      }, []);

      if (invalid.length > 0 && process.env.NODE_ENV === 'development') {
        warn(`Skipping update for ${displayName}. Invalid keys: ${invalid.join(', ')}`);
      }
      return invalid.length === 0;
    } : () => true;

    return class ConnectWrapper extends React.Component {
      static contextTypes = ConnectContextTypes

      static displayName = displayName;

      constructor(props, context) {
        super(props, context);
        const value = context.state.value;
        if (shouldUpdateState(value)) {
          this.state = pickKeys(value);
        } else {
          this.state = {};
        }
      }

      componentDidMount() {
        this._subscription = this.context.state::filter(shouldUpdateState)::map(pickKeys).subscribe(::this.setState);
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
          <Component {...props} />
        );
      }
    };
  };
  if (isKeyList) {
    decorator.Type = { ...pick(stateType.meta.props, select), transition: t.Function };
  }
  return decorator;
};
