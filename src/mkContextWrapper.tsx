import * as React from 'react';

export default function mkContextWrapper(ctx: {}, ctxTypes: {}): React.ComponentType<{ children: () => JSX.Element }> {
  return class ContextWrapper extends React.Component<{ children: () => JSX.Element }> {
    static childContextTypes = ctxTypes

    getChildContext() {
      return ctx;
    }

    render() {
      return this.props.children();
    }
  }
}
