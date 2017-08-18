import * as debug from 'debug';
import difference = require('lodash/difference');
import pickBy = require('lodash/pickBy');
import omitBy = require('lodash/omitBy');
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ConnectContextTypes } from './connect';
import mkContextWrapper, { ProvideContext, ProvideContextTypes } from './ContextWrapper';
import mkTransition from './transition';
import { TransitionFunction, TransitionFunctionFunction } from './transition';
import * as t from 'tcomb';
import mkBrowser, { BrowserState } from './browser';
import { StateT, StateTcombType } from './StateT';
import { History } from 'history';
import { stringify as _stringify, parse as _parse, ParsedBrowserState } from './parser';

declare var process: any; // TODO(typo)

const log = debug('state:run');

const omitNils = <S extends StateT>(s: S) => omitBy<S, S>(s, t.Nil.is);

export type StateContextWrapper = React.ComponentType<{}>;

export type StateSubject<S extends StateT> = BehaviorSubject<S>;

export type RunParams<S extends StateT> = {
  initialState: S;
  transitionReducer?: TransitionFunctionFunction<S>;
  subscribe?: (s: S) => void;
  init?: (s: StateSubject<S>, t: TransitionFunction<S>) => void;
  shouldSerializeKey?: (k: keyof S) => boolean;
  shouldBrowserPatchBePushedOrReplaced?: (oldState: S, newState: S) => boolean;
  provideContext?: ProvideContext;
  provideContextTypes?: ProvideContextTypes;
  history?: History;
};
export type RunReturn = Promise<StateContextWrapper>;
export type Run<S extends StateT> = (p: RunParams<S>) => RunReturn;

function parseAndPickValidStateKeys<S extends StateT>(stateType: StateTcombType<S>, b: BrowserState): S {
  const parsed = _parse(stateType)(b);
  return pickBy<S, ParsedBrowserState>(parsed, (v, k) => {
    return stateType.meta.props.hasOwnProperty(k) && (stateType.meta.props[k] as t.Type<any>).is(v);
  });
}

const mergeStateAndBrowserState = <S extends StateT>(stateType: StateTcombType<S>) => (s: S, b: BrowserState) =>
  omitNils({ ...s as any, ...parseAndPickValidStateKeys(stateType, b) as any }) as S; // TODO(typo)

const transitionReducerIdentity = <S extends StateT>(s: S) => s;

export default <S extends StateT>(stateType: StateTcombType<S>) => ({
  // initial state
  initialState,

  // apply custom transformations after every state transition
  transitionReducer: _transitionReducer = transitionReducerIdentity,

  // subscribe to every state change
  // ...in case you need it
  subscribe = () => {},

  // app own initialization calback
  // ...in case you need it
  // has access access the state Rx.Subject and
  // the transition function (documented elsewhere)
  init = () => {},

  // whether to serialize (sync to browser) a state key or not
  shouldSerializeKey = () => true,

  // whether a patch should be serialized (synced to browser) as a new history item
  // (true and default) or replace the current history item (false)
  shouldBrowserPatchBePushedOrReplaced = () => true,

  // optionally pass additional react context via the Provider
  provideContext = {},
  provideContextTypes = {},

  // optionally pass a custom history (different from browser history)
  // this is only for tests at the moment, but could be necessary for SSR too in the future
  history
}: RunParams<S>): RunReturn => {
  const transitionReducer: TransitionFunctionFunction<S> = (s: S) => omitNils<S>(_transitionReducer(s));

  const state = new BehaviorSubject(stateType(initialState));
  state.subscribe(subscribe);

  const { syncToBrowser, onBrowserChange } = mkBrowser(history);

  const stringify = _stringify(stateType);

  const transition = mkTransition({
    stateSubject: state,
    stateType,
    syncToBrowser: (oldState, newState) => {
      const newSerialized = pickBy<S, S>(newState, (_: any, k) => shouldSerializeKey(k));
      if (process.env.NODE_ENV === 'development') {
        log('syncing to browser, omitted:', difference(Object.keys(newState), Object.keys(newSerialized)));
      }
      const newStringified = stringify(newSerialized);
      return syncToBrowser(newStringified, shouldBrowserPatchBePushedOrReplaced(oldState, newState));
    },
    transitionReducer
  });

  const ProvideWrapper = mkContextWrapper(
    { ...provideContext, transition, state },
    { ...provideContextTypes, ...ConnectContextTypes }
  );

  // wait to receive the first browser state before resolving, so that users can
  // render with something meaningful at hand
  let _bootstrapped = false;

  const mergeStateAndValidBrowserState = mergeStateAndBrowserState<S>(stateType);

  // TODO(gio): is this promise really needed? can't we just read the first browser state synchronously?
  // problem: in this way we are loosing all error thrown by `onBrowserChange` or `init`
  return new Promise((resolve, reject) => {
    try {
      onBrowserChange(fromRouter => {
        log('browser change', fromRouter);
        const newState = mergeStateAndValidBrowserState(state.value, fromRouter);
        transition(newState);

        if (!_bootstrapped) {
          _bootstrapped = true;
          resolve(ProvideWrapper);
        }
      });

      init(state, transition);
    } catch (e) {
      reject(e);
    }
  });
};
