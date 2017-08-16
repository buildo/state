import createHistory from 'history/createBrowserHistory';
import trim = require('lodash/trim');
import omit = require('lodash/omit');
import * as qs from 'qs';

export type BrowserState = { [k: string]: string } & { view: string };

// TODO: makes it hardly testable and also not configurable for iso (needs to be static location + not a singleton)
const history = createHistory();

// TODO: below, ignoring path params for the moment
// there's only `view` which is the whole `pathname` from history perspective

export function syncToBrowser(s: BrowserState, push: boolean = true): void {
  const pathname = `/${s.view}`;
  const search = `?${qs.stringify(omit(s, ['view']))}`;
  (push ? history.push : history.replace)({ pathname, search });
}

function parseBrowserState(location: typeof history.location): BrowserState {
  const view = trim(location.pathname, ' /');
  const s = qs.parse(location.search);
  return { ...s, view };
}

export function onBrowserChange(callback: (s: BrowserState) => void): void {
  history.listen(location => {
    setTimeout(() => {
      // TODO: something better than setTimeout here?
      callback(parseBrowserState(location));
    });
  });
  setTimeout(() => {
    // TODO: something better than setTimeout here?
    callback(parseBrowserState(history.location));
  });
}
