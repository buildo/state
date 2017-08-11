const getTypeName = (type) => {
  if (type.meta.kind === 'irreducible') {
    return type.meta.name;
  } else if (type.meta.kind === 'maybe' && type.meta.type.meta.kind === 'irreducible') {
    return type.meta.type.meta.name;
  } else {
    return undefined;
  }
};

const identity = x => x;

const booleanMap = {
  true: true,
  false: false
};

const parseBoolean = (value) => {
  const parsedValue = booleanMap[value];
  if (parsedValue === void 0) {
    throw new Error(`${value} is not parsable as boolean`);
  }
  return parsedValue;
};

const parseNumber = (value) => {
  const parsedValue = parseFloat(value);
  if (String(parsedValue) !== value) {
    throw new Error(`${value} is not parsable as number`);
  }
  return parsedValue;
};

const parsers = {
  Boolean: parseBoolean,
  Number: parseNumber
};

export default (stateType) => {
  return (params) => {
    return Object.keys(params).reduce((acc, paramName) => {
      const paramType = stateType.meta.props[paramName];
      if (!paramType) {
        throw new Error(`${paramName} is not defined in state`);
      }
      const paramTypeName = getTypeName(paramType);
      const param = params[paramName];
      const parse = parsers[paramTypeName] || identity;
      return {
        ...acc,
        [paramName]: parse(param)
      };
    }, {});
  };
};