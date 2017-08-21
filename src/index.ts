import * as t from 'tcomb';
import run, { Run } from './run';
import connect, { Connect } from './connect';
import { StateT, StateTcombType } from './StateT';

const isStrictInterface = (x: any) => {
  return t.isType(x) && x.meta.kind === 'interface' && x.meta.strict === true;
};

/**
 * @param stateType tcomb interface for State type
 */
export default function<S extends StateT>(
  stateType: StateTcombType<S>
): {
  run: Run<S>;
  appState: t.Interface<S>;
  connect: Connect<S>;
} {
  if (!isStrictInterface(stateType)) {
    throw new Error('`stateType` must be a strict tcomb interface');
  }

  return {
    appState: stateType,
    run: args => run(stateType)(args),
    connect: connect(stateType)
  };
}
