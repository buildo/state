export default function(
  objA?: null | undefined | { [k: string]: any },
  objB?: null | undefined | { [k: string]: any }
): boolean {
  if (objA === objB) {
    return true;
  }

  if (!objA || !objB || typeof objA !== 'object' || typeof objB !== 'object') {
    return false;
  }

  let key;

  // eslint-disable-next-line no-loops/no-loops
  for (key in objA) {
    if (objA.hasOwnProperty(key) && (!objB.hasOwnProperty(key) || objA[key] !== objB[key])) {
      return false;
    }
  }

  // eslint-disable-next-line no-loops/no-loops
  for (key in objB) {
    if (objB.hasOwnProperty(key) && !objA.hasOwnProperty(key)) {
      return false;
    }
  }

  return true;
}
