import { tester, spawner } from './helpers/index.js'

await tester('classic plan must be positive',
  function (t) {
    t.plan(-1)
    t.pass()
  },
  `
  TAP version 13

  # classic plan must be positive
      not ok 1 - plan takes a positive whole number only
        ---
        operator: plan
        at: 
          line: 4
          column: 7
          file: /[eval]
        stack: |
          _fn ([eval]:4:7)
          Test._run (./index.js:529:13)
          processTicksAndRejections (node:internal/process/task_queues:96:5)
        ...
      ok 2 - passed
  not ok 1 - classic plan must be positive # time = 4.064704ms

  1..1
  # tests = 0/1 pass
  # asserts = 1/2 pass
  # time = 6.888768ms

  # not ok
  `,
  { exitCode: 1 }
)

await spawner(
  function (test) {
    const t = test('inverted plan must be positive')
    t.plan(-1)
    t.pass()
    t.end()
  },
  `
  TAP version 13

  # inverted plan must be positive
      not ok 1 - plan takes a positive whole number only
        ---
        operator: plan
        at: 
          line: 5
          column: 7
          file: /[eval]
        stack: |
          _fn ([eval]:5:7)
          [eval]:10:1
          Script.runInThisContext (node:vm:129:12)
          Object.runInThisContext (node:vm:305:38)
          node:internal/process/execution:76:19
          [eval]-wrapper:6:22
          evalScript (node:internal/process/execution:75:60)
          node:internal/main/eval_string:27:3
        ...
      ok 2 - passed
  not ok 1 - inverted plan must be positive # time = 4.090291ms

  1..1
  # tests = 0/1 pass
  # asserts = 1/2 pass
  # time = 6.495782ms

  # not ok
  `,
  { exitCode: 1 }
)