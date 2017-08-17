import mkBrowser from '../src/browser';
import createMemoryHistory from 'history/createMemoryHistory';

describe('browser', () => {
  it('syncToBrowser should push a new history item if push is true', () => {
    const history = createMemoryHistory();
    const { syncToBrowser } = mkBrowser(history);
    syncToBrowser({ view: 'foo', foo: 'bar' }, true);
    expect(history.location.pathname).toBe('/foo');
    expect(history.location.search).toBe('?foo=bar');
    expect(history.length).toBe(2);
  });

  it('syncToBrowser should replace the current history item if push is false', () => {
    const history = createMemoryHistory();
    const { syncToBrowser } = mkBrowser(history);
    syncToBrowser({ view: 'foo', foo: 'bar' }, false);
    expect(history.location.pathname).toBe('/foo');
    expect(history.location.search).toBe('?foo=bar');
    expect(history.length).toBe(1);
  });

  it('onBrowserChange should be called synchornously after a syncToBrowser', () => {
    const onBrowserChangeSpy = jest.fn();
    const { syncToBrowser, onBrowserChange } = mkBrowser(createMemoryHistory());
    onBrowserChange(onBrowserChangeSpy);
    syncToBrowser({ view: 'foo', foo: 'bar' }, false);
    expect(onBrowserChangeSpy.mock.calls.length).toBe(1 + 1);
  });
});
