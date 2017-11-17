import * as t from 'tcomb';
import shallowEqual from './shallowEqual';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import * as debug from 'debug';
import { StateT } from './StateT';

export type TransitionFunctionFunction<S extends StateT> = (s: S) => S;
export type TransitionFunctionPatch<S extends StateT> = { [k in keyof S]?: S[k] | null };
export type TransitionFunction<S extends StateT> = (
  transition: TransitionFunctionFunction<S> | TransitionFunctionPatch<S>
) => void;
export type DryRunTransitionFunction<S extends StateT> = (
  state: S,
  transition: TransitionFunctionFunction<S> | TransitionFunctionPatch<S>
) => {
  patch: TransitionFunctionPatch<S>;
  stateChanged: boolean;
  newState: S;
};

const log = debug('state:transition');

export type MakeTransitionParams<S extends StateT> = {
  stateSubject: BehaviorSubject<S>;
  transitionReducer: TransitionFunctionFunction<S>;
  stateType: t.Interface<S>;
  syncToBrowser: (oldState: S, newState: S) => void;
};
export default function makeTransition<S extends StateT>({
  stateSubject,
  transitionReducer,
  stateType,
  syncToBrowser
}: MakeTransitionParams<S>): {
  transition: TransitionFunction<S>;
  dryRunTransition: DryRunTransitionFunction<S>;
} {
  const dryRunTransition: DryRunTransitionFunction<S> = (state, _transition) => {
    const isTransitionFunction = t.Function.is(_transition);
    const transitionFn = isTransitionFunction
      ? (_transition as TransitionFunctionFunction<S>) // TODO(typo): cast
      : (((() => _transition) as any) as TransitionFunctionFunction<S>); // TODO(typo): cast + removed `t.Object(` check

    const patch = transitionFn(state);

    const shouldReplace = isTransitionFunction;
    const newState = stateType(
      // TODO(typo): double check, it was:
      // transitionReducer(shouldReplace ? { ...patch } : { ...state, ...patch })
      // using Object.assign because of `[ts] Spread types may only be created from object types`
      transitionReducer(shouldReplace ? Object.assign({}, patch) : Object.assign({}, state, patch))
    );

    const stateChanged = !shallowEqual(state, newState);
    return { patch, stateChanged, newState };
  };
  return {
    dryRunTransition,
    transition: _transition => {
      const state = stateSubject.value;
      const { patch, stateChanged, newState } = dryRunTransition(state, _transition);
      log('transition:', _transition);
      log('state is:', state);
      log('patch is:', patch);
      log('new state is:', stateChanged ? '(changed)' : 'NO CHANGE', newState);
      if (stateChanged) {
        stateSubject.next(newState);
        syncToBrowser(state, newState);
      }
    }
  };
}
