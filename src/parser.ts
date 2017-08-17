import * as t from 'tcomb';
import { StateT, StateTcombType } from './StateT';
import { BrowserState } from './browser';
import mapValues = require('lodash/mapValues');
import identity = require('lodash/identity');

type TypeName = 'boolean' | 'number' | 'default';

function getIrreducibleTypeName(type: t.Irreducible<any>): TypeName {
  switch (type.meta.name) {
    case 'Number':
      return 'number';
    case 'Boolean':
      return 'boolean';
    default:
      return 'default';
  }
}

function getTypeName(type: t.Type<any>): TypeName {
  if (type.meta.kind === 'irreducible') {
    return getIrreducibleTypeName(type as t.Irreducible<any>);
  } else if (type.meta.kind === 'maybe') {
    const mType = (type as t.Maybe<any>).meta.type as t.Type<any>;
    return mType.meta.kind === 'irreducible' ? getIrreducibleTypeName(mType as t.Irreducible<any>) : 'default';
  }
  return 'default';
}

function parseBoolean(value: string): boolean | null {
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  return null;
}

function parseNumber(value: string): number | null {
  const parsedValue = parseFloat(value);
  if (String(parsedValue) === value) {
    return parsedValue;
  }
  return null;
}

const parsers: { [k in TypeName]: (v: string) => any } = {
  boolean: parseBoolean,
  number: parseNumber,
  default: identity
};

export type ParsedBrowserState = BrowserState & { [k: string]: any };

export function stringify<S extends StateT>(_stateType: StateTcombType<S>) {
  return (params: ParsedBrowserState): BrowserState => {
    return mapValues<any, string>(params, String) as BrowserState;
  };
}

export function parse<S extends StateT>(stateType: StateTcombType<S>) {
  return (params: BrowserState): ParsedBrowserState => {
    return Object.keys(params).reduce((acc, paramName) => {
      const paramType = stateType.meta.props[paramName] as t.Type<any>;
      if (!paramType) {
        return acc;
      }
      const paramTypeName = getTypeName(paramType);
      const param = params[paramName];
      const parse = parsers[paramTypeName];
      return {
        ...acc,
        [paramName]: parse(param)
      };
    }, {}) as ParsedBrowserState;
  };
}
