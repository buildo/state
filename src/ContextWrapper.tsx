import * as React from 'react';
import * as PropTypes from 'prop-types';

export type ProvideContext = { [k: string]: any };
export type ProvideContextTypes = PropTypes.ValidationMap<any>;

export default function mkContextWrapper(ctx: ProvideContext, ctxTypes: ProvideContextTypes): React.ComponentType<{ children: () => JSX.Element }> {
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
