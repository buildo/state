import { History, Location, Action } from 'history';
import createBrowserHistory from 'history/createBrowserHistory';
import trim = require('lodash/trim');
import * as qs from 'qs';
import find = require('lodash/find');
import mapValues = require('lodash/mapValues');
import omit = require('lodash/omit');

export type PathConfig<S extends BrowserState> = {
  deserialize: (pathname: string) => Partial<S> | null;
  serialize: (state: Partial<S>) => string;
  is: (state: S) => boolean;
  pick: (state: S) => Partial<S>;
};
export type PathConfigs<S extends BrowserState> = Array<PathConfig<S>>;

export type BrowserState = { [k: string]: string } & { view: string };

const defaultNoPath: PathConfig<BrowserState> = {
  deserialize: (pathname: string) => ({ view: pathname }),
  serialize: ({ view: pathname }: BrowserState) => pathname,
  is: () => true,
  pick: s => ({ view: s.view })
};

function parsePathname(pathname: string, paths: PathConfigs<BrowserState>): Partial<BrowserState> {
  const path = find(paths, p => Boolean(p.deserialize(pathname))) || defaultNoPath;
  return path.deserialize(pathname)!;
}

// export is for tests only
// TODO(gio): `location` here is optional just because (I think)
// it can be undefined in some tests using `memoryHistory`
export function parseBrowserState(paths: PathConfigs<BrowserState>, location?: Location): BrowserState {
  const pathState = parsePathname(location ? trim(location.pathname, ' /') : '', paths);
  const s = location ? qs.parse(trim(location.search, ' ?')) : {};
  return { ...s, ...pathState };
}

// export is for tests only
export function serializeBrowserState(s: BrowserState, paths: PathConfigs<BrowserState>): Partial<Location> {
  const path = find(paths, p => p.is(s)) || defaultNoPath;
  const pathState = path.pick(s);
  const pathname = `/${path.serialize(mapValues(pathState, encodeURIComponent))}`;
  const search = `?${qs.stringify(omit(s, Object.keys(pathState)))}`; // will encode URI by default
  return { pathname, search };
}

export default function(paths: PathConfigs<BrowserState> = [], history: History = createBrowserHistory()) {
  function syncToBrowser(s: BrowserState, push: boolean = true): void {
    (push ? history.push : history.replace)(serializeBrowserState(s, paths));
  }

  function onBrowserChange(callback: (s: BrowserState, action: Action) => void): void {
    history.listen((location, action) => {
      callback(parseBrowserState(paths, location), action);
    });
    callback(parseBrowserState(paths, history.location), 'PUSH');
  }

  return { syncToBrowser, onBrowserChange };
}
