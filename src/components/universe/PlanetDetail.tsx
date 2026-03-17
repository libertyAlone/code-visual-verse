import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Cpu, X, GitBranch } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useGitInfo } from "../../hooks/useGitInfo";
import { CodeViewer } from "./CodeViewer";
import { GitLogsView } from "./GitLogsView";
import { ProjectFile } from "../../store/useStore";

interface PlanetDetailProps {
  node: ProjectFile;
  allNodes: ProjectFile[];
  onBack: () => void;
  onJump: (node: ProjectFile) => void;
}

export const PlanetDetail = ({ node, allNodes, onBack, onJump }: PlanetDetailProps) => {
  const { t } = useTranslation();
  const [sourceCode, setSourceCode] = useState<string>("");
  const [hoveredHash, setHoveredHash] = useState<string | null>(null);
  
  const { logs, blameData, diff, setDiff, showDiff } = useGitInfo(node.path);

  useEffect(() => {
    const fetchCode = async () => {
      try {
        const content = await invoke<string>("read_file", { path: node.path });
        setSourceCode(content);
      } catch (err) {
        console.error("Failed to fetch source code:", err);
      }
    };
    fetchCode();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onBack();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [node.path, onBack]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex bg-[#020208]/80 backdrop-blur-xl overflow-hidden pointer-events-auto"
    >
      {/* Sidebar - History (Left Side) */}
      <div className="w-[420px] h-full flex flex-col border-r border-white/10 bg-black/60 backdrop-blur-3xl shrink-0">
        <div className="h-20 shrink-0 border-b border-white/10 flex items-center px-10 gap-4">
          <button 
            onClick={onBack}
            className="group flex items-center gap-3 text-zinc-500 hover:text-white transition-all px-4 py-2 border border-white/5 hover:border-cyan-500/50 hover:bg-cyan-500/5"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[12px] font-black uppercase tracking-[0.4em]">{t("detail.back")}</span>
          </button>
        </div>

        <div className="p-8 border-b border-white/10 flex flex-col gap-2">
            <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
                <h2 className="text-xl font-bold tracking-tight text-white uppercase">{node.name}</h2>
            </div>
            <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest truncate">{node.path}</span>
        </div>

        <GitLogsView 
            logs={logs}
            hoveredHash={hoveredHash}
            setHoveredHash={setHoveredHash}
            showDiff={showDiff}
        />

        <div className="p-8 border-t border-white/10 bg-black/80 backdrop-blur-3xl shrink-0 pl-12">
            <div className="flex items-center gap-3 italic">
                <Cpu size={20} className="text-cyan-500/50" />
                <span className="text-[12px] font-mono text-zinc-500 uppercase tracking-[0.6em]">{t('detail.integratedArchive')}</span>
            </div>
        </div>
      </div>

      {/* Main Content Area (Right Side) */}
      <div className="flex-1 h-full overflow-hidden flex flex-col bg-[#050510]">
        {/* Header Ribbon */}
        <div className="h-16 border-b border-white/10 flex items-center justify-between px-10 bg-black/40 shrink-0">
            <div className="flex items-center gap-10">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.3em]">{t('detail.telemetry')}</span>
                    <span className="text-[12px] font-mono text-zinc-400">{node.path}</span>
                </div>
            </div>
            <div className="flex gap-8">
                <div className="text-right">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('detail.logicClusters')}</span>
                    <p className="text-base font-mono text-white leading-none">{node.functions?.length || 0}</p>
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('detail.synchronization')}</span>
                    <p className="text-base font-mono text-cyan-500 leading-none">100%</p>
                </div>
            </div>
        </div>

        {/* Unified Code & Blame View */}
        <div className="flex-1 flex overflow-hidden relative">
            <CodeViewer 
                node={node}
                sourceCode={sourceCode}
                blameData={blameData}
                allNodes={allNodes}
                onJump={onJump}
                showDiff={showDiff}
                hoveredHash={hoveredHash}
                setHoveredHash={setHoveredHash}
            />
        </div>
      </div>

      {/* Diff Result Overlay */}
      <AnimatePresence>
            {diff && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-100 bg-black/90 backdrop-blur-md flex items-center justify-center p-20"
                >
                    <div className="w-full h-full bg-[#0a0a1a] border border-white/10 flex flex-col shadow-[0_50px_100px_rgba(0,0,0,0.9)]">
                        <div className="h-16 shrink-0 border-b border-white/10 flex items-center justify-between px-8 bg-black/40">
                            <div className="flex items-center gap-4">
                                <GitBranch size={16} className="text-cyan-400" />
                                <span className="text-xs font-black uppercase tracking-[0.2em] text-white">{t("detail.commitDiff")}</span>
                            </div>
                            <button 
                                onClick={() => setDiff(null)}
                                className="w-10 h-10 border border-white/10 flex items-center justify-center hover:bg-red-500/20 hover:border-red-500/50 transition-all text-zinc-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-10 font-mono text-xs whitespace-pre custom-scrollbar bg-black/40">
                           {diff.split('\n').map((line, i) => {
                               let color = "text-zinc-400";
                               if (line.startsWith('+') && !line.startsWith('+++')) color = "text-emerald-400 bg-emerald-500/5";
                               if (line.startsWith('-') && !line.startsWith('---')) color = "text-rose-400 bg-rose-500/5";    
                               if (line.startsWith('@@')) color = "text-cyan-400 bg-cyan-500/5";
                               return (
                                   <div key={i} className={`${color} px-2`}>{line}</div>
                               );
                           })}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </motion.div>
  );
};
