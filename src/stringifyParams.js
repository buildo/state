export default (params) => {
  return Object.keys(params).reduce((acc, paramName) => ({
    ...acc,
    [paramName]: String(params[paramName])
  }), {});
};
