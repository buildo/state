import { History, Location, Action } from 'history';
import createBrowserHistory from 'history/createBrowserHistory';
import trim = require('lodash/trim');
import * as qs from 'qs';
import find = require('lodash/find');
import mapValues = require('lodash/mapValues');
import omit = require('lodash/omit');
import difference = require('lodash/difference');

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

function pathnameToPathConfig(pathname: string, paths: PathConfigs<BrowserState>): PathConfig<BrowserState> {
  return find(paths, p => Boolean(p.deserialize(pathname))) || defaultNoPath;
}

function locationToPathname(location?: Location): string {
  return location ? trim(location.pathname, ' /') : '';
}

function locationToPathConfig(paths: PathConfigs<BrowserState>, location?: Location): PathConfig<BrowserState> {
  return pathnameToPathConfig(locationToPathname(location), paths);
}

function parsePathname(paths: PathConfigs<BrowserState>, location?: Location): Partial<BrowserState> {
  return locationToPathConfig(paths, location).deserialize(locationToPathname(location))!;
}

// export is for tests only
// TODO(gio): `location` here is optional just because (I think)
// it can be undefined in some tests using `memoryHistory`
export function parseBrowserState(paths: PathConfigs<BrowserState>, location?: Location): BrowserState {
  const pathState = parsePathname(paths, location);
  const s = location ? qs.parse(trim(location.search, ' ?')) : {};
  return { ...s, ...pathState };
}

function cleanupPathParams(
  s: BrowserState,
  currentPath: PathConfig<BrowserState>,
  nextPath: PathConfig<BrowserState>
): BrowserState {
  const currentPathParamKeys = Object.keys(currentPath.pick(s));
  const nextPathParamKeys = Object.keys(nextPath.pick(s));
  return omit(s, difference(currentPathParamKeys, nextPathParamKeys));
}

function browserStateToPathConfig(paths: PathConfigs<BrowserState>, s: BrowserState): PathConfig<BrowserState> {
  return find(paths, p => p.is(s)) || defaultNoPath;
}

// export is for tests only
export function serializeBrowserState(paths: PathConfigs<BrowserState>, s: BrowserState): Partial<Location> {
  const path = browserStateToPathConfig(paths, s);
  const pathState = path.pick(s);
  const pathname = `/${path.serialize(mapValues(pathState, encodeURIComponent))}`;
  const search = `?${qs.stringify(omit(s, Object.keys(pathState)))}`; // will encode URI by default
  return { pathname, search };
}

export default function(paths: PathConfigs<BrowserState> = [], history: History = createBrowserHistory()) {
  let currentPath = locationToPathConfig(paths, history.location);

  function syncToBrowser(s: BrowserState, push: boolean = true): void {
    (push ? history.push : history.replace)(serializeBrowserState(paths, s));
  }

  function onBrowserChange(callback: (s: BrowserState, action: Action) => void): void {
    history.listen((location, action) => {
      currentPath = locationToPathConfig(paths, location);
      callback(parseBrowserState(paths, location), action);
    });
    callback(parseBrowserState(paths, history.location), 'PUSH');
  }

  function dryRunBrowserTransition<S extends BrowserState>(s: S): S {
    return cleanupPathParams(s, currentPath, browserStateToPathConfig(paths, s)) as S;
  }

  return { syncToBrowser, onBrowserChange, dryRunBrowserTransition };
}
