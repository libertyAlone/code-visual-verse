import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Globe, Key, Terminal, Cpu } from "lucide-react";
import { useStore, AIProtocol } from "../../store/useStore";

export const AISettings = () => {
    const { t } = useTranslation();
    const { 
        aiConfig, 
        setAIConfig, 
        isAISettingsModalOpen, 
        setIsAISettingsModalOpen 
    } = useStore();

    if (!isAISettingsModalOpen) return null;

    const protocols: AIProtocol[] = ['openai', 'anthropic'];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="w-full max-w-lg bg-[#0a0c1a] border border-cyan-500/30 shadow-[0_0_100px_rgba(6,182,212,0.15)] overflow-hidden"
                >
                    {/* Header */}
                    <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-linear-to-r from-cyan-950/20 to-transparent">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                                <Sparkles size={18} className="text-cyan-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-white uppercase tracking-[0.3em]">
                                    {t("ai.settings_title")}
                                </h3>
                                <p className="text-[11px] font-mono text-cyan-500/50 uppercase tracking-widest mt-0.5">
                                    {t("ai.interface_version")}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsAISettingsModalOpen(false)}
                            className="p-2 text-zinc-500 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-8 space-y-8">
                        {/* Protocol Selection */}
                        <div className="space-y-4">
                            <label className="flex items-center gap-2 text-[11px] font-black text-cyan-100/50 uppercase tracking-[0.2em]">
                                <Globe size={12} />
                                {t("ai.protocol")}
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                {protocols.map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setAIConfig({ protocol: p })}
                                        className={`py-3 px-4 border text-[12px] font-black uppercase tracking-widest transition-all ${
                                            aiConfig.protocol === p 
                                            ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.1)]' 
                                            : 'bg-white/2 border-white/5 text-zinc-500 hover:border-white/10'
                                        }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Base URL */}
                        <div className="space-y-4">
                            <label className="flex items-center gap-2 text-[11px] font-black text-cyan-100/50 uppercase tracking-[0.2em]">
                                <Terminal size={12} />
                                {t("ai.endpoint")} ({t("ai.endpoint_hint")})
                            </label>
                            <input
                                type="text"
                                value={aiConfig.baseUrl}
                                onChange={(e) => setAIConfig({ baseUrl: e.target.value })}
                                placeholder="https://api.openai.com/v1"
                                className="w-full bg-black/40 border border-white/10 px-5 py-3 text-sm font-mono text-white focus:border-cyan-500/50 outline-none transition-all placeholder:text-zinc-700"
                            />
                        </div>

                        {/* API Key */}
                        <div className="space-y-4">
                            <label className="flex items-center gap-2 text-[11px] font-black text-cyan-100/50 uppercase tracking-[0.2em]">
                                <Key size={12} />
                                {t("ai.api_key")}
                            </label>
                            <input
                                type="password"
                                value={aiConfig.apiKey}
                                onChange={(e) => setAIConfig({ apiKey: e.target.value })}
                                placeholder="sk-..."
                                className="w-full bg-black/40 border border-white/10 px-5 py-3 text-sm font-mono text-white focus:border-cyan-500/50 outline-none transition-all placeholder:text-zinc-700 font-password"
                            />
                        </div>

                        {/* Model */}
                        <div className="space-y-4">
                            <label className="flex items-center gap-2 text-[11px] font-black text-cyan-100/50 uppercase tracking-[0.2em]">
                                <Cpu size={12} />
                                {t("ai.model")}
                            </label>
                            <input
                                type="text"
                                value={aiConfig.model}
                                onChange={(e) => setAIConfig({ model: e.target.value })}
                                placeholder="gpt-4o / claude-3-opus"
                                className="w-full bg-black/40 border border-white/10 px-5 py-3 text-sm font-mono text-white focus:border-cyan-500/50 outline-none transition-all placeholder:text-zinc-700"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-8 py-6 bg-white/2 border-t border-white/5 flex justify-end">
                        <button
                            onClick={() => setIsAISettingsModalOpen(false)}
                            className="px-8 py-3 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[12px] font-black uppercase tracking-[0.2em] hover:bg-cyan-500/20 transition-all shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                        >
                            {t("ai.save_config")}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
