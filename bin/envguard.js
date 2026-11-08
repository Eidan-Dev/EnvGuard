#!/usr/bin/env node
'use strict';

const { run } = require('../src/cli');

try {
  process.exitCode = run(process.argv.slice(2));
} catch (err) {
  console.error(`envguard: ${err.message}`);
  process.exitCode = 2;
}
