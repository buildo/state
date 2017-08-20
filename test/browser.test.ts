import mkBrowser, { parseBrowserState, serializeBrowserState } from '../src/browser';
import createMemoryHistory from 'history/createMemoryHistory';
import { Location } from 'history';

function partialLocation(pl: Partial<Location>): Location {
  return {
    pathname: '/',
    search: '?',
    hash: '#',
    key: 'foobar',
    state: null,
    ...pl
  };
}

describe('browser', () => {
  describe('syncToBrowser', () => {
    it('should push a new history item if push is true', () => {
      const history = createMemoryHistory();
      const { syncToBrowser } = mkBrowser(history);
      syncToBrowser({ view: 'foo', foo: 'bar' }, true);
      expect(history.location.pathname).toBe('/foo');
      expect(history.location.search).toBe('?foo=bar');
      expect(history.length).toBe(2);
    });

    it('should replace the current history item if push is false', () => {
      const history = createMemoryHistory();
      const { syncToBrowser } = mkBrowser(history);
      syncToBrowser({ view: 'foo', foo: 'bar' }, false);
      expect(history.location.pathname).toBe('/foo');
      expect(history.location.search).toBe('?foo=bar');
      expect(history.length).toBe(1);
    });

    it('should default to an empty pathname if view param is not provided', () => {
      const history = createMemoryHistory();
      const { syncToBrowser } = mkBrowser(history);
      syncToBrowser({ foo: 'bar', view: '' }, false);
      expect(history.location.pathname).toBe('/');
    });
  });

  describe('onBrowserChange', () => {
    it('should be called synchronously after a syncToBrowser push=true, with action=PUSH', () => {
      const onBrowserChangeSpy = jest.fn();
      const { syncToBrowser, onBrowserChange } = mkBrowser(createMemoryHistory());
      onBrowserChange(onBrowserChangeSpy);
      expect(onBrowserChangeSpy.mock.calls.length).toBe(1);
      syncToBrowser({ view: 'foo', foo: 'bar' }, true);
      expect(onBrowserChangeSpy.mock.calls.length).toBe(1 + 1);
      expect(onBrowserChangeSpy.mock.calls[onBrowserChangeSpy.mock.calls.length - 1]).toEqual([
        { view: 'foo', foo: 'bar' },
        'PUSH'
      ]);
    });

    it('should be called synchronously after a syncToBrowser push=false, with action=REPLACE', () => {
      const onBrowserChangeSpy = jest.fn();
      const { syncToBrowser, onBrowserChange } = mkBrowser(createMemoryHistory());
      onBrowserChange(onBrowserChangeSpy);
      expect(onBrowserChangeSpy.mock.calls.length).toBe(1);
      syncToBrowser({ view: 'foo', foo: 'bar' }, false);
      expect(onBrowserChangeSpy.mock.calls.length).toBe(1 + 1);
      expect(onBrowserChangeSpy.mock.calls[onBrowserChangeSpy.mock.calls.length - 1]).toEqual([
        { view: 'foo', foo: 'bar' },
        'REPLACE'
      ]);
    });

    it('should be called synchronously after a browser back, with action=POP', () => {
      const onBrowserChangeSpy = jest.fn();
      const history = createMemoryHistory();
      const { syncToBrowser, onBrowserChange } = mkBrowser(history);
      onBrowserChange(onBrowserChangeSpy);
      syncToBrowser({ view: 'foo', foo: 'bar' }, false);
      expect(onBrowserChangeSpy.mock.calls.length).toBe(2);
      history.goBack();
      expect(onBrowserChangeSpy.mock.calls.length).toBe(2 + 1);
      expect(onBrowserChangeSpy.mock.calls[onBrowserChangeSpy.mock.calls.length - 1]).toEqual([
        { view: 'foo', foo: 'bar' },
        'POP'
      ]);
    });
  });

  describe('parseBrowserState', () => {
    it('should trim slashes from view param', () => {
      expect(parseBrowserState(partialLocation({ pathname: '/view//' }))).toEqual({ view: 'view' });
    });

    it('should trim question marks from search params', () => {
      expect(parseBrowserState(partialLocation({ search: '??foo=foo&bar=bar' }))).toEqual({
        view: '',
        foo: 'foo',
        bar: 'bar'
      });
    });
  });

  describe('serializeBrowserState', () => {
    it('should produce urlencoded pathnames with a single leading /', () => {
      expect(serializeBrowserState({ view: 'foo' }).pathname).toEqual('/foo');
      expect(serializeBrowserState({ view: '/foo/' }).pathname).toEqual('/%2Ffoo%2F');
    });

    it('should produce urlencoded searches with a single leading ?', () => {
      expect(serializeBrowserState({ view: 'foo', foo: 'foo', bar: 'bar' }).search).toBe('?foo=foo&bar=bar');
      expect(serializeBrowserState({ view: 'foo', '?foo': 'foo', bar: 'bar' }).search).toBe('?%3Ffoo=foo&bar=bar');
    });
  });
});
