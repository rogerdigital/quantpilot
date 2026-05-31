import { existsSync, readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const defaultEnvPath = existsSync(resolve(repoRoot, '.env'))
  ? resolve(repoRoot, '.env')
  : resolve(repoRoot, '.env.example');

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      options[key] = true;
      continue;
    }
    options[key] = next;
    index += 1;
  }
  return options;
}

function loadEnvFile(pathname) {
  const text = readFileSync(pathname, 'utf8');
  const values = {};
  text.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const separator = trimmed.indexOf('=');
    if (separator === -1) return;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    values[key] = value;
  });
  return values;
}

function requireAllowed(errors, values, key, allowed) {
  const value = values[key];
  if (!value) return;
  if (!allowed.includes(value)) {
    errors.push(`${key} must be one of: ${allowed.join(', ')}`);
  }
}

function requirePositiveInteger(errors, values, key) {
  const value = values[key];
  if (!value) return;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    errors.push(`${key} must be a positive integer`);
  }
}

function requireBooleanString(errors, values, key) {
  const value = values[key];
  if (!value) return;
  if (!['true', 'false'].includes(String(value).toLowerCase())) {
    errors.push(`${key} must be true or false`);
  }
}

function requireNonEmpty(errors, values, key, message = `${key} is required`) {
  if (!String(values[key] || '').trim()) {
    errors.push(message);
  }
}

function requirePathPrefix(errors, values, key) {
  const value = values[key];
  if (!value) return;
  if (!value.startsWith('/')) {
    errors.push(`${key} must start with "/" so the frontend can call the same-origin gateway`);
  }
}

function resolveTradingMode(values) {
  return values.QUANTPILOT_TRADING_MODE || values.VITE_TRADING_MODE || 'simulated';
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const envPath = resolve(repoRoot, options['env-file'] || defaultEnvPath);
  if (!existsSync(envPath)) {
    throw new Error(`env file was not found: ${envPath}`);
  }

  const fileValues = loadEnvFile(envPath);
  const values = {
    ...fileValues,
    ...process.env,
  };
  const templateMode = basename(envPath).includes('.example');
  const errors = [];
  const warnings = [];

  requireAllowed(errors, values, 'QUANTPILOT_TRADING_MODE', ['simulated', 'paper']);
  requireAllowed(errors, values, 'VITE_TRADING_MODE', ['simulated', 'paper']);
  requirePositiveInteger(errors, values, 'GATEWAY_PORT');
  requirePositiveInteger(errors, values, 'VITE_REFRESH_MS');
  requireAllowed(errors, values, 'VITE_MARKET_DATA_PROVIDER', ['simulated', 'custom-http']);
  requireAllowed(errors, values, 'VITE_BROKER_PROVIDER', ['simulated', 'custom-http']);

  const tradingMode = resolveTradingMode(values);
  if (
    values.QUANTPILOT_TRADING_MODE &&
    values.VITE_TRADING_MODE &&
    values.QUANTPILOT_TRADING_MODE !== values.VITE_TRADING_MODE
  ) {
    errors.push('VITE_TRADING_MODE must match QUANTPILOT_TRADING_MODE when both are set');
  }

  if (values.VITE_MARKET_DATA_PROVIDER === 'custom-http' && !values.VITE_MARKET_DATA_HTTP_URL) {
    const target = templateMode ? warnings : errors;
    target.push(
      'VITE_MARKET_DATA_HTTP_URL should be set when VITE_MARKET_DATA_PROVIDER=custom-http'
    );
  }

  if (values.VITE_BROKER_PROVIDER === 'custom-http' && !values.VITE_BROKER_HTTP_URL) {
    const target = templateMode ? warnings : errors;
    target.push('VITE_BROKER_HTTP_URL should be set when VITE_BROKER_PROVIDER=custom-http');
  }

  if (values.QUANTPILOT_CONTROL_PLANE_NAMESPACE === '') {
    errors.push('QUANTPILOT_CONTROL_PLANE_NAMESPACE must not be empty when provided');
  }

  if (errors.length) {
    console.error(`Runtime environment check failed for ${envPath}:`);
    for (const item of errors) console.error(`- ${item}`);
    process.exitCode = 1;
    return;
  }

  console.info(`Runtime environment check passed for ${envPath}.`);
  if (warnings.length) {
    console.info('Warnings:');
    for (const item of warnings) console.info(`- ${item}`);
  }
}

main();
