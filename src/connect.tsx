import * as React from 'react';
import * as PropTypes from 'prop-types';
import * as debug from 'debug';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subscription } from 'rxjs/Subscription';
import omit = require('lodash/omit');
import pick = require('lodash/pick');
import * as t from 'tcomb';
import shallowEqual from './shallowEqual';
import { TransitionFunction } from './transition';
import { ObjectOmit } from 'typelevel-ts';
import { StateT as ST } from './StateT';

declare var process: any; // TODO(typo)

const warn = debug('state:connect');
warn.log = console.warn.bind(console); // eslint-disable-line no-console

export const ConnectContextTypes = {
  transition: PropTypes.func.isRequired,
  state: PropTypes.object.isRequired
};

function defaultGetNewState<S extends ST, Decl extends string>(declaration: Decl[]) {
  return (v: S) =>
    declaration.reduce(
      (acc, key) => ({
        ...acc,
        [key as string]: v[key as string] // TODO(typo)
      }),
      {}
    );
}

export type ConnectConfig = {
  /**
   * Implement a standard shouldComponentUpdate with shallowEquals.
   * Should be `false` on non-pure components, e.g. react-router `RouteHandler`s.
   * default: true
   */
  pure?: boolean;
  /**
   * Do not rerender if received state is not valid.
   * default: true
   * @deprecated not needed anymore (it was needed with React Router)
   */
  filterValid?: boolean;
  /**
   * Do not pass down some of the received props.
   * default: []
   * @deprecated not needed anymore (it was handy with React Router)
   */
  killProps?: string[];
};
export type ConnectedComponentProps<P extends {}, Decl extends string> = ObjectOmit<P, Decl | 'transition'>;
export type ConnectedComponent<P extends {}, Decl extends string> = React.ComponentType<
  ConnectedComponentProps<P, Decl>
>;
export type DecoratedComponent<S extends ST, P extends {}> = React.ComponentType<
  P & { transition?: TransitionFunction<S> }
>;
export type ConnectDecorator<S extends ST, Decl extends keyof S> = <P>(
  /**
   * Component to connect.
   * Will be rendered adding the declared keys from state and `transition` as props
   */
  C: DecoratedComponent<S, P>
) => ConnectedComponent<P, Decl>;
export type ConnectDeclaration<S extends ST, Decl extends keyof S> = ConnectDecorator<S, Decl> &
  ({
    Type: { [k in Decl]: t.Type<any> } & { transition: t.Function1 };
  });
export type Connect<S extends ST> = <Decl extends keyof S>(
  /**
   * Keys of State to be connected and passed to this container
   */
  decl: Decl[],
  /**
   * Additional configurations
   */
  config?: ConnectConfig
) => ConnectDeclaration<S, Decl>;

// global state tcomb type
export default function makeConnect<S extends ST>(stateType: t.Interface<S>): Connect<S> {
  // expects a list of keys to connect from state
  // and an optional configuration object
  return function connectDeclaration<Decl extends keyof S>(
    decl: Decl[] = [],
    {
      pure = true,
      // do not update the component props if the type declaration doesn't match
      // useful to skip "router transitioning" problems: old container that should be unmounted
      // soon (but still async) by re-rendering after a router change would otherwise receive
      // the new (and possibly incorrect from their POV) state
      // TODO(gio): elaborate better / try to remove
      filterValid = true,
      killProps = []
    }: ConnectConfig = {}
  ) {
    if (process.env.NODE_ENV !== 'production') {
      const isKeyList = t.list(t.String).is(decl);
      if (!isKeyList) {
        throw new Error('connect expects a list of state keys');
      }

      decl.forEach(k => {
        if (!stateType.meta.props.hasOwnProperty(k)) {
          throw new Error(`${k} is not defined in state`);
        }
      });
    }

    const decorator: ConnectDecorator<S, Decl> = <P extends {}>(Component: DecoratedComponent<S, P>) => {
      const displayName = `connect(${Component.displayName || Component.name || 'Component'})`;

      const getNewState = defaultGetNewState(decl);

      const shouldUpdateState = filterValid
        ? (v: S) => {
            const invalid = decl.filter(k => !(stateType.meta.props[k] as t.Type<any>).is(v[k])); // TODO(typo)

            if (invalid.length > 0 && process.env.NODE_ENV === 'development') {
              warn(`Skipping update for ${displayName}. Invalid keys: ${invalid.join(', ')}`);
            }
            return invalid.length === 0;
          }
        : () => true;

      type ContextT<S extends ST> = {
        // TODO(typo): move elsewhere and reuse
        state: BehaviorSubject<S>;
        transition: TransitionFunction<S>;
      };
      type StateT<S extends ST, Decl extends keyof S> = { [k in Decl]: S[k] } | {};
      return class ConnectWrapper extends React.Component<ConnectedComponentProps<P, Decl>, StateT<S, Decl>> {
        static contextTypes = ConnectContextTypes;

        static displayName = displayName;

        constructor(props: ConnectedComponentProps<P, Decl>, context: ContextT<S>) {
          super(props, context);
          const value = context.state.value;
          if (shouldUpdateState(value)) {
            this.state = getNewState(value);
          } else {
            this.state = {};
          }
        }

        context: ContextT<S>;
        _subscription?: Subscription;

        componentDidMount() {
          this._subscription = this.context.state
            .filter(shouldUpdateState)
            .map(getNewState)
            .subscribe(this.setState.bind(this));
        }

        componentWillUnmount() {
          if (this._subscription) {
            this._subscription.unsubscribe();
          }
        }

        shouldComponentUpdate(nextProps: ConnectedComponentProps<P, Decl>, nextState: StateT<S, Decl>) {
          return pure ? !shallowEqual(this.props, nextProps) || !shallowEqual(this.state, nextState) : true;
        }

        render() {
          const props = {
            // state first: connected props are overridable by "actual" (passed) props
            // it's useful for av@queries, av@commands
            ...this.state as any, // TODO(typo): spread types can only be created from object types
            ...omit(this.props as any, killProps), // TODO(typo): spread types can only be created from object types
            transition: this.context.transition
          };
          return <Component {...props} />;
        }
      };
    };

    (decorator as ConnectDeclaration<S, Decl>).Type = {
      ...pick(stateType.meta.props, decl) as any, // TODO(typo): ugh
      transition: t.Function
    };
    return decorator as ConnectDeclaration<S, Decl>;
  };
}
