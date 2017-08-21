import * as t from 'tcomb';

export type StateT = { [k: string]: any } & { view: string };
export type StateTcombType<S extends StateT> = t.Interface<S>;
