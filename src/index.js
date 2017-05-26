import run from './run';
import connect from './connect';
import t from 'tcomb';

const isStrictInterface = (x) => {
  return t.isType(x) && (x.meta.kind === 'interface') && (x.meta.strict === true);
};

export default stateType => {
  if (!isStrictInterface(stateType)) {
    throw new Error('`stateType` must be a strict tcomb interface');
  }

  return {
    run: run(stateType),
    connect: connect(stateType)
  };
};
