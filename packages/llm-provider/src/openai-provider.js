// @ts-nocheck
import OpenAI from 'openai';
import { DEFAULT_MODELS, PROVIDERS } from './types.js';

const DEFAULT_MAX_TOKENS = 4096;

/**
 * OpenAI provider implementation.
 * Uses OpenAI SDK with function_call / tool_calls support.
 */
export class OpenAIProvider {
  constructor(options = {}) {
    this.provider = PROVIDERS.OPENAI;
    this.model = options.model || DEFAULT_MODELS[PROVIDERS.OPENAI];
    this._client = new OpenAI({
      apiKey: options.apiKey || process.env.OPENAI_API_KEY,
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
      const openaiMessages = [];
      if (options.systemPrompt) {
        openaiMessages.push({ role: 'system', content: options.systemPrompt });
      }
      for (const m of messages) {
        openaiMessages.push({ role: m.role, content: m.content });
      }

      const response = await this._client.chat.completions.create({
        model: this.model,
        max_tokens: options.maxTokens || DEFAULT_MAX_TOKENS,
        temperature: options.temperature,
        messages: openaiMessages,
      });

      const choice = response.choices[0];
      return {
        ok: true,
        content: choice?.message?.content || '',
        model: response.model,
        stopReason: choice?.finish_reason === 'stop' ? 'end_turn' : choice?.finish_reason,
        usage: {
          inputTokens: response.usage?.prompt_tokens || 0,
          outputTokens: response.usage?.completion_tokens || 0,
        },
      };
    } catch (err) {
      return {
        ok: false,
        content: '',
        error: err?.message || 'openai_api_error',
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
      const openaiMessages = [];
      if (options.systemPrompt) {
        openaiMessages.push({ role: 'system', content: options.systemPrompt });
      }
      for (const m of messages) {
        if (typeof m.content === 'string') {
          openaiMessages.push({ role: m.role, content: m.content });
        } else {
          openaiMessages.push({ role: m.role, content: m.content });
        }
      }

      const openaiTools = tools.map((t) => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.inputSchema,
        },
      }));

      const response = await this._client.chat.completions.create({
        model: this.model,
        max_tokens: options.maxTokens || DEFAULT_MAX_TOKENS,
        temperature: options.temperature,
        messages: openaiMessages,
        tools: openaiTools,
        tool_choice: 'auto',
      });

      const choice = response.choices[0];
      const message = choice?.message;
      const textContent = message?.content || '';
      const toolCalls = (message?.tool_calls || []).map((tc) => ({
        id: tc.id,
        name: tc.function.name,
        input: (() => {
          try {
            return JSON.parse(tc.function.arguments);
          } catch {
            return {};
          }
        })(),
      }));

      const stopReason = (() => {
        if (choice?.finish_reason === 'tool_calls') return 'tool_use';
        if (choice?.finish_reason === 'stop') return 'end_turn';
        return choice?.finish_reason;
      })();

      return {
        ok: true,
        content: textContent,
        toolCalls,
        stopReason,
        usage: {
          inputTokens: response.usage?.prompt_tokens || 0,
          outputTokens: response.usage?.completion_tokens || 0,
        },
      };
    } catch (err) {
      return {
        ok: false,
        content: '',
        toolCalls: [],
        error: err?.message || 'openai_api_error',
      };
    }
  }
}
