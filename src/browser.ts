import { History, Location, Action } from 'history';
import createBrowserHistory from 'history/createBrowserHistory';
import trim = require('lodash/trim');
import omit = require('lodash/omit');
import * as qs from 'qs';

// TODO: below, ignoring path params for the moment
// there's only `view` which is the whole `pathname` from history perspective

export type BrowserState = { [k: string]: string } & { view: string };

// export is for tests only
// TODO(gio): `location` here is optional just because (I think)
// it can be undefined in some tests using `memoryHistory`
export function parseBrowserState(location?: Location): BrowserState {
  const view = location ? trim(location.pathname, ' /') : '';
  const s = location ? qs.parse(trim(location.search, ' ?')) : {};
  return { ...s, view };
}

// export is for tests only
export function serializeBrowserState(s: BrowserState): Partial<Location> {
  const pathname = `/${encodeURIComponent(s.view)}`;
  const search = `?${qs.stringify(omit(s, ['view']))}`; // will encode URI by default
  return { pathname, search };
}

export default function(history: History = createBrowserHistory()) {
  function syncToBrowser(s: BrowserState, push: boolean = true): void {
    (push ? history.push : history.replace)(serializeBrowserState(s));
  }

  function onBrowserChange(callback: (s: BrowserState, action: Action) => void): void {
    history.listen((location, action) => {
      callback(parseBrowserState(location), action);
    });
    callback(parseBrowserState(history.location), 'PUSH');
  }

  return { syncToBrowser, onBrowserChange };
}
