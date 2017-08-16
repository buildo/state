import { syncToBrowser, onBrowserChange } from '../src/browser';

describe('browser', () => {
  it('syncToBrowser should push a new history item if push is true', () => {
    const historyLength = window.history.length;
    syncToBrowser({ view: 'foo', foo: 'bar' }, true);
    expect(window.location.pathname).toBe('/foo');
    expect(window.location.search).toBe('?foo=bar');
    expect(window.history.length).toBe(historyLength + 1);
  });

  it('syncToBrowser should replace the current history item if push is false', () => {
    const historyLength = window.history.length;
    syncToBrowser({ view: 'foo', foo: 'bar' }, false);
    expect(window.location.pathname).toBe('/foo');
    expect(window.location.search).toBe('?foo=bar');
    expect(window.history.length).toBe(historyLength + 0);
  });

  it('onBrowserChange should be called asynchornously after a syncToBrowser', () =>
    new Promise((resolve, reject) => {
      const onBrowserChangeSpy = jest.fn();
      onBrowserChange(onBrowserChangeSpy);
      syncToBrowser({ view: 'foo', foo: 'bar' }, false);
      setTimeout(() => {
        try {
          expect(onBrowserChangeSpy.mock.calls.length).toBe(1 + 1);
          resolve();
        } catch (e) {
          reject(e);
        }
      }, 10);
    }));
});
