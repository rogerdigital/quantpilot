// @ts-nocheck
import { ClaudeProvider } from './claude-provider.js';
import { OpenAIProvider } from './openai-provider.js';
import { DEFAULT_MODELS, PROVIDERS } from './types.js';

/**
 * Create an LLM provider instance based on environment configuration.
 *
 * Priority:
 * 1. Explicit options.provider
 * 2. QUANTPILOT_LLM_PROVIDER env var
 * 3. Fallback: claude (if ANTHROPIC_API_KEY set), openai (if OPENAI_API_KEY set)
 * 4. Last resort: null provider (no-op, returns rule-based fallback signal)
 *
 * @param {Object} [options]
 * @param {'claude'|'openai'} [options.provider]
 * @param {string} [options.model]
 * @param {string} [options.apiKey]
 * @returns {ClaudeProvider|OpenAIProvider|null}
 */
export function createLLMProvider(options = {}) {
  const providerName =
    options.provider ||
    process.env.QUANTPILOT_LLM_PROVIDER ||
    _inferProvider();

  const model =
    options.model ||
    process.env.QUANTPILOT_LLM_MODEL ||
    DEFAULT_MODELS[providerName];

  if (providerName === PROVIDERS.CLAUDE) {
    const apiKey = options.apiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return null;
    return new ClaudeProvider({ model, apiKey });
  }

  if (providerName === PROVIDERS.OPENAI) {
    const apiKey = options.apiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) return null;
    return new OpenAIProvider({ model, apiKey });
  }

  return null;
}

function _inferProvider() {
  if (process.env.ANTHROPIC_API_KEY) return PROVIDERS.CLAUDE;
  if (process.env.OPENAI_API_KEY) return PROVIDERS.OPENAI;
  return null;
}

/**
 * Get the currently configured provider name from environment.
 * @returns {'claude'|'openai'|null}
 */
export function getConfiguredProvider() {
  const name = process.env.QUANTPILOT_LLM_PROVIDER || _inferProvider();
  if (name === PROVIDERS.CLAUDE || name === PROVIDERS.OPENAI) return name;
  return null;
}

/**
 * Check if any LLM provider is configured and available.
 * @returns {boolean}
 */
export function isLLMAvailable() {
  return _inferProvider() !== null || Boolean(process.env.QUANTPILOT_LLM_PROVIDER);
}
