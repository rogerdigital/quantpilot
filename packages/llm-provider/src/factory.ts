import { ClaudeProvider } from './claude-provider.js';
import { OpenAIProvider } from './openai-provider.js';
import {
  DEFAULT_MODELS,
  PROVIDERS,
  type ProviderConstructorOptions,
  type ProviderName,
} from './types.js';

export function createLLMProvider(
  options: ProviderConstructorOptions = {}
): ClaudeProvider | OpenAIProvider | null {
  const envProvider = process.env.QUANTPILOT_LLM_PROVIDER;
  const providerName: ProviderName | null =
    options.provider ||
    (envProvider === PROVIDERS.CLAUDE || envProvider === PROVIDERS.OPENAI ? envProvider : null) ||
    inferProvider();
  const model =
    options.model ||
    process.env.QUANTPILOT_LLM_MODEL ||
    (providerName ? DEFAULT_MODELS[providerName] : undefined);

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

function inferProvider(): ProviderName | null {
  if (process.env.ANTHROPIC_API_KEY) return PROVIDERS.CLAUDE;
  if (process.env.OPENAI_API_KEY) return PROVIDERS.OPENAI;
  return null;
}

export function getConfiguredProvider(): ProviderName | null {
  const name = process.env.QUANTPILOT_LLM_PROVIDER || inferProvider();
  if (name === PROVIDERS.CLAUDE || name === PROVIDERS.OPENAI) return name;
  return null;
}

export function isLLMAvailable() {
  return inferProvider() !== null || Boolean(process.env.QUANTPILOT_LLM_PROVIDER);
}
