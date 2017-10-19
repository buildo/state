import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import mkTransition, { TransitionFunction } from '../src/transition';
import { StateT } from '../src/StateT';
import * as t from 'tcomb';
import omitBy = require('lodash/omitBy');

const omitNils = <S extends StateT>(s: S) => omitBy<S, S>(s, t.Nil.is);

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
    transitionReducer: omitNils, // TODO: not nice. Either move inside transition impl., or move tests relying on omitNils at an higher level
    syncToBrowser: () => {}
  });
  return { states, transition };
}
