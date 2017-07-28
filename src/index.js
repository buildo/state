import run from './run';
import connect from './connect';
import parseParams from './parseParams';
import stringifyParams from './stringifyParams';
import t from 'tcomb';

const isStrictInterface = (x) => {
  return t.isType(x) && (x.meta.kind === 'interface') && (x.meta.strict === true);
};

export default stateType => {
  if (!isStrictInterface(stateType)) {
    throw new Error('`stateType` must be a strict tcomb interface');
  }

  const StateType = t.interface({
    ___k: t.maybe(t.Number),
    ...stateType.meta.props
  }, { strict: true, name: stateType.meta.name });

  return {
    appState: StateType,
    run: run(StateType),
    connect: connect(StateType),
    parseParams: parseParams(stateType),
    stringifyParams
  };
};
