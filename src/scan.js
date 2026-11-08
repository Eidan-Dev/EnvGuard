'use strict';

const fs = require('fs');
const path = require('path');

const IGNORED_DIRS = new Set([
  'node_modules', 'dist', 'build', 'target', 'vendor', 'venv', '.venv',
  '__pycache__', 'coverage', '.next',
]);

const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.py', '.go', '.rs']);

const NAME = '([A-Z_][A-Z0-9_]*)';

// One regex per access pattern across the supported languages.
const PATTERNS = [
  new RegExp(`process\\.env\\.${NAME}`, 'g'),                           // JS / TS
  new RegExp(`process\\.env\\[\\s*['"]${NAME}['"]\\s*\\]`, 'g'),        // JS / TS bracket
  new RegExp(`import\\.meta\\.env\\.${NAME}`, 'g'),                     // Vite
  new RegExp(`os\\.environ\\[\\s*['"]${NAME}['"]\\s*\\]`, 'g'),         // Python
  new RegExp(`os\\.(?:environ\\.get|getenv)\\(\\s*['"]${NAME}['"]`, 'g'), // Python
  new RegExp(`os\\.(?:Getenv|LookupEnv)\\(\\s*"${NAME}"`, 'g'),        // Go
  new RegExp(`(?:std::)?env::var(?:_os)?\\(\\s*"${NAME}"`, 'g'),       // Rust
];

function isComment(line) {
  const t = line.trim();
  return t.startsWith('//') || t.startsWith('#') || t.startsWith('/*') || t.startsWith('*');
}

function scanContent(content, file = '<input>') {
  const found = [];
  content.split(/\r?\n/).forEach((line, i) => {
    if (isComment(line)) return;
    for (const re of PATTERNS) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(line)) !== null) {
        found.push({ name: m[1], file, line: i + 1 });
      }
    }
  });
  return found;
}

function* walk(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name) && !entry.name.startsWith('.')) yield* walk(full);
    } else if (entry.isFile() && SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      yield full;
    }
  }
}

function scanDir(root) {
  const results = [];
  for (const file of walk(root)) {
    const content = fs.readFileSync(file, 'utf8');
    results.push(...scanContent(content, path.relative(root, file)));
  }
  return results;
}

module.exports = { scanContent, scanDir };
