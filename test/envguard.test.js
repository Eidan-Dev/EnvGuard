'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { scanContent } = require('../src/scan');
const { parseTemplate, compare } = require('../src/compare');

test('detects env reads in JS/TS, Python, Go and Rust', () => {
  const js = 'const key = process.env.STRIPE_KEY;';
  const py = 'db = os.environ["DB_URL"]\nport = os.getenv("PORT")';
  const go = 'token := os.Getenv("REDIS_URL")';
  const rs = 'let t = std::env::var("API_TOKEN").unwrap();';

  assert.deepEqual(scanContent(js).map((u) => u.name), ['STRIPE_KEY']);
  assert.deepEqual(scanContent(py).map((u) => u.name), ['DB_URL', 'PORT']);
  assert.deepEqual(scanContent(go).map((u) => u.name), ['REDIS_URL']);
  assert.deepEqual(scanContent(rs).map((u) => u.name), ['API_TOKEN']);
});

test('reports the correct line number', () => {
  const src = 'a\nb\nprocess.env.THIRD';
  assert.equal(scanContent(src, 'x.js')[0].line, 3);
});

test('ignores reads inside comments', () => {
  const src = '// process.env.OLD_VAR\n# os.getenv("OLD_PY")\nreal();';
  assert.deepEqual(scanContent(src), []);
});

test('parseTemplate reads active and commented assignments', () => {
  const tpl = '# comment\nDATABASE_URL=\n# OPTIONAL_VAR=\nexport API_KEY=abc';
  const keys = parseTemplate(tpl);
  assert.deepEqual([...keys.keys()], ['DATABASE_URL', 'OPTIONAL_VAR', 'API_KEY']);
});

test('compare finds missing and unused variables', () => {
  const usages = [
    { name: 'DATABASE_URL', file: 'a.ts', line: 1 },
    { name: 'STRIPE_SECRET', file: 'b.ts', line: 4 },
    { name: 'NODE_ENV', file: 'b.ts', line: 5 },
  ];
  const keys = parseTemplate('DATABASE_URL=\nLEGACY_URL=');
  const { missing, unused } = compare(usages, keys);

  assert.deepEqual(missing.map((m) => m.name), ['STRIPE_SECRET', 'NODE_ENV']);
  assert.deepEqual(unused.map((u) => u.name), ['LEGACY_URL']);
});

test('compare honours the ignore list', () => {
  const usages = [{ name: 'CUSTOM', file: 'a.ts', line: 1 }];
  const { missing } = compare(usages, new Map(), new Set(['CUSTOM']));
  assert.equal(missing.length, 0);
});
