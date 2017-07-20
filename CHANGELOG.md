#  Change Log



## [v0.6.2](https://github.com/buildo/state/tree/v0.6.2) (2017-07-20)
[Full Changelog](https://github.com/buildo/state/compare/v0.6.1...v0.6.2)

#### Fixes (bugs & defects):

- missing sync to browser after a browser-initiated browser change [#35](https://github.com/buildo/state/issues/35)

## [v0.6.1](https://github.com/buildo/state/tree/v0.6.1) (2017-07-18)
[Full Changelog](https://github.com/buildo/state/compare/v0.6.0...v0.6.1)

#### New features:

- treat `flushTimeoutMSec` as a "problem occuring" more than a "feature" [#33](https://github.com/buildo/state/issues/33)
- try validate state after transition [#25](https://github.com/buildo/state/issues/25)

## [v0.6.0](https://github.com/buildo/state/tree/v0.6.0) (2017-07-14)
[Full Changelog](https://github.com/buildo/state/compare/v0.5.1...v0.6.0)

#### Breaking:

- breaking: enforce omitByF(t.Nil.is) also for changes coming from browser [#31](https://github.com/buildo/state/issues/31)

## [v0.5.1](https://github.com/buildo/state/tree/v0.5.1) (2017-07-07)
[Full Changelog](https://github.com/buildo/state/compare/v0.5.0...v0.5.1)

#### New features:

- bump rxjs dep [#29](https://github.com/buildo/state/issues/29)

## [v0.5.0](https://github.com/buildo/state/tree/v0.5.0) (2017-06-23)
[Full Changelog](https://github.com/buildo/state/compare/v0.4.2...v0.5.0)

#### Breaking:

- [poc] stato new api [#27](https://github.com/buildo/state/issues/27)

#### New features:

- use scriptoni for linting [#23](https://github.com/buildo/state/issues/23)

## [v0.4.2](https://github.com/buildo/state/tree/v0.4.2) (2017-03-14)
[Full Changelog](https://github.com/buildo/state/compare/v0.4.1...v0.4.2)

#### New features:

- update rxjs dep [#21](https://github.com/buildo/state/issues/21)
- backport babel-preset-buildo [#19](https://github.com/buildo/state/issues/19)

## [v0.4.1](https://github.com/buildo/state/tree/v0.4.1) (2017-02-15)
[Full Changelog](https://github.com/buildo/state/compare/v0.4.0...v0.4.1)

#### New features:

- remove `compomentWillMount` in favor of state initializer + `componentDidMount` [#17](https://github.com/buildo/state/issues/17)

## [v0.4.0](https://github.com/buildo/state/tree/v0.4.0) (2017-02-08)
[Full Changelog](https://github.com/buildo/state/compare/v0.3.1...v0.4.0)

#### Breaking:

- add a way to decide what should be serialized to the browser [#15](https://github.com/buildo/state/issues/15)

## [v0.3.1](https://github.com/buildo/state/tree/v0.3.1) (2017-01-31)
[Full Changelog](https://github.com/buildo/state/compare/v0.3.0...v0.3.1)

#### New features:

- explicity declare rxjs as a dependency [#13](https://github.com/buildo/state/issues/13)

## [v0.3.0](https://github.com/buildo/state/tree/v0.3.0) (2017-01-23)
[Full Changelog](https://github.com/buildo/state/compare/v0.2.0...v0.3.0)

#### Breaking:

- build & publish to npm [#11](https://github.com/buildo/state/issues/11)

## [v0.2.0](https://github.com/buildo/state/tree/v0.2.0) (2016-12-08)
[Full Changelog](https://github.com/buildo/state/compare/v0.1.1...v0.2.0)

#### Breaking:

- run `transitionReducer` also when merging a user-init change [#9](https://github.com/buildo/state/issues/9)

## [v0.1.1](https://github.com/buildo/state/tree/v0.1.1) (2016-12-08)
[Full Changelog](https://github.com/buildo/state/compare/v0.1.0...v0.1.1)

## [v0.1.0](https://github.com/buildo/state/tree/v0.1.0) (2016-07-27)


#### Fixes (bugs & defects):

- [transition] multiple sync transitions and pending state [#2](https://github.com/buildo/state/issues/2)