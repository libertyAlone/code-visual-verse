import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, Trash2, GitBranch, Terminal, Sparkles, AlertCircle } from "lucide-react";
import { useStore, Message } from "../../store/useStore";
import { AIService } from "../../lib/aiService";

export const AIChatPage = () => {
    const { t } = useTranslation();
    const { 
        messages, 
        addMessage, 
        clearMessages, 
        aiConfig, 
        setIsAIChatOpen, 
        nodes,
    } = useStore();
    
    const [input, setInput] = useState("");
    const [isThinking, setIsThinking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isThinking]);

    const handleSend = async (content: string = input) => {
        if (!content.trim() || isThinking) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content,
            timestamp: Date.now(),
        };

        addMessage(userMessage);
        setInput("");
        setIsThinking(true);
        setError(null);

        // Prepare context
        const systemMessage: Message = {
            id: 'system',
            role: 'system',
            content: AIService.generateProjectContext(nodes),
            timestamp: Date.now(),
        };

        const response = await AIService.chat(aiConfig, [systemMessage, ...messages, userMessage]);

        if (response.error) {
            setError(response.error);
        } else {
            addMessage({
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.content,
                timestamp: Date.now(),
            });
        }
        setIsThinking(false);
    };

    const handleMindMap = () => {
        const prompt = AIService.getMindMapPrompt();
        handleSend(prompt);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#020208]/95 backdrop-blur-xl flex flex-col font-sans"
        >
            {/* Header */}
            <div className="h-20 border-b border-white/5 px-10 flex items-center justify-between bg-linear-to-r from-cyan-950/20 to-transparent">
                <div className="flex items-center gap-6">
                    <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                        <Sparkles size={20} className="text-cyan-400" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-white tracking-[0.3em] uppercase">
                            {t("ai.chat_title")}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                            <span className="text-[11px] font-mono text-cyan-500/70 uppercase tracking-widest">
                                {t("ai.online")} // {aiConfig.protocol.toUpperCase()} // {aiConfig.model}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={handleMindMap}
                        disabled={isThinking}
                        className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-cyan-500/20 transition-all disabled:opacity-50"
                    >
                        <GitBranch size={14} />
                        {t("ai.mindmap")}
                    </button>
                    <button
                        onClick={clearMessages}
                        className="p-2.5 text-zinc-500 hover:text-red-400 transition-colors"
                        title={t("ai.clear")}
                    >
                        <Trash2 size={18} />
                    </button>
                    <div className="w-px h-8 bg-white/5 mx-2" />
                    <button
                        onClick={() => setIsAIChatOpen(false)}
                        className="w-10 h-10 flex items-center justify-center text-zinc-500 hover:text-white border border-white/5 hover:bg-white/5 transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Chat Messages */}
            <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto custom-scrollbar px-10 py-10 space-y-8"
            >
                <AnimatePresence mode="popLayout">
                    {messages.length === 0 && !isThinking && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="h-full flex flex-col items-center justify-center text-center opacity-20"
                        >
                            <Terminal size={60} className="mb-6" />
                            <p className="text-xs font-black uppercase tracking-[0.4em] max-w-xs leading-loose">
                                {t("ai.init_message")}
                            </p>
                        </motion.div>
                    )}

                    {messages.map((m) => (
                        <motion.div
                            key={m.id}
                            initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[80%] space-y-2 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                                <div className={`inline-block px-6 py-4 border ${
                                    m.role === 'user' 
                                    ? 'bg-cyan-500/5 border-cyan-500/20 text-white' 
                                    : 'bg-white/2 border-white/10 text-zinc-300'
                                }`}>
                                    <p className="text-[13px] font-mono leading-relaxed whitespace-pre-wrap">
                                        {m.content}
                                    </p>
                                </div>
                                <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                                    {t(`ai.${m.role}`)} // {new Date(m.timestamp).toLocaleTimeString()}
                                </p>
                            </div>
                        </motion.div>
                    ))}

                    {isThinking && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex justify-start"
                        >
                            <div className="bg-white/2 border border-white/10 px-6 py-4 flex items-center gap-4">
                                <div className="flex gap-1">
                                    <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" />
                                </div>
                                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em]">
                                    {t("ai.thinking")}
                                </span>
                            </div>
                        </motion.div>
                    )}

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex justify-center"
                        >
                            <div className="bg-red-500/10 border border-red-500/30 px-6 py-3 flex items-center gap-3 text-red-400">
                                <AlertCircle size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">
                                    {error}
                                </span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Input Field */}
            <div className="p-10 bg-linear-to-t from-cyan-950/10 to-transparent">
                <div className="relative max-w-5xl mx-auto">
                    <input
                        autoFocus
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={t("ai.placeholder")}
                        className="w-full bg-black/40 border-b-2 border-white/10 px-8 py-5 text-sm font-mono text-white focus:border-cyan-500 outline-none transition-all placeholder:text-zinc-700"
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={!input.trim() || isThinking}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-zinc-500 hover:text-cyan-400 disabled:opacity-30 disabled:hover:text-zinc-500 transition-all"
                    >
                        <Send size={20} />
                    </button>
                </div>
                <div className="mt-4 flex justify-center">
                    <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">
                        {t("ai.status_bar")}
                    </p>
                </div>
            </div>
        </motion.div>
    );
};
