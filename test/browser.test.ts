import mkBrowser from '../src/browser';
import createMemoryHistory from 'history/createMemoryHistory';

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

  it('onBrowserChange should be called synchornously after a syncToBrowser', () => {
    const onBrowserChangeSpy = jest.fn();
    const { syncToBrowser, onBrowserChange } = mkBrowser(createMemoryHistory());
    onBrowserChange(onBrowserChangeSpy);
    syncToBrowser({ view: 'foo', foo: 'bar' }, false);
    expect(onBrowserChangeSpy.mock.calls.length).toBe(1 + 1);
  });
});
