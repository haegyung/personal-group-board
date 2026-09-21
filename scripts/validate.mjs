import { readFileSync, existsSync } from 'node:fs';

const required = [
  'README.md',
  'LICENSE',
  'NOTICE',
  'CONTRIBUTING.md',
  'THIRD_PARTY_NOTICES.md',
  'PUBLIC_RELEASE_CHECKLIST.md',
  'apps-script/Code.gs',
  'apps-script/Index.html',
  'architecture/01-personal-group-architecture.md',
  'architecture/architecture-map.html',
  'architecture/personal-to-group-architecture-anchor.json',
  'architecture/02-local-first-sharing-contract.md',
  'contracts/sync-event.schema.json',
  'db/migrations/002_local_first_sync.sql',
  'apps/web/src/UniversalBoard.tsx',
  'apps/web/src/universal.css',
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
JSON.parse(readFileSync('contracts/sync-event.schema.json', 'utf8'));

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
if (packageJson.license !== 'CC-BY-NC-4.0') throw new Error('Expected CC-BY-NC-4.0 package license metadata.');
if (!readFileSync('LICENSE', 'utf8').includes('Attribution-NonCommercial 4.0')) throw new Error('LICENSE does not declare CC BY-NC 4.0.');

console.log('Validation passed: dashboard scripts, architecture artifacts, visual spec, and CC BY-NC 4.0 notices are readable.');
