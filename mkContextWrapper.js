import React from 'react';

export default function mkContextWrapper(ctx, ctxTypes) {
  return class ContextWrapper extends React.Component {
    static childContextTypes = ctxTypes

    getChildContext() {
      return ctx;
    }

    render() {
      return this.props.children();
    }
  };
}
