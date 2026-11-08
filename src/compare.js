'use strict';

// Standard variables set by shells and CI runners; never flagged as missing.
const BUILTIN_IGNORE = new Set([
  'PATH', 'HOME', 'PWD', 'USER', 'SHELL', 'LANG', 'TERM', 'TZ', 'HOSTNAME', 'CI',
]);

// Returns Map<name, line> for every variable documented in the template.
// Commented-out assignments such as "# OPTIONAL_VAR=" count as documented.
function parseTemplate(content) {
  const keys = new Map();
  content.split(/\r?\n/).forEach((raw, i) => {
    const m = /^#?\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/.exec(raw.trim());
    if (m && !keys.has(m[1])) keys.set(m[1], i + 1);
  });
  return keys;
}

function compare(usages, templateKeys, ignore = new Set()) {
  const used = new Map();
  for (const u of usages) {
    if (ignore.has(u.name) || BUILTIN_IGNORE.has(u.name)) continue;
    if (!used.has(u.name)) used.set(u.name, []);
    used.get(u.name).push(u);
  }

  const missing = [...used.entries()]
    .filter(([name]) => !templateKeys.has(name))
    .map(([name, refs]) => ({ name, refs }));

  const unused = [...templateKeys.keys()]
    .filter((name) => !used.has(name) && !ignore.has(name))
    .map((name) => ({ name, line: templateKeys.get(name) }));

  return { missing, unused };
}

module.exports = { parseTemplate, compare };
