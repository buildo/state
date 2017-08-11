export default (params) => {
  return Object.keys(params).reduce((acc, paramName) => ({
    ...acc,
    [paramName]: JSON.stringify(params[paramName])
  }), {});
};
