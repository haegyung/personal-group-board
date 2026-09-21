import { readFileSync, existsSync } from 'node:fs';

const required = [
  'README.md',
  'apps-script/Code.gs',
  'apps-script/Index.html',
  'architecture/01-personal-group-architecture.md',
  'architecture/architecture-map.html',
  'architecture/personal-to-group-architecture-anchor.json',
];

for (const file of required) {
  if (!existsSync(file)) throw new Error(`Missing required artifact: ${file}`);
}

const dashboard = readFileSync('apps-script/Index.html', 'utf8');
const script = dashboard.match(/<script>([\s\S]*?)<\/script>/)?.[1];
if (!script) throw new Error('Index.html does not contain a script block.');
new Function(script);

new Function(readFileSync('apps-script/Code.gs', 'utf8'));
JSON.parse(readFileSync('architecture/personal-to-group-architecture-anchor.json', 'utf8'));

console.log('Validation passed: dashboard scripts, architecture artifacts, and visual spec are readable.');
