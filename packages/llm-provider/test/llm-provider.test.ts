import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { ClaudeProvider } from '../src/claude-provider.js';
import { OpenAIProvider } from '../src/openai-provider.js';
import {
  createLLMProvider,
  getConfiguredProvider,
  isLLMAvailable,
} from '../src/factory.js';
import { PROVIDERS, DEFAULT_MODELS } from '../src/types.js';
import type { LLMMessage, LLMTool } from '../src/types.js';

const MOCK_MESSAGES: LLMMessage[] = [
  { role: 'user', content: 'Hello' },
];

const MOCK_TOOLS: LLMTool[] = [
  {
    name: 'get_price',
    description: 'Get stock price',
    inputSchema: { type: 'object', properties: { symbol: { type: 'string' } } },
  },
];

describe('llm-provider', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('factory', () => {
    it('createLLMProvider returns null when no keys configured', () => {
      delete process.env.ANTHROPIC_API_KEY;
      delete process.env.OPENAI_API_KEY;
      delete process.env.QUANTPILOT_LLM_PROVIDER;
      assert.equal(createLLMProvider(), null);
    });

    it('createLLMProvider creates ClaudeProvider with explicit apiKey', () => {
      const provider = createLLMProvider({
        provider: PROVIDERS.CLAUDE,
        apiKey: 'test-key',
      });
      assert.ok(provider instanceof ClaudeProvider);
      assert.equal(provider.provider, PROVIDERS.CLAUDE);
    });

    it('createLLMProvider creates OpenAIProvider with explicit apiKey', () => {
      const provider = createLLMProvider({
        provider: PROVIDERS.OPENAI,
        apiKey: 'test-key',
      });
      assert.ok(provider instanceof OpenAIProvider);
      assert.equal(provider.provider, PROVIDERS.OPENAI);
    });

    it('createLLMProvider infers Claude from ANTHROPIC_API_KEY', () => {
      process.env.ANTHROPIC_API_KEY = 'sk-test';
      delete process.env.OPENAI_API_KEY;
      const provider = createLLMProvider();
      assert.ok(provider instanceof ClaudeProvider);
    });

    it('createLLMProvider infers OpenAI from OPENAI_API_KEY', () => {
      delete process.env.ANTHROPIC_API_KEY;
      process.env.OPENAI_API_KEY = 'sk-test';
      const provider = createLLMProvider();
      assert.ok(provider instanceof OpenAIProvider);
    });

    it('createLLMProvider respects QUANTPILOT_LLM_PROVIDER env', () => {
      process.env.ANTHROPIC_API_KEY = 'sk-ant';
      process.env.OPENAI_API_KEY = 'sk-oai';
      process.env.QUANTPILOT_LLM_PROVIDER = PROVIDERS.OPENAI;
      const provider = createLLMProvider();
      assert.ok(provider instanceof OpenAIProvider);
    });

    it('createLLMProvider uses custom model', () => {
      const provider = createLLMProvider({
        provider: PROVIDERS.CLAUDE,
        apiKey: 'test',
        model: 'claude-haiku-4-5-20251001',
      });
      assert.equal(provider!.model, 'claude-haiku-4-5-20251001');
    });

    it('createLLMProvider uses default model when not specified', () => {
      const provider = createLLMProvider({
        provider: PROVIDERS.CLAUDE,
        apiKey: 'test',
      });
      assert.equal(provider!.model, DEFAULT_MODELS[PROVIDERS.CLAUDE]);
    });

    it('getConfiguredProvider returns null when no keys', () => {
      delete process.env.ANTHROPIC_API_KEY;
      delete process.env.OPENAI_API_KEY;
      delete process.env.QUANTPILOT_LLM_PROVIDER;
      assert.equal(getConfiguredProvider(), null);
    });

    it('isLLMAvailable returns false when no keys', () => {
      delete process.env.ANTHROPIC_API_KEY;
      delete process.env.OPENAI_API_KEY;
      delete process.env.QUANTPILOT_LLM_PROVIDER;
      assert.equal(isLLMAvailable(), false);
    });

    it('isLLMAvailable returns true with ANTHROPIC_API_KEY', () => {
      process.env.ANTHROPIC_API_KEY = 'sk-test';
      assert.equal(isLLMAvailable(), true);
    });
  });

  describe('ClaudeProvider', () => {
    it('constructs with default model', () => {
      const provider = new ClaudeProvider({ apiKey: 'test-key' });
      assert.equal(provider.model, DEFAULT_MODELS[PROVIDERS.CLAUDE]);
      assert.equal(provider.provider, PROVIDERS.CLAUDE);
    });

    it('constructs with custom model', () => {
      const provider = new ClaudeProvider({
        apiKey: 'test',
        model: 'custom-model',
      });
      assert.equal(provider.model, 'custom-model');
    });

    it('chat returns a well-formed response', async () => {
      const provider = new ClaudeProvider({ apiKey: 'invalid-key' });
      const result = await provider.chat(MOCK_MESSAGES);
      assert.ok(typeof result.ok === 'boolean');
      assert.ok('content' in result);
      if (!result.ok) {
        assert.ok(result.error);
      }
    });

    it('chatWithTools returns a well-formed response', async () => {
      const provider = new ClaudeProvider({ apiKey: 'invalid-key' });
      const result = await provider.chatWithTools(MOCK_MESSAGES, MOCK_TOOLS);
      assert.ok(typeof result.ok === 'boolean');
      assert.ok('content' in result);
    });
  });

  describe('OpenAIProvider', () => {
    it('constructs with default model', () => {
      const provider = new OpenAIProvider({ apiKey: 'test-key' });
      assert.equal(provider.model, DEFAULT_MODELS[PROVIDERS.OPENAI]);
      assert.equal(provider.provider, PROVIDERS.OPENAI);
    });

    it('constructs with custom model', () => {
      const provider = new OpenAIProvider({
        apiKey: 'test',
        model: 'gpt-4o-mini',
      });
      assert.equal(provider.model, 'gpt-4o-mini');
    });

    it('chat returns a well-formed response', async () => {
      const provider = new OpenAIProvider({ apiKey: 'invalid-key' });
      const result = await provider.chat(MOCK_MESSAGES);
      assert.ok(typeof result.ok === 'boolean');
      assert.ok('content' in result);
      if (!result.ok) {
        assert.ok(result.error);
      }
    });

    it('chatWithTools returns a well-formed response', async () => {
      const provider = new OpenAIProvider({ apiKey: 'invalid-key' });
      const result = await provider.chatWithTools(MOCK_MESSAGES, MOCK_TOOLS);
      assert.ok(typeof result.ok === 'boolean');
      assert.ok('content' in result);
    });
  });
});
