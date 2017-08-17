import { parse as _parse, stringify as _stringify } from '../src/parser';
import * as t from 'tcomb';

type S = {
  view: string;
  numb: number;
  bool: boolean;
  optNumb?: number;
  optBool?: boolean;
};
const ST = t.interface<S>({
  view: t.String,
  numb: t.Number,
  bool: t.Boolean,
  optNumb: t.maybe(t.Number),
  optBool: t.maybe(t.Boolean)
});
const parse = _parse(ST);
const stringify = _stringify(ST);

describe('parse', () => {
  it('should parse numbers', () => {
    expect(parse({ view: 'foo', numb: '4' })).toMatchSnapshot();
  });
  it('should parse optional numbers', () => {
    expect(parse({ view: 'foo', optNumb: '4' })).toMatchSnapshot();
  });
  it('should parse booleans', () => {
    expect(parse({ view: 'foo', bool: 'true' })).toMatchSnapshot();
  });
  it('should parse optional booleans', () => {
    expect(parse({ view: 'foo', optBool: 'false' })).toMatchSnapshot();
  });
});
