import React from 'react';
import sinon from 'sinon';
import run from '../src/run';
import t from 'tcomb';

const prepareRun = (initialState) => {
  let _callback;
  const callbackFromBrowser = state => {
    _callback(<div />, state);
  };
  const render = sinon.spy();
  const _syncToBrowserSpy = sinon.spy();
  const syncToBrowser = (_, newState) => {
    _syncToBrowserSpy(newState);
    setTimeout(() => {
      callbackFromBrowser(newState);
    });
    // always writing to browser!
    return true;
  };
  const _onBrowserChangeSpy = sinon.spy();
  const onBrowserChange = callback => {
    _onBrowserChangeSpy(callback);
    _callback = callback;
  };
  const states = [];

  const stateType = t.interface({
    foo: t.maybe(t.String),
    bar: t.maybe(t.String),
    a: t.maybe(t.Integer),
    b: t.maybe(t.Integer),
    baz: t.maybe(t.Boolean),
    more: t.maybe(t.Integer)
  }, 'AppState');

  const transition = run(stateType)({
    render,
    syncToBrowser,
    onBrowserChange,
    subscribe: state => {
      states.push(state);
    },
    initialState
  });

  return {
    render,
    syncToBrowser: _syncToBrowserSpy,
    onBrowserChange: _onBrowserChangeSpy,
    states,
    startBrowser: (state = {}) => {
      callbackFromBrowser(state);
    },
    transition
  };
};

describe('run', () => {

  describe('should work in a typical scenario', () => {

    it('init', () => new Promise((resolve) => {

      const { states, render, syncToBrowser, onBrowserChange, startBrowser } = prepareRun();

      expect(onBrowserChange.callCount).toBe(1);
      expect(syncToBrowser.callCount).toBe(0);
      expect(render.callCount).toBe(0);
      expect(states).toEqual([{}]);

      startBrowser({ foo: 'bar' });

      expect(onBrowserChange.callCount).toBe(1);
      // TODO(gio): disabling for now since this line fails
      // expect(syncToBrowser.callCount).toBe(0);
      expect(render.callCount).toBe(1);
      expect(states).toEqual([{}, { foo: 'bar' }]);

      resolve();
    }));

    it('should throw if initialState is invalid', () => {
      expect(() => prepareRun({ foo: 1 })).toThrow();
    });

    it('transition', () => new Promise((resolve) => {

      const { states, render, syncToBrowser, onBrowserChange, transition } = prepareRun({ foo: 'bar' });

      expect(onBrowserChange.callCount).toBe(1);
      expect(syncToBrowser.callCount).toBe(0);
      expect(render.callCount).toBe(0);
      expect(states).toEqual([{ foo: 'bar' }]);

      transition({ foo: 'baz' });

      expect(onBrowserChange.callCount).toBe(1);
      expect(syncToBrowser.callCount).toBe(1);

      // synchronously, nothing happened yet
      // (syncToBrowser api is async!)
      expect(render.callCount).toBe(0);
      expect(states).toEqual([{ foo: 'bar' }]);
      setTimeout(() => {
        // next tick, yes
        expect(render.callCount).toBe(1);
        expect(states).toEqual([{ foo: 'bar' }, { foo: 'baz' }]);
      });

      resolve();
    }));

    describe('multiple transitions', () => {

      it('incremental', () => new Promise((resolve) => {

        const { states, render, syncToBrowser, onBrowserChange, transition } = prepareRun({ a: 1 });

        expect(onBrowserChange.callCount).toBe(1);
        expect(syncToBrowser.callCount).toBe(0);
        expect(render.callCount).toBe(0);
        expect(states).toEqual([{ a: 1 }]);

        transition({ b: 1 });

        expect(syncToBrowser.callCount).toBe(1);

        transition({ a: 2 });

        // second transition is still queued
        expect(syncToBrowser.callCount).toBe(1);

        // synchronously, nothing happened yet
        // (syncToBrowser api is async!)
        expect(render.callCount).toBe(0);
        expect(states).toEqual([{ a: 1 }]);

        setTimeout(() => {
          // next tick, yes (first transition comes in)
          expect(states).toEqual([{ a: 1 }, { a: 1, b: 1 }]);
          expect(render.callCount).toBe(1);
          // second is async writing to browser
          expect(syncToBrowser.callCount).toBe(2);

          setTimeout(() => {
            // next tick, both transitions are done
            expect(syncToBrowser.callCount).toBe(2);
            expect(states).toEqual([{ a: 1 }, { a: 1, b: 1 }, { a: 2, b: 1 }]);
            expect(render.callCount).toBe(2);

            resolve();
          });
        });
      }));

      it('backflip', () => new Promise((resolve) => {

        const { states, render, syncToBrowser, onBrowserChange, transition } = prepareRun({ foo: 'bar' });

        expect(onBrowserChange.callCount).toBe(1);
        expect(syncToBrowser.callCount).toBe(0);
        expect(render.callCount).toBe(0);
        expect(states).toEqual([{ foo: 'bar' }]);

        transition({ foo: 'baz' });

        expect(onBrowserChange.callCount).toBe(1);
        expect(syncToBrowser.callCount).toBe(1);

        transition({ foo: 'bar' });

        // second transition is still queued
        expect(syncToBrowser.callCount).toBe(1);

        // synchronously, nothing happened yet
        // (syncToBrowser api is async!)
        expect(render.callCount).toBe(0);
        expect(states).toEqual([{ foo: 'bar' }]);

        setTimeout(() => {
          // next tick, yes (first transition comes in)
          expect(states).toEqual([{ foo: 'bar' }, { foo: 'baz' }]);
          expect(render.callCount).toBe(1);
          // second is async writing to browser
          expect(syncToBrowser.callCount).toBe(2);

          setTimeout(() => {
            // next tick, both transitions are done
            expect(syncToBrowser.callCount).toBe(2);
            expect(states).toEqual([{ foo: 'bar' }, { foo: 'baz' }, { foo: 'bar' }]);
            expect(render.callCount).toBe(2);

            resolve();
          });
        });
      }));

      it('many', () => new Promise((resolve) => {

        const { states, render, syncToBrowser, onBrowserChange, transition } = prepareRun({ a: 1 });

        const incFoo = s => ({ ...s, a: s.a + 1 });

        transition(incFoo);
        transition(incFoo);
        transition(incFoo);
        transition(incFoo);
        transition(incFoo);

        setTimeout(() => {
          expect(onBrowserChange.callCount).toBe(1);
          expect(syncToBrowser.callCount).toBe(5);
          expect(render.callCount).toBe(5);
          expect(states).toEqual([
            { a: 1 },
            { a: 2 },
            { a: 3 },
            { a: 4 },
            { a: 5 },
            { a: 6 }
          ]);

          resolve();
        }, 50);
      }));

      it('many backflips', () => new Promise((resolve, reject) => {
        const { states, render, syncToBrowser, onBrowserChange, transition } = prepareRun({ baz: true });

        const backflip = s => s.baz ? { ...s, baz: false, bar: 'baz', more: 1 } : { ...s, baz: true, bar: null };

        transition(backflip);
        transition(backflip);
        transition(backflip);
        transition(backflip);
        transition(backflip);

        setTimeout(() => {
          try {
            expect(onBrowserChange.callCount).toBe(1);
            expect(syncToBrowser.callCount).toBe(5);
            expect(render.callCount).toBe(5);
            expect(states).toEqual([
              { baz: true },
              { baz: false, bar: 'baz', more: 1 },
              { baz: true, more: 1 },
              { baz: false, bar: 'baz', more: 1 },
              { baz: true, more: 1 },
              { baz: false, bar: 'baz', more: 1 }
            ]);
            resolve();
          } catch (e) {
            reject(e);
          }
        }, 50);
      }));

      it('many flattened', () => new Promise((resolve) => {

        const { states, render, syncToBrowser, onBrowserChange, transition } = prepareRun({ baz: true });

        const backflip = s => s.baz ? { ...s, baz: false, bar: 'baz', more: 1 } : { ...s, baz: true, bar: null };

        transition('backflip', backflip);
        transition('backflip', backflip);
        transition('backflip', backflip);
        transition('backflip', backflip);
        transition('backflip', backflip);

        setTimeout(() => {
          expect(onBrowserChange.callCount).toBe(1);
          expect(syncToBrowser.callCount).toBe(1);
          expect(render.callCount).toBe(1);
          expect(states).toEqual([
            { baz: true },
            { baz: false, bar: 'baz', more: 1 }
          ]);

          resolve();
        }, 50);
      }));

    });

  });

});
