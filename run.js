import React from 'react';
import debug from 'debug';
import identity from 'lodash/identity';
import find from 'lodash/find';
import { BehaviorSubject } from 'rxjs/subject/BehaviorSubject';
import { ConnectContextTypes } from './connect';
import shallowEqual from './shallowEqual';
import mkContextWrapper from './mkContextWrapper';
import t from 'tcomb';

const log = debug('state:run');

// export for tests
export function createProvideWrapper({
  stateSubject, getPendingState, setPendingState, syncToBrowser, transitionReducer, flushTimeoutMSec
}) {
  const queue = [];
  let lastTransitionId;
  let flushTimeout;

  const maybeRunQueuedTransition = () => {
    if (queue.length > 0) {
      const { args } = queue.shift();
      log('running queued transition', args);
      transition(...args);
    }
  };

  const updateFlushTimeout = () => {
    if (flushTimeout) {
      clearTimeout(flushTimeout);
    }
    flushTimeout = setTimeout(() => {
      if (queue.length > 0 && queue[0].time <= Date.now() - flushTimeoutMSec) {
        setPendingState(null);
        maybeRunQueuedTransition();
        updateFlushTimeout();
      };
    }, flushTimeoutMSec);
  };

  // variadic:
  // (id: String, tr: Tr) => void
  // or
  // (tr: Tr) => void
  //
  // where Tr is `t.Object | t.Function([t.Object], t.Object)`
  const transition = (...args) => {
    const id = args.length === 2 ? t.String(args[0]) : undefined;

    const shouldBeSkipped = !!id && (
      lastTransitionId === id || !!find(queue, ({ args }) => args.length === 2 && args[0] === id)
    );

    if (shouldBeSkipped) {
      log(`transition: skipping transition '${id}'`);
      return;
    }

    if (getPendingState()) {
      log('transition: enqueing this transition:', args);
      queue.push({ args, time: Date.now() });
      updateFlushTimeout();
      // log('transition queue:', queue);
      return;
    }

    log('transition:', args);
    lastTransitionId = id;

    const _transitionFn = args.length === 2 ? args[1] : args[0];
    const isTransitionFunction = t.Function.is(_transitionFn);
    const transitionFn = isTransitionFunction ? _transitionFn : () => t.Object(_transitionFn);

    const state = stateSubject.value;
    const patch = transitionFn(state);

    // log('state is:', state);
    // log('patch is:', patch);
    const shouldReplace = isTransitionFunction;
    const newState = transitionReducer(shouldReplace ? { ...patch } : { ...state, ...patch });

    for (const k in patch) { // eslint-disable-line no-loops/no-loops
      if (t.Nil.is(patch[k])) {
        delete newState[k];
      }
    }

    const stateChanged = !shallowEqual(state, newState);
    // log('new state is:', newState, stateChanged ? '(changed)' : 'NO CHANGE');
    if (stateChanged) {
      const wroteToRouter = syncToBrowser(state, newState);
      if (!wroteToRouter) {
        // log(`didn't write to router, nexting newState`);
        stateSubject.next(newState);
      } else {
        // log(`wrote to router, setting pendingState`);
        setPendingState(newState);
      }
    } else {
      maybeRunQueuedTransition();
    }
  };

  class ProvideWrapper extends React.Component {
    static childContextTypes = ConnectContextTypes

    getChildContext = () => ({
      transition, state: stateSubject
    })

    render() {
      return this.props.children();
    }
  }

  // this subscription is (one of) the first
  // i.e. every connected component will receive updates after this
  // ...meaning decisions taken before `transition` time become risky
  // in presence of other interleaving transitions
  //
  // you can always make choices at `transition` time
  // using the `transition(State => State)` form
  stateSubject.subscribe(maybeRunQueuedTransition);

  return { ProvideWrapper, transition };
}

export default function run({
  // final render
  // could be something like:
  // element => {
  //   React.render(element, mountNode);
  // }
  //
  // (element: ReactElement) => void
  //
  render, // required

  // sync a change to the browser
  // should return true if a change to browser was pushed
  //
  // (oldState: Object, newState: Object) => wrote: Boolean
  //
  syncToBrowser, // required

  // let me subscribe to browser changes
  // should invoke callback at every broser change
  // with the (possibly new) component to be rendered
  // and the (possibly new) state from browser
  // new state
  //
  // (callback:
  //   (component: ReactNode, newStateFromBrowser: Object) => void
  // ) => void
  //
  onBrowserChange, // required

  // provide this custom context object to the tree
  // see also provideContextTypes
  //
  // Object
  //
  provideContext = {},

  // provide this custom contextTypes to the tree
  // see also provideContext
  //
  // Object
  //
  provideContextTypes = {},

  // initial state
  //
  // Object
  //
  initialState = {},

  // apply custom transformations after every state transition
  //
  // (state: Object) => Object
  //
  transitionReducer = identity,

  // merge current state and new browser state
  //
  // (state: Object, browserState: Object) => Object
  //
  mergeStateAndBrowserState = (s, b) => ({ ...s, ...b }),

  // subscribe to every state change
  // ...in case you need it
  //
  // (state: Object) => void
  //
  subscribe = () => {},

  // app own initialization calback
  // ...in case you need it
  // has access access the state Rx.Subject and
  // the transition function (documented elsewhere)
  //
  // (state: Rx.Subject, transition: Function) => void
  //
  init = () => {},

  // force next transition even if pending state
  // is not yet applied after `flushTimeoutMsec`
  //
  // Number
  //
  flushTimeoutMSec = 200
}) {
  const state = new BehaviorSubject(initialState);
  state.subscribe(subscribe);
  let _newState;

  const { ProvideWrapper, transition } = createProvideWrapper({
    stateSubject: state,
    syncToBrowser,
    getPendingState: () => _newState,
    setPendingState: s => { _newState = s; },
    transitionReducer,
    flushTimeoutMSec
  });


  const Provider = mkContextWrapper(provideContext, provideContextTypes);

  onBrowserChange((renderElement: t.Function, fromRouter: t.Object) => {
    if (_newState) {
      log('browser change: user initiated');
      const newState = mergeStateAndBrowserState(_newState, fromRouter);
      _newState = null;
      state.next(newState);
    } else {
      log('browser change: browser initiated');
      state.next(mergeStateAndBrowserState(state.value, fromRouter));
    }
    /* eslint-disable react/display-name */
    render(
      <ProvideWrapper>
        {() => <Provider>{renderElement}</Provider>}
      </ProvideWrapper>
    );
    /* eslint-enable react/display-name */
  });

  transition('start', initialState);

  init(state, transition);

  // return for tests
  return transition;
}
