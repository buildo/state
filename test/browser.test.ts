import mkBrowser, { parseBrowserState, serializeBrowserState } from '../src/browser';
import createMemoryHistory from 'history/createMemoryHistory';
import { Location } from 'history';
import omit = require('lodash/omit');

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
      const { syncToBrowser } = mkBrowser([], history);
      syncToBrowser({ view: 'foo', foo: 'bar' }, true);
      expect(history.location.pathname).toBe('/foo');
      expect(history.location.search).toBe('?foo=bar');
      expect(history.length).toBe(2);
    });

    it('should replace the current history item if push is false', () => {
      const history = createMemoryHistory();
      const { syncToBrowser } = mkBrowser([], history);
      syncToBrowser({ view: 'foo', foo: 'bar' }, false);
      expect(history.location.pathname).toBe('/foo');
      expect(history.location.search).toBe('?foo=bar');
      expect(history.length).toBe(1);
    });

    it('should default to an empty pathname if view param is not provided', () => {
      const history = createMemoryHistory();
      const { syncToBrowser } = mkBrowser([], history);
      syncToBrowser({ foo: 'bar', view: '' }, false);
      expect(history.location.pathname).toBe('/');
    });
  });

  describe('onBrowserChange', () => {
    it('should be called synchronously after a syncToBrowser push=true, with action=PUSH', () => {
      const onBrowserChangeSpy = jest.fn();
      const { syncToBrowser, onBrowserChange } = mkBrowser([], createMemoryHistory());
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
      const { syncToBrowser, onBrowserChange } = mkBrowser([], createMemoryHistory());
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
      const { syncToBrowser, onBrowserChange } = mkBrowser([], history);
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

  const userDetailPathConfig = {
    serialize: s => `users/${s.userId}`,
    deserialize: pathname => {
      const match = pathname.match(/^users\/(\d+)$/);
      return match ? { view: 'users', userId: match[1] } : null;
    },
    is: ({ view }) => view === 'users',
    pick: s => ({ view: s.view, userId: s.userId })
  };

  describe('parseBrowserState', () => {
    it('should trim slashes from view param', () => {
      expect(parseBrowserState([], partialLocation({ pathname: '/view//' }))).toEqual({ view: 'view' });
    });

    it('should trim question marks from search params', () => {
      expect(parseBrowserState([], partialLocation({ search: '??foo=foo&bar=bar' }))).toEqual({
        view: '',
        foo: 'foo',
        bar: 'bar'
      });
    });

    it('should deserialize configured paths', () => {
      expect(
        parseBrowserState([userDetailPathConfig], partialLocation({ pathname: '/users/11', search: '?foo=foo' }))
      ).toEqual({
        view: 'users',
        foo: 'foo',
        userId: '11'
      });
    });

    it('should deserialize with default path in case of no match', () => {
      expect(
        parseBrowserState([userDetailPathConfig], partialLocation({ pathname: '/bar', search: '?foo=foo' }))
      ).toEqual({
        view: 'bar',
        foo: 'foo'
      });
    });
  });

  describe('serializeBrowserState', () => {
    it('should produce urlencoded pathnames with a single leading /', () => {
      expect(serializeBrowserState({ view: 'foo' }, []).pathname).toEqual('/foo');
      expect(serializeBrowserState({ view: '/foo/' }, []).pathname).toEqual('/%2Ffoo%2F');
    });

    it('should produce urlencoded searches with a single leading ?', () => {
      expect(serializeBrowserState({ view: 'foo', foo: 'foo', bar: 'bar' }, []).search).toBe('?foo=foo&bar=bar');
      expect(serializeBrowserState({ view: 'foo', '?foo': 'foo', bar: 'bar' }, []).search).toBe('?%3Ffoo=foo&bar=bar');
    });

    it('should serialize configured paths', () => {
      expect(serializeBrowserState({ view: 'users', userId: '10' }, [userDetailPathConfig]).pathname).toBe('/users/10');
    });

    it('should not serialize configured path params as part of search', () => {
      expect(serializeBrowserState({ view: 'users', userId: '10' }, [userDetailPathConfig]).search).toBe('?');
    });

    it('should serialize with default path in case of no match', () => {
      expect(serializeBrowserState({ view: 'foo', userId: '10' }, [userDetailPathConfig]).pathname).toBe('/foo');
    });
  });
});
