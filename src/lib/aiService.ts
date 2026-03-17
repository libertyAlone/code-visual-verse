import { invoke } from '@tauri-apps/api/core';
import { AIConfig, Message } from '../store/useStore';
import i18n from './i18n';

export interface ChatResponse {
    content: string;
    error?: string;
}

export class AIService {
    static async chat(config: AIConfig, messages: Message[]): Promise<ChatResponse> {
        try {
            const content = await invoke<string>('ai_chat', {
                protocol: config.protocol,
                baseUrl: config.baseUrl,
                apiKey: config.apiKey,
                model: config.model,
                messages: messages.map(m => ({
                    role: m.role,
                    content: m.content,
                })),
            });

            return { content };
        } catch (error) {
            console.error('AI Chat Error:', error);
            return { 
                content: '', 
                error: typeof error === 'string' ? error : 'Unknown Error' 
            };
        }
    }

    static generateProjectContext(nodes: any[]): string {
        const fileTree = nodes
            .map(n => `${n.is_dir ? '📁' : '📄'} ${n.path}`)
            .join('\n');
        
        return i18n.t('ai.context_prompt', { fileTree });
    }

    static getMindMapPrompt(): string {
        return i18n.t('ai.mindmap_prompt');
    }
}
