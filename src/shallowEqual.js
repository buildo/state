export default function(objA, objB) {
  if (objA === objB) {
    return true;
  }

  if (!objA || !objB || typeof objA !== 'object' || typeof objB !== 'object') {
    return false;
  }

  let key;

  for (key in objA) { // eslint-disable-line no-loops/no-loops
    if (objA.hasOwnProperty(key) &&
        (!objB.hasOwnProperty(key) || objA[key] !== objB[key])) {
      return false;
    }
  }

  for (key in objB) { // eslint-disable-line no-loops/no-loops
    if (objB.hasOwnProperty(key) && !objA.hasOwnProperty(key)) {
      return false;
    }
  }

  return true;
}
