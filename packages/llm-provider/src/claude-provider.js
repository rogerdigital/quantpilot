// @ts-nocheck
import Anthropic from '@anthropic-ai/sdk';
import { DEFAULT_MODELS, PROVIDERS } from './types.js';

const DEFAULT_MAX_TOKENS = 4096;

/**
 * Claude API provider implementation.
 * Uses Anthropic SDK with tool_use support.
 */
export class ClaudeProvider {
  constructor(options = {}) {
    this.provider = PROVIDERS.CLAUDE;
    this.model = options.model || DEFAULT_MODELS[PROVIDERS.CLAUDE];
    this._client = new Anthropic({
      apiKey: options.apiKey || process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Send a chat request without tools.
   * @param {import('./types.js').LLMMessage[]} messages
   * @param {import('./types.js').ChatOptions} [options]
   * @returns {Promise<import('./types.js').LLMResponse>}
   */
  async chat(messages, options = {}) {
    try {
      const systemPrompt = options.systemPrompt || '';
      const anthropicMessages = messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await this._client.messages.create({
        model: this.model,
        max_tokens: options.maxTokens || DEFAULT_MAX_TOKENS,
        temperature: options.temperature,
        system: systemPrompt || undefined,
        messages: anthropicMessages,
      });

      const textBlock = response.content.find((b) => b.type === 'text');
      return {
        ok: true,
        content: textBlock?.text || '',
        model: response.model,
        stopReason: response.stop_reason,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
      };
    } catch (err) {
      return {
        ok: false,
        content: '',
        error: err?.message || 'claude_api_error',
      };
    }
  }

  /**
   * Send a chat request with tool use support.
   * @param {import('./types.js').LLMMessage[]} messages
   * @param {import('./types.js').LLMTool[]} tools
   * @param {import('./types.js').ChatOptions} [options]
   * @returns {Promise<import('./types.js').LLMToolResponse>}
   */
  async chatWithTools(messages, tools, options = {}) {
    try {
      const systemPrompt = options.systemPrompt || '';
      const anthropicMessages = messages
        .filter((m) => m.role !== 'system')
        .map((m) => {
          if (typeof m.content === 'string') {
            return { role: m.role, content: m.content };
          }
          return { role: m.role, content: m.content };
        });

      const anthropicTools = tools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.inputSchema,
      }));

      const response = await this._client.messages.create({
        model: this.model,
        max_tokens: options.maxTokens || DEFAULT_MAX_TOKENS,
        temperature: options.temperature,
        system: systemPrompt || undefined,
        messages: anthropicMessages,
        tools: anthropicTools,
      });

      const textBlocks = response.content.filter((b) => b.type === 'text');
      const toolUseBlocks = response.content.filter((b) => b.type === 'tool_use');

      const textContent = textBlocks.map((b) => b.text).join('\n');
      const toolCalls = toolUseBlocks.map((b) => ({
        id: b.id,
        name: b.name,
        input: b.input,
      }));

      return {
        ok: true,
        content: textContent,
        toolCalls,
        stopReason: response.stop_reason,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
      };
    } catch (err) {
      return {
        ok: false,
        content: '',
        toolCalls: [],
        error: err?.message || 'claude_api_error',
      };
    }
  }
}
