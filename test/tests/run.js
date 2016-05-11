import React from 'react';
import expect from 'expect';
import sinon from 'sinon';
import run from '../../run';

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

  const transition = run({
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
  }
};

describe('run', () => {

  describe('should work in a typical scenario', () => {

    it('init', () => new Promise((resolve, reject) => {

      const { states, render, syncToBrowser, onBrowserChange, startBrowser } = prepareRun();

      expect(onBrowserChange.callCount).toBe(1);
      expect(syncToBrowser.callCount).toBe(0);
      expect(render.callCount).toBe(0);
      expect(states).toEqual([{}]);

      startBrowser({ foo: 'bar' });

      expect(onBrowserChange.callCount).toBe(1);
      expect(syncToBrowser.callCount).toBe(0);
      expect(render.callCount).toBe(1);
      expect(states).toEqual([{}, { foo: 'bar' }]);

      resolve();
    }));

    it('transition', () => new Promise((resolve, reject) => {

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

      it('incremental', () => new Promise((resolve, reject) => {

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

      it('backflip', () => new Promise((resolve, reject) => {

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

      it('many', () => new Promise((resolve, reject) => {

        const { states, render, syncToBrowser, onBrowserChange, transition } = prepareRun({ foo: 1 });

        const incFoo = s => ({ ...s, foo: s.foo + 1 });

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
            { foo: 1 },
            { foo: 2 },
            { foo: 3 },
            { foo: 4 },
            { foo: 5 },
            { foo: 6 }
          ]);

          resolve();
        }, 50);
      }));

      it('many backflips', () => new Promise((resolve, reject) => {

        const { states, render, syncToBrowser, onBrowserChange, transition } = prepareRun({ foo: true });

        const backflip = s => s.foo ? { ...s, foo: false, bar: 'baz', more: 1 } : { ...s, foo: true, bar: null };

        transition(backflip);
        transition(backflip);
        transition(backflip);
        transition(backflip);
        transition(backflip);

        setTimeout(() => {
          expect(onBrowserChange.callCount).toBe(1);
          expect(syncToBrowser.callCount).toBe(5);
          expect(render.callCount).toBe(5);
          expect(states).toEqual([
            { foo: true },
            { foo: false, bar: 'baz', more: 1 },
            { foo: true, more: 1 },
            { foo: false, bar: 'baz', more: 1 },
            { foo: true, more: 1 },
            { foo: false, bar: 'baz', more: 1 },
          ]);

          resolve();
        }, 50);
      }));

      it('many flattened', () => new Promise((resolve, reject) => {

        const { states, render, syncToBrowser, onBrowserChange, transition } = prepareRun({ foo: true });

        const backflip = s => s.foo ? { ...s, foo: false, bar: 'baz', more: 1 } : { ...s, foo: true, bar: null };

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
            { foo: true },
            { foo: false, bar: 'baz', more: 1 }
          ]);

          resolve();
        }, 50);
      }));

    });

  });

});