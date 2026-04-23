import Anthropic from '@anthropic-ai/sdk';
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

export class ClaudeProvider {
  provider = PROVIDERS.CLAUDE;
  model: string;
  _client: Anthropic;

  constructor(options: ProviderConstructorOptions = {}) {
    this.model = options.model || DEFAULT_MODELS[PROVIDERS.CLAUDE];
    this._client = new Anthropic({
      apiKey: options.apiKey || process.env.ANTHROPIC_API_KEY,
    });
  }

  async chat(messages: LLMMessage[], options: ChatOptions = {}): Promise<LLMResponse> {
    try {
      const systemPrompt = options.systemPrompt || '';
      const anthropicMessages = messages
        .filter((message) => message.role !== 'system')
        .map((message) => ({ role: message.role, content: message.content }));

      const response = await this._client.messages.create({
        model: this.model,
        max_tokens: options.maxTokens || DEFAULT_MAX_TOKENS,
        temperature: options.temperature,
        system: systemPrompt || undefined,
        messages: anthropicMessages as never,
      });

      const textBlock = response.content.find((block) => block.type === 'text');
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
    } catch (err: unknown) {
      return {
        ok: false,
        content: '',
        error: err instanceof Error ? err.message : 'claude_api_error',
      };
    }
  }

  async chatWithTools(
    messages: LLMMessage[],
    tools: LLMTool[],
    options: ChatOptions = {}
  ): Promise<LLMToolResponse> {
    try {
      const systemPrompt = options.systemPrompt || '';
      const anthropicMessages = messages
        .filter((message) => message.role !== 'system')
        .map((message) => ({ role: message.role, content: message.content }));

      const anthropicTools = tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.inputSchema,
      }));

      const response = await this._client.messages.create({
        model: this.model,
        max_tokens: options.maxTokens || DEFAULT_MAX_TOKENS,
        temperature: options.temperature,
        system: systemPrompt || undefined,
        messages: anthropicMessages as never,
        tools: anthropicTools as never,
      });

      const textBlocks = response.content.filter((block) => block.type === 'text');
      const toolUseBlocks = response.content.filter((block) => block.type === 'tool_use');

      return {
        ok: true,
        content: textBlocks.map((block) => block.text).join('\n'),
        toolCalls: toolUseBlocks.map((block) => ({
          id: block.id,
          name: block.name,
          input: block.input as Record<string, unknown>,
        })),
        stopReason: response.stop_reason,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
      };
    } catch (err: unknown) {
      return {
        ok: false,
        content: '',
        toolCalls: [],
        error: err instanceof Error ? err.message : 'claude_api_error',
      };
    }
  }
}
