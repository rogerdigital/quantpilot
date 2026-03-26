import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  createControlPlaneStore,
  exportControlPlaneBackup,
  getControlPlaneIntegrityReport,
  restoreControlPlaneBackup,
} from '../packages/control-plane-store/src/index.mjs';
import { createControlPlaneRuntime } from '../packages/control-plane-runtime/src/index.mjs';
import { createControlPlaneContext } from '../packages/control-plane-store/src/context.mjs';

function parseArgs(argv) {
  const [command = 'check', ...rest] = argv;
  const options = {};
  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = rest[index + 1];
    if (!next || next.startsWith('--')) {
      options[key] = true;
      continue;
    }
    options[key] = next;
    index += 1;
  }
  return { command, options };
}

function printJson(payload) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

function createRuntime(options = {}) {
  const store = createControlPlaneStore({
    adapter: options.adapter,
    namespace: options.namespace,
  });
  const context = createControlPlaneContext(store);
  return {
    store,
    context,
    runtime: createControlPlaneRuntime(context),
  };
}

function requireInput(pathname) {
  if (!pathname) {
    throw new Error('restore requires --input <path>');
  }
  return JSON.parse(readFileSync(resolve(pathname), 'utf8'));
}

async function main() {
  const { command, options } = parseArgs(process.argv.slice(2));
  const { store, runtime } = createRuntime(options);

  if (command === 'backup') {
    const backup = exportControlPlaneBackup(store);
    if (options.output) {
      writeFileSync(resolve(options.output), JSON.stringify(backup, null, 2));
      printJson({
        ok: true,
        output: resolve(options.output),
        fileCount: backup.files.length,
        adapter: backup.adapter,
      });
      return;
    }
    printJson(backup);
    return;
  }

  if (command === 'restore') {
    const input = requireInput(options.input);
    printJson(restoreControlPlaneBackup(store, input, {
      dryRun: Boolean(options['dry-run']),
    }));
    return;
  }

  if (command === 'repair-workflows') {
    const result = runtime.releaseScheduledWorkflowRuns({
      worker: options.worker || 'maintenance-cli',
      limit: Number(options.limit || 20),
      now: options.now || new Date().toISOString(),
    });
    printJson({
      ok: true,
      ...result,
    });
    return;
  }

  printJson(getControlPlaneIntegrityReport(store));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
