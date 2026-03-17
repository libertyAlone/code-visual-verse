import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIService, ChatResponse } from './aiService';
import { AIConfig, Message } from '../store/useStore';

// Mock Tauri invoke
const mockInvoke = vi.fn();
vi.mock('@tauri-apps/api/core', () => ({
  invoke: (...args: any[]) => mockInvoke(...args),
}));

// Mock i18n
const mockT = vi.fn((key: string, params?: any) => {
  if (key === 'ai.context_prompt') return `Context: ${params?.fileTree || ''}`;
  if (key === 'ai.mindmap_prompt') return 'Generate mind map';
  return key;
});

vi.mock('./i18n', () => ({
  default: { t: (key: string, params?: any) => mockT(key, params) },
  __esModule: true,
}));

describe('AIService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('chat', () => {
    const mockConfig: AIConfig = {
      protocol: 'openai',
      apiKey: 'test-api-key',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o',
    };

    const mockMessages: Message[] = [
      { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      { id: '2', role: 'assistant', content: 'Hi there!', timestamp: Date.now() },
    ];

    it('should call ai_chat invoke with correct parameters', async () => {
      mockInvoke.mockResolvedValue('AI response');

      await AIService.chat(mockConfig, mockMessages);

      expect(mockInvoke).toHaveBeenCalledWith('ai_chat', {
        protocol: 'openai',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'test-api-key',
        model: 'gpt-4o',
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' },
        ],
      });
    });

    it('should return content on success', async () => {
      mockInvoke.mockResolvedValue('AI response content');

      const result: ChatResponse = await AIService.chat(mockConfig, mockMessages);

      expect(result.content).toBe('AI response content');
      expect(result.error).toBeUndefined();
    });

    it('should handle empty messages array', async () => {
      mockInvoke.mockResolvedValue('Response to empty input');

      const result = await AIService.chat(mockConfig, []);

      expect(mockInvoke).toHaveBeenCalledWith('ai_chat', expect.objectContaining({
        messages: [],
      }));
      expect(result.content).toBe('Response to empty input');
    });

    it('should handle errors and return error message', async () => {
      mockInvoke.mockRejectedValue('Network error');

      const result = await AIService.chat(mockConfig, mockMessages);

      expect(result.content).toBe('');
      expect(result.error).toBe('Network error');
    });

    it('should handle error objects', async () => {
      mockInvoke.mockRejectedValue({ message: 'API Error' });

      const result = await AIService.chat(mockConfig, mockMessages);

      expect(result.content).toBe('');
      expect(result.error).toBe('Unknown Error');
    });

    it('should support anthropic protocol', async () => {
      const anthropicConfig: AIConfig = {
        protocol: 'anthropic',
        apiKey: 'anthropic-key',
        baseUrl: 'https://api.anthropic.com',
        model: 'claude-3-opus-20240229',
      };

      mockInvoke.mockResolvedValue('Claude response');

      await AIService.chat(anthropicConfig, mockMessages);

      expect(mockInvoke).toHaveBeenCalledWith('ai_chat', expect.objectContaining({
        protocol: 'anthropic',
        baseUrl: 'https://api.anthropic.com',
        apiKey: 'anthropic-key',
        model: 'claude-3-opus-20240229',
      }));
    });

    it('should filter out system messages from API call', async () => {
      const messagesWithSystem: Message[] = [
        { id: '1', role: 'system', content: 'System prompt', timestamp: Date.now() },
        { id: '2', role: 'user', content: 'Hello', timestamp: Date.now() },
      ];

      mockInvoke.mockResolvedValue('Response');

      await AIService.chat(mockConfig, messagesWithSystem);

      const callArgs = mockInvoke.mock.calls[0][1];
      expect(callArgs.messages).toHaveLength(2);
      expect(callArgs.messages).toContainEqual({ role: 'system', content: 'System prompt' });
      expect(callArgs.messages).toContainEqual({ role: 'user', content: 'Hello' });
    });
  });

  describe('generateProjectContext', () => {
    it('should generate context from nodes', () => {
      const nodes = [
        { name: 'src', path: '/project/src', is_dir: true },
        { name: 'App.tsx', path: '/project/src/App.tsx', is_dir: false },
        { name: 'utils', path: '/project/src/utils', is_dir: true },
        { name: 'helpers.ts', path: '/project/src/utils/helpers.ts', is_dir: false },
      ];

      const context = AIService.generateProjectContext(nodes);

      expect(context).toContain('📁 /project/src');
      expect(context).toContain('📄 /project/src/App.tsx');
      expect(context).toContain('📁 /project/src/utils');
      expect(context).toContain('📄 /project/src/utils/helpers.ts');
    });

    it('should handle empty nodes array', () => {
      const context = AIService.generateProjectContext([]);

      expect(context).toBe('Context: ');
    });

    it('should use i18n for translation', () => {
      const nodes = [{ name: 'test.ts', path: '/test.ts', is_dir: false }];

      AIService.generateProjectContext(nodes);

      expect(mockT).toHaveBeenCalledWith('ai.context_prompt', expect.any(Object));
    });
  });

  describe('getMindMapPrompt', () => {
    it('should return mind map prompt from i18n', () => {
      const prompt = AIService.getMindMapPrompt();

      expect(prompt).toBe('Generate mind map');
      expect(mockT).toHaveBeenCalledWith('ai.mindmap_prompt', undefined);
    });
  });
});
