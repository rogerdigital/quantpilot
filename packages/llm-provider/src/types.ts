export type MessageRole = 'user' | 'assistant' | 'system';

export type StopReason = 'end_turn' | 'max_tokens' | 'tool_use' | 'stop' | null;

export type LLMMessageContent = string | Array<Record<string, unknown>>;

export type LLMMessage = {
  role: MessageRole;
  content: LLMMessageContent;
};

export type LLMToolParameter = {
  type: string;
  description?: string;
  properties?: Record<string, unknown>;
  required?: string[];
  items?: Record<string, unknown>;
  enum?: string[];
};

export type LLMTool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

export type LLMUsage = {
  inputTokens: number;
  outputTokens: number;
};

export type LLMResponse = {
  ok: boolean;
  content: string;
  model?: string;
  stopReason?: StopReason | string;
  usage?: LLMUsage;
  error?: string;
};

export type LLMToolCall = {
  id: string;
  name: string;
  input: Record<string, unknown>;
};

export type LLMToolResponse = {
  ok: boolean;
  content: string;
  toolCalls?: LLMToolCall[];
  stopReason?: StopReason | string;
  usage?: LLMUsage;
  error?: string;
};

export type ChatOptions = {
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
};

export const PROVIDERS = {
  CLAUDE: 'claude',
  OPENAI: 'openai',
} as const;

export type ProviderName = (typeof PROVIDERS)[keyof typeof PROVIDERS];

export type ProviderConstructorOptions = {
  provider?: ProviderName;
  model?: string;
  apiKey?: string;
};

export const DEFAULT_MODELS: Record<ProviderName, string> = {
  [PROVIDERS.CLAUDE]: 'claude-sonnet-4-6',
  [PROVIDERS.OPENAI]: 'gpt-4o',
};
