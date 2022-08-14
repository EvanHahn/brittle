# brittle

TAP test runner built with few dependencies for Node.js, Browsers and React Native.

```
npm i brittle@next
```

## Usage
```javascript
import test from 'brittle'

test('basic', function (t) {
  t.is(typeof Date.now(), 'number')
  t.not(typeof Date.now(), 'string')
  t.ok(Date.now() > 0)
  t.absent(null)
})

test('deep equal', function (t) {
  t.alike({ a: 1 }, { a: 1 })
  t.unlike({ a: 1 }, { a: 2 })
})

test('promises', async function (t) {
  await new Promise(r => { setTimeout(r, 250) })
  t.pass()
})

test('plans', function (t) {
  t.plan(1)
  t.pass()
})

test('classic subtest', function (t) {
  t.test('subtest', function (sub) {
    sub.plan(1)
    sub.pass()
  })
})

test('inverted subtest', function (t) {
  const sub = t.test('subtest')
  sub.plan(1)
  sub.pass()
})

test('assert throws', function (t) {
  t.execution(() => 'should not throw')
  t.exception(() => { throw Error('expected to throw') })
})

test('assert rejections', async function (t) {
  await t.execution(async () => 'should not reject')
  await t.exception(async () => { throw Error('expected to reject') })
})

const a = test('inverted test without plan needs end()')
a.pass()
a.end()

const b = test('inverted test with plan')
b.plan(1)
b.pass()

const c = test('inverted tests can be awaited')
c.plan(1)
setTimeout(() => c.pass(), 250)
await c
```

## API

```js
import { test, solo, skip, todo, configure } from 'brittle'
```

#### `test([name], [options], callback)`

Create a classic test with an optional `name`.

#### Available `options` for any test creation:
 * `timeout` (`30000`) - milliseconds to wait before ending a stalling test.
 * `solo` (`false`) - Skip all other tests except the `solo()` ones.
 * `skip` (`false`) - skip this test, alternatively use the `skip()` function.
 * `todo` (`false`) - mark this test as todo and skip it, alternatively use the `todo()` function.

The `callback` function (can be async) receives an object called `assert`.\
`assert` (or `t`) provides the assertions and utilities interface.

```js
import test from 'brittle'

test('basic', function (t) {
  t.ok(true)
})
```

Test files can be executed directly with `node`, as they're normal Node.js programs.

The `test` method is conveniently both the default export and named exported method:

```js
import { test } from 'brittle'
```

Classic tests will run sequentially, buffering pending tests until any prior test catches up.

Any test function returns a promise so you can optionally await for its result:

```js
const isOk = await test('basic', function (t) {
  t.ok(true)
})
```

#### `test([name], [options]) => assert`

Create an inverted test with an optional `name`.

All `options` for inverted tests are [listed here](#available-options-for-any-test-creation).

An object called `assert` (or `t`) is returned, the same as the classic test.

This time it's also a promise, it can be awaited and it resolves at test completion.

```js
import test from 'brittle'

const t = test('basic')

t.plan(1)

setTimeout(() => {
  t.ok(true)
}, 1000)

await t // Won't proceed past here until plan is fulfilled
```

For inverted tests without a plan, the `end` method must be called:

```js
const t = test('basic')

setTimeout(() => {
  t.ok(true)
  t.end()
}, 1000)

await t
```

The `end()` method can be called inline, for inverted tests without a plan:

```js
const t = test('basic')
t.ok(true)
t.end()
```

Control flow of inverted is entirely dependent on where its `assert` is awaited.\
The following executes one test after another:

```js
const a = test('first test')
const b = test('second test')
a.plan(1)
b.plan(1)
a.pass()
await a
b.pass()
await b
```

Awaiting the promise gives you its result:

```js
const t = test('first test')
t.plan(1)
t.pass()
const isOk = await t
```

#### `assert.test([name], [options], callback)`
#### `assert.test([name], [options]) => assert`

A subtest can be created by calling `test` on an `assert` (or `t`) object.\
This will provide a new sub-assert object.

All `options` for subtests are [listed here](#available-options-for-any-test-creation).

Using this in inverted style can be very useful for flow control within a test:

```js
test('basic', async function (t) {
  const a = t.test('sub test')
  const b = t.test('other sub test')

  a.plan(1)
  b.plan(1)

  setTimeout(() => a.ok(true), Math.random() * 1000)
  setTimeout(() => b.ok(true), Math.random() * 1000)
  
  // Won't proceed past here until both a and b plans are fulfilled
  await a
  await b

  t.ok('cool')
})
```

Subtest test options can be set by passing an object to the `test` function:

```js
test('parent', { timeout: 1000 }, function (t) {
  t.test('basic using parent config', async function (t) {
    await new Promise(r => setTimeout(r, 500))
    t.ok(true)
  })

  t.test('another basic using parent config', function (t) {
    t.ok(true)
  })
})
```

You can also await for its result as well:

```js
test('basic', async function (t) {
  t.plan(1)
  t.pass()
  const isOk = await t
  console.log(isOk)
})
```

#### `solo([name], [options], callback)`
#### `solo([name], [options]) => assert`

Filter out other tests by using the `solo` method:

```js
import { test, solo } from 'brittle'

test('this test is skipped', function (t) {
  t.ok(true)
})

solo('some test', function (t) {
  t.ok(true)
})

solo('another test', function (t) {
  t.ok(true)
})
```

If a `solo` function is used, `test` functions will not execute, only `solo` functions.\
Note how there can be more than one `solo` tests.

If `solo` is used in a future tick (for example, in a `setTimeout` callback),\
after `test` has already been used those tests won't be filtered.

A few ways to enable `solo` functions:
- You can call `solo()` without callback underneath the imports.
- Use `configure({ solo: true })` before any tests.
- Using the `--solo` flag with the `brittle` test runner.

It can also be used as an inverted test:

```js
const t = test.solo('inverted some test')
t.ok(true)
t.end()
```

#### `skip([name], [options], callback)`

Skip a test: 

```js
import { test, skip } from 'brittle'

skip('this test is skipped', function (t) {
  t.ok(true)
})

test('middle test', function (t) {
  t.ok(true)
})

test.skip('another skipped test', function (t) {
  t.ok(true)
})
```

Only the `middle test` will be executed.

#### `configure([options])`

The `configure` function can be used to set options for all tests (including child tests).\
It must be executed before any tests.

#### Options

 * `timeout` (`30000`) - milliseconds to wait before ending a stalling test
 * `bail` (`false`) - exit the process on first test failure
 * `solo` (`false`) - Skip all other tests except the `solo()` ones.

```js
import { configure } from 'brittle'

configure({ timeout: 15000 }) // All tests will have a 15 seconds timeout
```

### Assertions

#### `is(actual, expected, [message])`

Compare `actual` to `expected` with `===`

#### `not(actual, expected, [message])`

Compare `actual` to `expected` with `!==`

#### `alike(actual, expected, [message])`

Object comparison, comparing all primitives on the 
`actual` object to those on the `expected` object
using `===`.

#### `unlike(actual, expected, [message])`

Object comparison, comparing all primitives on the 
`actual` object to those on the `expected` object
using `!==`.

#### `ok(value, [message])`

Checks that `value` is truthy: `!!value === true`

#### `absent(value, [message])`

Checks that `value` is falsy: `!!value === false`

#### `pass([message])`

Asserts success. Useful for explicitly confirming
that a function was called, or that behavior is 
as expected.

#### `fail([message])`

Asserts failure. Useful for explicitly checking
that a function should not be called.

#### `exception(Promise|function|async function, [error], [message])`

Verify that a function throws, or a promise rejects.

```js
exception(() => { throw Error('an err') }, /an err/)
await exception(async () => { throw Error('an err') }, /an err/)
await exception(Promise.reject(Error('an err')), /an err/)
```

If the error is an instance of any of the following native error constructors,
then this will still result in failure since native errors often tend to be unintentational.

* `SyntaxError`
* `ReferenceError`
* `TypeError`
* `EvalError`
* `RangeError`

#### `exception.all(Promise|function|async function, [error], [message])`

Verify that a function throws, or a promise rejects, including native errors.

```js
exception.all(() => { throw Error('an err') }, /an err/)
await exception.all(async () => { throw Error('an err') }, /an err/)
await exception.all(Promise.reject(new SyntaxError('native error')), /native error/)
```

The `exception.all` method is an escape-hatch so it can be used with the
normally filtered native errors.

#### `execution(Promise|function|async function, [message])`

Assert that a function executes instead of throwing or that a promise resolves instead of rejecting.

```js
execution(() => { })
await execution(async () => { })
await execution(Promise.resolve('cool'))
```

#### `is.coercively(actual, expected, [message])`

Compare `actual` to `expected` with `==`.

#### `not.coercively(actual, expected, [message])`

Compare `actual` to `expected` with `!=`.

#### `alike.coercively(actual, expected, [message])`

Object comparison, comparing all primitives on the 
`actual` object to those on the `expected` object
using `==`.

#### `unlike.coercively(actual, expected, [message])`

Object comparison, comparing all primitives on the 
`actual` object to those on the `expected` object
using `!=`.

### Utilities

#### `plan(n)`

Constrain a test to an explicit amount of assertions.

#### `teardown(function|async function, [options])`

#### Available `options` for teardowns:
 * `order` (`0`) - set the ascending position priority for a teardown to be executed.

The function passed to `teardown` is called right after a test ends:

```js
test('basic', function (t) {
  const timeoutId = setTimeout(() => {}, 1000)

  t.teardown(async function () {
    clearTimeout(timeoutId)
    await doMoreCleanUp()
  })

  t.ok('cool')
})
```

If `teardown` is called multiple times in a test, every function passed will be called after the test ends:

```js
test('basic', async function (t) {
  t.teardown(doSomeCleanUp)

  const timeoutId = setTimeout(() => {}, 1000)
  t.teardown(() => { clearTimeout(timeoutId) })

  t.ok('again, cool')
})
```

Set `order: -Infinity` to always be in first place, and vice versa with `order: Infinity`.\
If two teardowns have the same `order` they are ordered per time of invocation within that order group.

```js
test('teardown order', function (t) {
  t.teardown(async function () {
    await new Promise(r => setTimeout(r, 200))
    console.log('teardown B')
  })

  t.teardown(async function () {
    await new Promise(r => setTimeout(r, 200))
    console.log('teardown A')
  }, { order: -1 })

  t.teardown(async function () {
    await new Promise(r => setTimeout(r, 200))
    console.log('teardown C')
  }, { order: 1 })

  t.pass()
})
```

The `A` teardown is executed first, then `B`, and finally `C` due to the `order` option.

#### `timeout(ms)`

Fail the test after a given timeout.  

#### `comment(message)`

Inject a TAP comment into the output.

#### `end()`

Force end a test.\
`end` is determined by `assert` resolution or when a containing async function completes.\
In case of inverted tests, they're required to be explicitly called.

## Runner

### Default timeout

The default timeout is 30 seconds.

### Example of `package.json` with `test` script

The following would run all `.js` files in the test folder:

```json
{
  "name": "my-app",
  "version": "1.0.0",
  "scripts": {
    "test": "brittle test/*.js"
  },
  "devDependencies": {
    "brittle": "^3.0.0-alpha.3"
  }
}
```

## CLI

```sh
npm install -g brittle@next
```

```shell
brittle [flags] [<files>]

Flags:
  -cov, --coverage              Turn on coverage
  --bail                        Bail out on first assert failure
  --solo                        Engage solo mode
  -r, --runner <out> <targets>  Generates an out file that contains all target tests
```

Note globbing is supported:
```sh
brittle --coverage path/to/test/*.js
```

Auto generate a single file containing "all tests":
```shell
brittle -r test/all.js test/*.js

node test/all.js
```

You can use an environment variable to also set flags:
```shell
BRITTLE="--coverage --bail" brittle test.js
```

Force disable coverage with an environment variable:
```shell
BRITTLE_COVERAGE=false brittle test.js
```

## License
MIT
