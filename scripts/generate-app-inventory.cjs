/**
 * Regenerates src/data/app-inventory.json — the source for the
 * "Pages & Modals & Drawers (List)" settings page.
 *
 * Walks the route tree for pages, and scans for <DialogTitle>/<SheetTitle>
 * usage to find modals/drawers, grouping everything by feature module.
 * This is a heuristic scan (titles come from JSX text where present, else
 * the component filename) — good enough for an internal audit list, not a
 * hand-maintained spec. Re-run after adding new routes/modals/drawers:
 *
 *   node scripts/generate-app-inventory.cjs
 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src');
const ROUTES_ROOT = path.join(SRC, 'routes/_authenticated/dashboard');

function titleCase(seg) {
  return seg
    .replace(/^\$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function groupLabel(group) {
  return group
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Short, consistently-worded one-liner per item — auto-generated (not hand
// written), so it's necessarily generic, but gives every item some context
// on what it is and where it lives.
function describe(type, group, name, extra) {
  const g = groupLabel(group);
  if (type === 'page') {
    return `Page in the ${g} module for ${name} (navigate to ${extra}).`;
  }
  if (type === 'modal') {
    return `Modal dialog for ${name}, opened from within the ${g} module (defined in ${extra}).`;
  }
  return `Side-panel drawer for ${name}, opened from within the ${g} module (defined in ${extra}).`;
}

function walk(dir, cb) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, cb);
    else cb(full);
  }
}

// ---------- Pages ----------
const pages = [];
walk(ROUTES_ROOT, (file) => {
  if (!file.endsWith('.tsx') && !file.endsWith('.ts')) return;
  const rel = path.relative(ROUTES_ROOT, file).replace(/\\/g, '/');
  const parts = rel.split('/');
  const base = parts[parts.length - 1].replace(/\.(tsx|ts)$/, '');

  // Skip pure layout/config files
  if (base === 'route') return;

  let segs = parts.slice(0, -1);
  if (base !== 'index') segs.push(base);

  const urlSegs = segs.map(s => s.startsWith('$') ? ':' + s.slice(1) : s);
  const url = '/dashboard/' + urlSegs.join('/');

  const group = segs[0] === 'reports' && segs.length > 1
    ? 'reports-' + segs[1]
    : (segs[0] || 'dashboard');

  const lastMeaningful = [...segs].reverse().find(s => !s.startsWith('$')) || segs[segs.length - 1] || 'index';
  const name = titleCase(lastMeaningful) || 'Dashboard';

  pages.push({ type: 'page', group, name, path: url, file: rel, description: describe('page', group, name, url) });
});

// ---------- Modals & Drawers (DialogTitle / SheetTitle) ----------
function deriveGroup(rel) {
  const segs = rel.split('/');
  if (segs[0] === 'features' && segs[1]) return segs[1];
  if (segs[0] === 'routes') {
    const dIdx = segs.indexOf('dashboard');
    if (dIdx >= 0 && segs[dIdx + 1]) {
      return segs[dIdx + 1] === 'reports' && segs[dIdx + 2] ? 'reports-' + segs[dIdx + 2] : segs[dIdx + 1];
    }
  }
  // components/<subfolder>/... -> group by subfolder; components/<file>.tsx (no
  // subfolder) is a shared/standalone component, not a feature module.
  if (segs[0] === 'components') return segs.length > 2 ? segs[1] : 'shared-components';
  return 'other';
}

function scanTitles(root, marker, type) {
  const results = [];
  walk(root, (file) => {
    if (!file.endsWith('.tsx')) return;
    const content = fs.readFileSync(file, 'utf8');
    if (!content.includes(marker)) return;
    const rel = path.relative(SRC, file).replace(/\\/g, '/');

    // crude JSX text extraction: <DialogTitle ...>TEXT</DialogTitle> or with expressions
    const re = new RegExp(`<${marker}[^>]*>([\\s\\S]*?)</${marker}>`, 'g');
    let m;
    let count = 0;
    while ((m = re.exec(content)) !== null) {
      count++;
      let text = m[1]
        .replace(/\{[^}]*\}/g, '') // strip {expr}
        .replace(/<[^>]+>/g, ' ')  // strip nested tags
        .replace(/\s+/g, ' ')
        .trim();
      if (!text) text = null;

      const group = deriveGroup(rel);
      const name = text || titleCase(path.basename(file, '.tsx'));
      results.push({ type, group, name, file: rel, description: describe(type, group, name, rel) });
    }
    // If marker present but regex found nothing (e.g. dynamic title with only {expr}), still record one entry
    if (count === 0) {
      const group = deriveGroup(rel);
      const name = titleCase(path.basename(file, '.tsx'));
      results.push({ type, group, name, file: rel, description: describe(type, group, name, rel) });
    }
  });
  return results;
}

const modals = scanTitles(SRC, 'DialogTitle', 'modal');
const drawers = scanTitles(SRC, 'SheetTitle', 'drawer');

const all = [...pages, ...modals, ...drawers];

// Group into { group: { pages: [], modals: [], drawers: [] } }
const grouped = {};
for (const item of all) {
  if (!grouped[item.group]) grouped[item.group] = { pages: [], modals: [], drawers: [] };
  const bucket = item.type === 'page' ? 'pages' : item.type === 'modal' ? 'modals' : 'drawers';
  grouped[item.group][bucket].push(item);
}

const out = {
  generatedAt: new Date().toISOString(),
  counts: {
    pages: pages.length,
    modals: modals.length,
    drawers: drawers.length,
  },
  groups: grouped,
};

fs.writeFileSync(
  path.join(SRC, 'data/app-inventory.json'),
  JSON.stringify(out, null, 2)
);

console.log('Pages:', pages.length, 'Modals:', modals.length, 'Drawers:', drawers.length);
console.log('Groups:', Object.keys(grouped).length);
