import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import mkTransition, { TransitionFunction } from '../src/transition';
import { StateT } from '../src/StateT';
import * as t from 'tcomb';
import identity = require('lodash/identity');

export default function<S extends StateT>({
  stateType,
  initialState
}: {
  stateType: t.Interface<S>;
  initialState: S;
}): { transition: TransitionFunction<S>; states: S[] } {
  const stateSubject = new BehaviorSubject<S>(initialState);
  const states: S[] = [];
  stateSubject.subscribe(s => {
    states.push(s);
  });
  const { transition } = mkTransition({
    stateType,
    stateSubject,
    transitionReducer: identity,
    syncToBrowser: () => {},
    dryRunBrowserTransition: s => s
  });
  return { states, transition };
}
