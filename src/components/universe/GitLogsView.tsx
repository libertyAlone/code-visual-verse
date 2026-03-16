import { GitLog } from "../../hooks/useGitInfo";
import { GitBranch, History } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

interface GitLogsViewProps {
    logs: GitLog[];
    hoveredHash: string | null;
    setHoveredHash: (hash: string | null) => void;
    showDiff: (hash: string) => void;
}

export const GitLogsView = ({
    logs,
    hoveredHash,
    setHoveredHash,
    showDiff
}: GitLogsViewProps) => {
    const { t } = useTranslation();

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-10 py-6 border-b border-white/5 bg-white/2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <History size={16} className="text-cyan-400" />
                    <h3 className="text-xs font-black text-white uppercase tracking-[0.4em]">{t('detail.gitLog')}</h3>
                </div>
                <span className="text-[10px] font-mono text-zinc-500 bg-black/40 px-2 py-0.5 border border-white/5">{logs.length}</span>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                {logs.length > 0 ? logs.map((log, i) => (
                    <motion.div
                        key={log.hash}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => showDiff(log.hash)}
                        onMouseEnter={() => setHoveredHash(log.hash)}
                        onMouseLeave={() => setHoveredHash(null)}
                        className={`px-5 py-4 border transition-all cursor-pointer group ${
                            hoveredHash && (log.hash.startsWith(hoveredHash) || hoveredHash.startsWith(log.hash))
                            ? "border-cyan-500 bg-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.2)]"
                            : "bg-white/2 border-white/5 hover:border-cyan-500/30 hover:bg-cyan-500/5"
                        }`}
                    >
                        <div className="flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                     <span className="text-[10px] font-mono text-cyan-500 font-bold group-hover:text-cyan-400">
#{log.hash.substring(0, 8)}</span>
                                    {log.branches && (
                                         <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-cyan-500/10 border border-cyan-500/20 text-[8px] text-cyan-400/70 font-bold max-w-[140px]">
                                            <GitBranch size={10} />
                                            <span className="truncate uppercase tracking-wider">{log.branches.replace(/[()]/g, '')}</span>
                                        </div>
                                    )}
                                </div>
                                <span className="text-[10px] text-zinc-600 font-mono italic">{log.date}</span>
                            </div>
                             <p className="text-[10px] text-zinc-300 font-medium line-clamp-2 leading-relaxed group-hover:text-cyan-50 transition-colors">
                                {log.message}
                            </p>
                            <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                 <span className="text-zinc-500 text-[9px] font-mono uppercase tracking-[0.2em]">{log.author}</span>
                                <div className="w-1.5 h-1.5 bg-cyan-600/50" />
                            </div>
                        </div>
                    </motion.div>
                )) : (
                    <div className="p-20 border-2 border-dashed border-white/10 text-[18px] text-zinc-700 text-center font-mono uppercase tracking-[0.5em]">
                        {t('detail.noRepo')}
                    </div>
                )}
            </div>
        </div>
    );
};
