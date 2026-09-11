// Verificación estática de CU-0.1: sin dependencias, red, escritura ni motor Docker.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const baseCommit = 'eff9bdc240ccae6a75a96ad1e6ae957e07df5b1f';
const masterPath = 'docs/puds/use-cases/README.md';
const benchmarkPath = 'docs/benchmarks/external-services.md';
const normalize = (text) => text.replace(/\r\n/g, '\n');
const read = (file) => normalize(readFileSync(path.join(root, file), 'utf8'));
const git = (...args) => normalize(execFileSync('git', args, {
  cwd: root, encoding: 'utf8', windowsHide: true,
}));
const original = (file) => git('show', `${baseCommit}:${file}`);
let passed = 0;
const check = (name, action) => {
  action();
  passed += 1;
  console.log(`OK ${passed}: ${name}`);
};

// No leer archivos de entorno real ni directorios de dependencias/internos.
const files = [];
function collect(directory = '') {
  for (const entry of readdirSync(path.join(root, directory), { withFileTypes: true })) {
    if (['.git', 'node_modules', 'secrets', 'backups'].includes(entry.name)) continue;
    if (/\.env(?:\.|$)/.test(entry.name) && entry.name !== '.env.example') continue;
    const relative = path.posix.join(directory, entry.name);
    assert.ok(!entry.isSymbolicLink(), `Enlace simbólico no previsto: ${relative}`);
    if (entry.isDirectory()) collect(relative);
    else if (entry.isFile()) files.push(relative);
  }
}
collect();

check('Rama esperada', () => {
  assert.equal(git('branch', '--show-current').trim(), 'feature/cu-0-inicializar-base');
});

check('Archivos requeridos y ausencia de aplicaciones, paquetes y lockfiles', () => {
  for (const file of [
    'README.md', 'package.json', '.node-version', '.nvmrc', '.npmrc', '.gitignore',
    '.gitattributes', '.editorconfig', '.env.example', 'compose.yaml',
    'tsconfig.base.json', 'opencode.json', 'docs/PROJECT_CONTEXT.md', 'docs/STATUS.md',
    masterPath, benchmarkPath, 'docs/puds/use-cases/CU-0-inicializar-base.md',
    'docs/architecture/README.md', 'docs/development/README.md',
    'docs/decisions/ADR-0001-initial-technical-boundaries.md',
  ]) assert.ok(files.includes(file), `Falta ${file}`);
  for (const directory of ['apps', 'packages', 'node_modules']) {
    assert.ok(!existsSync(path.join(root, directory)), `Prematuro: ${directory}`);
  }
  assert.ok(!files.some((file) => /(?:^|\/)(?:package-lock\.json|npm-shrinkwrap\.json|yarn\.lock|pnpm-lock\.yaml)$/.test(file)));
  assert.deepEqual(files.filter((file) => path.posix.basename(file) === 'package.json'), ['package.json']);
});

check('Todos los JSON parseables y configuración npm/versiones coherente', () => {
  const jsonFiles = files.filter((file) => file.endsWith('.json'));
  for (const file of jsonFiles) JSON.parse(read(file));
  assert.equal(jsonFiles.length, 3);
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.name, 'primer-parcial');
  assert.equal(pkg.private, true);
  assert.deepEqual(pkg.workspaces, ['apps/*', 'packages/*']);
  assert.equal(pkg.engines.node, '>=24.0.0 <25.0.0');
  assert.equal(pkg.engines.npm, '>=11.0.0 <12.0.0');
  assert.equal(pkg.packageManager, 'npm@11.6.2');
  assert.equal(pkg.dependencies, undefined);
  assert.equal(pkg.devDependencies, undefined);
  assert.deepEqual(pkg.scripts, { 'check:cu-0.1': 'node docs/development/validate-cu-0.1.mjs' });
  assert.equal(read('.node-version').trim(), '24.11.1');
  assert.equal(read('.nvmrc'), read('.node-version'));
  assert.match(read('.npmrc'), /^engine-strict=true$/m);
  assert.doesNotMatch(read('.npmrc'), /^package-lock=false$/m);
});

check('Markdown: cercas balanceadas, texto limpio y enlaces locales existentes', () => {
  for (const file of files.filter((candidate) => candidate.endsWith('.md'))) {
    const text = read(file);
    assert.ok(text.endsWith('\n'), `Falta newline: ${file}`);
    assert.doesNotMatch(text, /[\t ]+$/m, `Whitespace final: ${file}`);
    assert.doesNotMatch(text, /^(?:<<<<<<<|=======|>>>>>>>) /m, `Conflicto: ${file}`);
    let fenced = false;
    for (const line of text.split('\n')) {
      if (/^```/.test(line)) { fenced = !fenced; continue; }
      if (fenced) continue;
      for (const [, target] of line.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
        if (/^(?:https?:|mailto:|#)/.test(target)) continue;
        const fileTarget = decodeURIComponent(target.split('#')[0]);
        const resolved = path.resolve(root, path.dirname(file), fileTarget);
        const relative = path.relative(root, resolved);
        assert.ok(!relative.startsWith('..') && !path.isAbsolute(relative), `Enlace externo: ${file}`);
        assert.ok(existsSync(resolved), `Enlace roto: ${file} -> ${target}`);
      }
    }
    assert.equal(fenced, false, `Cerca sin cerrar: ${file}`);
  }
  for (const file of files) {
    assert.doesNotMatch(read(file), /[\t ]+$/m, `Whitespace final: ${file}`);
  }
});

check('Plan activo: exactamente 12 CUs, 3 ciclos y máximo 3 incrementos por CU', () => {
  const master = read(masterPath);
  const ids = [...master.matchAll(/^## CU-(\d+) — /gm)].map((match) => Number(match[1]));
  assert.deepEqual(ids, Array.from({ length: 12 }, (_, index) => index));
  const cycles = [...master.matchAll(/^# Ciclo (\d+) — /gm)].map((match) => Number(match[1]));
  assert.deepEqual(cycles, [1, 2, 3]);
  for (const section of master.split(/^## CU-\d+ — /m).slice(1)) {
    const increments = section.split('### Incrementos\n')[1]?.split(/^### /m)[0];
    assert.ok(increments, 'Falta sección de incrementos');
    const numbers = [...increments.matchAll(/^(\d+)\. /gm)].map((match) => Number(match[1]));
    assert.ok(numbers.length >= 1 && numbers.length <= 3);
    assert.deepEqual(numbers, Array.from({ length: numbers.length }, (_, index) => index + 1));
    assert.match(section, /### Flujo, alternativas y errores/);
    assert.match(section, /### Aceptación y pruebas/);
    assert.match(section, /\*\*Documentación:\*\*/);
  }
});

check('30 IDs trazados y planificación histórica preservada íntegramente', () => {
  const expected = [0, 2, 2, 2, 2, 2, 1, 3, 3, 4, 4, 4, 6, 6, 6, 6, 6, 7, 7, 7, 7, 8, 8, 8, 8, 9, 9, 5, 10, 11];
  const rows = [...read(masterPath).matchAll(/^\| (\d+) \| [^|]+ \| CU-(\d+) \|/gm)];
  assert.equal(rows.length, 30);
  assert.deepEqual(rows.map((row) => Number(row[1])), expected.map((_, index) => index));
  assert.deepEqual(rows.map((row) => Number(row[2])), expected);
  const marker = '## 1. Propósito';
  const history = read('docs/puds/use-cases/history/initial-30-use-cases.md');
  assert.equal(history.slice(history.indexOf(marker)), original(masterPath).slice(original(masterPath).indexOf(marker)));
});

check('Benchmarks: solo cinco referencias remapeadas, métricas/datasets intactos', () => {
  const mapping = { 24: 8, 22: 8, 25: 9, 28: 10, 29: 11 };
  const expected = original(benchmarkPath).replace(/CU-(24|22|25|28|29)\b/g, (_, id) => `CU-${mapping[id]}`);
  assert.equal(read(benchmarkPath), expected);
  const rows = [...read(benchmarkPath).matchAll(/^\| (B-[A-Z-]+) \| CU-(\d+) \|/gm)];
  assert.deepEqual(rows.map((row) => [row[1], Number(row[2])]), [
    ['B-TXT-UML', 8], ['B-TXT-APP', 8], ['B-STT', 9], ['B-VLM', 10], ['B-OFFLINE', 11],
  ]);
  assert.match(read(benchmarkPath), /ningún benchmark ha sido ejecutado/);
});

check('Producto y AGENTS intactos; ADR contiene las diez decisiones', () => {
  for (const file of ['AGENTS.md', 'docs/product/product-05-astro-nestjs.md']) {
    assert.equal(read(file), original(file), `Cambio fuera de alcance: ${file}`);
  }
  const adr = read('docs/decisions/ADR-0001-initial-technical-boundaries.md');
  assert.match(adr, /Estado:\*\* Aceptado/);
  for (const heading of ['Contexto', 'Decisión', 'Consecuencias', 'Alternativas descartadas']) {
    assert.ok(adr.includes(`## ${heading}`));
  }
  assert.equal([...adr.matchAll(/^\d+\. \*\*/gm)].length, 10);
});

// Comprueba la política declarada; no sustituye al motor de permisos de OpenCode.
const wildcard = (pattern, value) => new RegExp(`^${pattern.split('').map((char) => {
  if (char === '*') return '[\\s\\S]*';
  if (char === '?') return '[\\s\\S]';
  return char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}).join('')}$`).test(value);
function permission(rules, value) {
  if (typeof rules === 'string') return rules;
  let result;
  for (const [pattern, action] of Object.entries(rules)) if (wildcard(pattern, value)) result = action;
  return result;
}

check('OpenCode: instrucciones, reglas ordenadas, ejemplos y denegaciones declaradas', () => {
  const config = JSON.parse(read('opencode.json'));
  assert.equal(config.$schema, 'https://opencode.ai/config.json');
  assert.equal(config.share, 'disabled');
  assert.deepEqual(config.instructions, ['AGENTS.md', 'docs/PROJECT_CONTEXT.md', 'docs/STATUS.md', 'docs/puds/use-cases/CU-0-inicializar-base.md']);
  assert.equal(config.permission['*'], 'ask');
  assert.equal(config.permission.external_directory, 'deny');
  for (const tool of ['read', 'edit', 'bash']) assert.equal(Object.keys(config.permission[tool])[0], '*');
  for (const tool of ['read', 'edit']) {
    for (const file of ['README.md', '.env.example', 'apps/web/.env.example', 'D:\\project-planning\\.env.example']) {
      assert.equal(permission(config.permission[tool], file), 'allow');
    }
    for (const file of ['.env', '.env.local', 'apps/api/.env.production', 'D:\\project-planning\\.env', '.env.example.local', 'secrets.env']) {
      assert.equal(permission(config.permission[tool], file), 'deny');
    }
  }
  const bash = config.permission.bash;
  for (const command of ['git status', 'git status --short --branch', 'git diff', 'git diff --check', 'git log --oneline -10']) {
    assert.equal(permission(bash, command), 'allow');
  }
  for (const command of ['npm install', 'node script.mjs', 'git status; unknown-command', 'git log > output.txt']) {
    assert.equal(permission(bash, command), 'ask');
  }
  for (const command of ['git add .', 'git commit -m test', 'git push', 'git -C . add .', 'git reset --hard', 'git clean -fd', 'gh repo create sample', 'gh api user/repos', 'rm -rf apps', 'Remove-Item -Recurse apps', 'remove-item -Recurse apps', 'rd /s apps', 'git diff --output=file', 'git diff --no-index .env README.md', 'git status && git push']) {
    assert.equal(permission(bash, command), 'deny', command);
  }
});

check('Compose estático: imagen, loopback, volumen PG18, entorno y healthcheck', () => {
  const compose = read('compose.yaml');
  assert.match(compose, /image: postgres:18\.6-alpine/);
  assert.match(compose, /"127\.0\.0\.1:5432:5432"/);
  assert.match(compose, /postgres_data:\/var\/lib\/postgresql\n/);
  assert.match(compose, /pg_isready/);
  assert.match(compose, /\$\$POSTGRES_USER/);
  assert.match(compose, /\$\$POSTGRES_DB/);
  for (const variable of ['POSTGRES_DB', 'POSTGRES_USER', 'POSTGRES_PASSWORD']) {
    assert.ok(compose.includes(`\${${variable}:-`));
  }
  assert.doesNotMatch(compose, /0\.0\.0\.0|network_mode|POSTGRES_HOST_AUTH_METHOD/);
  // La validación YAML/Compose real se ejecuta aparte con docker compose config.
});

check('Gitignore protege entorno real y permite ejemplo/lockfile futuro', () => {
  const probes = ['.env', '.env.local', '.env.production', 'apps/web/.env', 'apps/api/.env.test', '.env.example.local', '.env.example', 'apps/web/.env.example', 'package-lock.json'];
  const ignored = new Set(git('check-ignore', '--no-index', '--', ...probes).trim().split('\n'));
  for (const file of probes.slice(0, 6)) assert.ok(ignored.has(file), `No ignorado: ${file}`);
  for (const file of probes.slice(6)) assert.ok(!ignored.has(file), `Ignorado indebidamente: ${file}`);
});

check('Búsqueda heurística de posibles secretos sin mostrar contenido sensible', () => {
  const patterns = [
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    /\bgh[pousr]_[A-Za-z0-9]{30,}\b/,
    /\bgithub_pat_[A-Za-z0-9_]{40,}\b/,
    /\bAKIA[A-Z0-9]{16}\b/,
    /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/,
    /\bsk-[A-Za-z0-9_-]{32,}\b/,
    /(?:password|secret|token|api[_-]?key)\s*[=:]\s*["']?[A-Za-z0-9_+\/-]{24,}/i,
  ];
  for (const file of files) {
    const text = read(file);
    for (const pattern of patterns) assert.ok(!pattern.test(text), `Posible secreto: revisar ${file} sin volcar su contenido`);
  }
});

console.log(`CU-0.1: ${passed} grupos de comprobaciones estáticas correctos. No se instalaron dependencias ni se ejecutaron aplicaciones/builds. Compose real, revisión humana y reinicio OpenCode se verifican por separado.`);
