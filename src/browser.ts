import { History, Action } from 'history';
import createBrowserHistory from 'history/createBrowserHistory';
import trim = require('lodash/trim');
import omit = require('lodash/omit');
import * as qs from 'qs';

export type BrowserState = { [k: string]: string } & { view: string };

export default function(history: History = createBrowserHistory()) {
  // TODO: below, ignoring path params for the moment
  // there's only `view` which is the whole `pathname` from history perspective

  function syncToBrowser(s: BrowserState, push: boolean = true): void {
    const pathname = `/${s.view}`;
    const search = `?${qs.stringify(omit(s, ['view']))}`;
    (push ? history.push : history.replace)({ pathname, search });
  }

  // TODO(gio): `location` here is optional just because (I think)
  // it can be undefined in some tests using `memoryHistory`
  function parseBrowserState(location?: typeof history.location): BrowserState {
    const view = location ? trim(location.pathname, ' /') : '';
    const s = location ? qs.parse(location.search, { ignoreQueryPrefix: true }) : {};
    return { ...s, view };
  }

  function onBrowserChange(callback: (s: BrowserState, action: Action) => void): void {
    history.listen((location, action) => {
      callback(parseBrowserState(location), action);
    });
    callback(parseBrowserState(history.location), 'PUSH');
  }

  return { syncToBrowser, onBrowserChange };
}
