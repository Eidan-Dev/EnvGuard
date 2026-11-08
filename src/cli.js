'use strict';

const fs = require('fs');
const path = require('path');
const { scanDir } = require('./scan');
const { parseTemplate, compare } = require('./compare');

const HELP = `envguard - catch env var drift before it breaks production

Usage: envguard [root] [options]

Options:
  --template <file>   template file, relative to root (default: .env.example)
  --strict            also fail on variables documented but never read
  --format <type>     text | json | github (default: text)
  --ignore <A,B>      comma-separated variables to skip
  -h, --help          show this help
  -v, --version       show version

Exit codes: 0 no drift, 1 drift found, 2 usage or runtime error`;

function parseArgs(argv) {
  const opts = {
    root: process.cwd(),
    template: '.env.example',
    strict: false,
    format: 'text',
    ignore: [],
  };
  const value = (i) => {
    if (argv[i + 1] === undefined) throw new Error(`${argv[i]} expects a value`);
    return argv[i + 1];
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--strict') opts.strict = true;
    else if (a === '--template') { opts.template = value(i); i++; }
    else if (a === '--format') { opts.format = value(i); i++; }
    else if (a === '--ignore') {
      opts.ignore = value(i).split(',').map((s) => s.trim()).filter(Boolean);
      i++;
    }
    else if (a === '-h' || a === '--help') opts.help = true;
    else if (a === '-v' || a === '--version') opts.version = true;
    else if (!a.startsWith('-')) opts.root = path.resolve(a);
    else throw new Error(`unknown option: ${a}`);
  }
  return opts;
}

function report(opts, result, log) {
  const { missing, unused } = result;

  if (opts.format === 'json') {
    log(JSON.stringify(result, null, 2));
    return;
  }

  if (opts.format === 'github') {
    for (const m of missing) {
      for (const r of m.refs) {
        log(`::error file=${r.file},line=${r.line}::${m.name} is read here but missing from ${opts.template}`);
      }
    }
    for (const u of unused) {
      log(`::warning file=${opts.template},line=${u.line}::${u.name} is documented but never read`);
    }
    return;
  }

  const total = missing.length + unused.length;
  if (total === 0) {
    log('envguard: no issues found ✔');
    return;
  }

  log(`envguard: ${total} issue${total > 1 ? 's' : ''} found\n`);
  for (const m of missing) {
    log(`  ✖ ${m.name}`);
    for (const r of m.refs) log(`    used in ${r.file}:${r.line}`);
    log(`    missing from ${opts.template}\n`);
  }
  for (const u of unused) {
    log(`  ⚠ ${u.name}`);
    log(`    documented in ${opts.template}:${u.line}`);
    log('    never read in the codebase\n');
  }
}

function run(argv, log = console.log, err = console.error) {
  const opts = parseArgs(argv);

  if (opts.help) { log(HELP); return 0; }
  if (opts.version) { log(require('../package.json').version); return 0; }
  if (!['text', 'json', 'github'].includes(opts.format)) {
    throw new Error(`invalid format "${opts.format}" (use text, json or github)`);
  }

  const templatePath = path.resolve(opts.root, opts.template);
  if (!fs.existsSync(templatePath)) {
    err(`envguard: template not found: ${opts.template}`);
    return 2;
  }

  const templateKeys = parseTemplate(fs.readFileSync(templatePath, 'utf8'));
  const usages = scanDir(opts.root);
  const result = compare(usages, templateKeys, new Set(opts.ignore));

  report(opts, result, log);

  const failing = result.missing.length > 0 || (opts.strict && result.unused.length > 0);
  return failing ? 1 : 0;
}

module.exports = { run, parseArgs };
