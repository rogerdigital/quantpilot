import OpenAI from 'openai';
import {
  type ChatOptions,
  DEFAULT_MODELS,
  type LLMMessage,
  type LLMResponse,
  type LLMTool,
  type LLMToolResponse,
  PROVIDERS,
  type ProviderConstructorOptions,
} from './types.js';

const DEFAULT_MAX_TOKENS = 4096;

export class OpenAIProvider {
  provider = PROVIDERS.OPENAI;
  model: string;
  _client: OpenAI;

  constructor(options: ProviderConstructorOptions = {}) {
    this.model = options.model || DEFAULT_MODELS[PROVIDERS.OPENAI];
    this._client = new OpenAI({
      apiKey: options.apiKey || process.env.OPENAI_API_KEY,
    });
  }

  async chat(messages: LLMMessage[], options: ChatOptions = {}): Promise<LLMResponse> {
    try {
      const openaiMessages: Array<{ role: string; content: unknown }> = [];
      if (options.systemPrompt) {
        openaiMessages.push({ role: 'system', content: options.systemPrompt });
      }
      for (const message of messages) {
        openaiMessages.push({ role: message.role, content: message.content });
      }

      const response = await this._client.chat.completions.create({
        model: this.model,
        max_tokens: options.maxTokens || DEFAULT_MAX_TOKENS,
        temperature: options.temperature,
        messages: openaiMessages as never,
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
    } catch (err: unknown) {
      return {
        ok: false,
        content: '',
        error: err instanceof Error ? err.message : 'openai_api_error',
      };
    }
  }

  async chatWithTools(
    messages: LLMMessage[],
    tools: LLMTool[],
    options: ChatOptions = {}
  ): Promise<LLMToolResponse> {
    try {
      const openaiMessages: Array<{ role: string; content: unknown }> = [];
      if (options.systemPrompt) {
        openaiMessages.push({ role: 'system', content: options.systemPrompt });
      }
      for (const message of messages) {
        openaiMessages.push({ role: message.role, content: message.content });
      }

      const openaiTools = tools.map((tool) => ({
        type: 'function' as const,
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.inputSchema,
        },
      }));

      const response = await this._client.chat.completions.create({
        model: this.model,
        max_tokens: options.maxTokens || DEFAULT_MAX_TOKENS,
        temperature: options.temperature,
        messages: openaiMessages as never,
        tools: openaiTools as never,
        tool_choice: 'auto',
      });

      const choice = response.choices[0];
      const message = choice?.message;

      return {
        ok: true,
        content: message?.content || '',
        toolCalls: (message?.tool_calls || []).map((toolCall) => ({
          id: toolCall.id,
          name: toolCall.function.name,
          input: (() => {
            try {
              return JSON.parse(toolCall.function.arguments) as Record<string, unknown>;
            } catch {
              return {};
            }
          })(),
        })),
        stopReason:
          choice?.finish_reason === 'tool_calls'
            ? 'tool_use'
            : choice?.finish_reason === 'stop'
              ? 'end_turn'
              : choice?.finish_reason,
        usage: {
          inputTokens: response.usage?.prompt_tokens || 0,
          outputTokens: response.usage?.completion_tokens || 0,
        },
      };
    } catch (err: unknown) {
      return {
        ok: false,
        content: '',
        toolCalls: [],
        error: err instanceof Error ? err.message : 'openai_api_error',
      };
    }
  }
}
