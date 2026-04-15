// @ts-nocheck

/**
 * LLM Provider types shared across all provider implementations.
 */

/**
 * A single message in a conversation.
 * @typedef {'user'|'assistant'|'system'} MessageRole
 */

/**
 * @typedef {Object} LLMMessage
 * @property {'user'|'assistant'|'system'} role
 * @property {string} content
 */

/**
 * @typedef {Object} LLMToolParameter
 * @property {string} type
 * @property {string} [description]
 * @property {Object} [properties]
 * @property {string[]} [required]
 * @property {Object} [items]
 * @property {string[]} [enum]
 */

/**
 * A tool definition that can be passed to the LLM for function/tool calling.
 * @typedef {Object} LLMTool
 * @property {string} name
 * @property {string} description
 * @property {Object} inputSchema - JSON Schema for the tool's input parameters
 */

/**
 * @typedef {Object} LLMResponse
 * @property {boolean} ok
 * @property {string} content
 * @property {string} [model]
 * @property {'end_turn'|'max_tokens'|'tool_use'|'stop'} [stopReason]
 * @property {{inputTokens: number, outputTokens: number}} [usage]
 * @property {string} [error]
 */

/**
 * @typedef {Object} LLMToolCall
 * @property {string} id
 * @property {string} name
 * @property {Object} input
 */

/**
 * @typedef {Object} LLMToolResponse
 * @property {boolean} ok
 * @property {string} content
 * @property {LLMToolCall[]} [toolCalls]
 * @property {'end_turn'|'max_tokens'|'tool_use'|'stop'} [stopReason]
 * @property {{inputTokens: number, outputTokens: number}} [usage]
 * @property {string} [error]
 */

/**
 * @typedef {Object} ChatOptions
 * @property {number} [maxTokens]
 * @property {number} [temperature]
 * @property {string} [systemPrompt]
 */

export const PROVIDERS = /** @type {const} */ ({
  CLAUDE: 'claude',
  OPENAI: 'openai',
});

export const DEFAULT_MODELS = {
  [PROVIDERS.CLAUDE]: 'claude-sonnet-4-6',
  [PROVIDERS.OPENAI]: 'gpt-4o',
};
