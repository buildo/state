import { History } from 'history';
import createBrowserHistory from 'history/createBrowserHistory';
import trim = require('lodash/trim');
import omit = require('lodash/omit');
import * as qs from 'qs';

export type BrowserState = { [k: string]: string } & { view: string };

export default function(history: History = createBrowserHistory()) {
  // TODO: below, ignoring path params for the moment
  // there's only `view` which is the whole `pathname` from history perspective

  function syncToBrowser(s: BrowserState, push: boolean = true): void {
    const pathname = `/${s.view || ''}`;
    const search = `?${qs.stringify(omit(s, ['view']))}`;
    (push ? history.push : history.replace)({ pathname, search });
  }

  function parseBrowserState(location: typeof history.location): BrowserState {
    const view = trim(location.pathname, ' /');
    const s = qs.parse(location.search, { ignoreQueryPrefix: true });
    return { ...s, view };
  }

  function onBrowserChange(callback: (s: BrowserState) => void): void {
    history.listen(location => {
      callback(parseBrowserState(location));
    });
    callback(parseBrowserState(history.location));
  }

  return { syncToBrowser, onBrowserChange };
}