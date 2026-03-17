import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Clock, GitCommit, ChevronLeft, ChevronRight, Calendar, Play, Pause, RotateCcw } from "lucide-react";
import { useStore } from "../../store/useStore";
import { invoke } from "@tauri-apps/api/core";

export const Timeline = () => {
    const { t } = useTranslation();
    const { 
        projectPath, 
        globalCommits, 
        setGlobalCommits, 
        selectedCommitHash, 
        setSelectedCommitHash 
    } = useStore();
    
    const [isPlaying, setIsPlaying] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const playTimerRef = useRef<any>(null);

    useEffect(() => {
        if (projectPath) {
            invoke<any[]>("get_project_git_history", { path: projectPath })
                .then(res => setGlobalCommits(res.reverse()))
                .catch(err => console.error("History fetch failed:", err));
        }
    }, [projectPath, setGlobalCommits]);

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (globalCommits.length === 0) return;
            const currentIndex = globalCommits.findIndex(c => c.hash === selectedCommitHash);
            
            if (e.key === 'ArrowRight') {
                const nextIndex = Math.min(currentIndex + 1, globalCommits.length - 1);
                setSelectedCommitHash(globalCommits[nextIndex].hash);
            } else if (e.key === 'ArrowLeft') {
                const prevIndex = Math.max(currentIndex - 1, 0);
                setSelectedCommitHash(globalCommits[prevIndex].hash);
            } else if (e.key === ' ') {
                setIsPlaying(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [globalCommits, selectedCommitHash, setSelectedCommitHash]);

    // Auto Play Logic
    useEffect(() => {
        if (isPlaying) {
            playTimerRef.current = setInterval(() => {
                const currentIndex = globalCommits.findIndex(c => c.hash === selectedCommitHash);
                if (currentIndex === -1 || currentIndex === globalCommits.length - 1) {
                    setSelectedCommitHash(globalCommits[0].hash);
                } else {
                    setSelectedCommitHash(globalCommits[currentIndex + 1].hash);
                }
            }, 1000);
        } else {
            if (playTimerRef.current) clearInterval(playTimerRef.current);
        }
        return () => { if (playTimerRef.current) clearInterval(playTimerRef.current); };
    }, [isPlaying, globalCommits, selectedCommitHash, setSelectedCommitHash]);

    if (!projectPath || globalCommits.length === 0) return null;

    const formatDate = (unix: string) => {
        const d = new Date(parseInt(unix) * 1000);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 h-24 bg-black/60 backdrop-blur-2xl border-t border-white/5 z-40 flex items-center px-8 gap-6 group">
            <div className="flex flex-col gap-1 shrink-0">
                <div className="flex items-center gap-2 text-cyan-400">
                    <Clock size={14} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t("timeline.title")}</span>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        className={`p-1.5 rounded-full transition-all ${isPlaying ? 'bg-cyan-500 text-black' : 'bg-white/5 text-white hover:bg-white/10'}`}
                    >
                        {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                    </button>
                    <button 
                        onClick={() => { setSelectedCommitHash(null); setIsPlaying(false); }}
                        className="p-1.5 rounded-full bg-white/5 text-white hover:bg-white/10 transition-all"
                        title={t("timeline.reset")}
                    >
                        <RotateCcw size={14} />
                    </button>
                    <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest hidden lg:block">
                        {selectedCommitHash ? t("timeline.telemetry") : t("timeline.idle")}
                    </div>
                </div>
            </div>

            <div className="h-10 w-px bg-white/10 mx-2" />

            <div 
                ref={scrollRef}
                className="flex-1 flex items-center gap-4 overflow-x-auto custom-scrollbar-h pb-2 h-full"
            >
                {globalCommits.map((commit, i) => {
                    const isSelected = selectedCommitHash === commit.hash;
                    return (
                        <motion.button
                            key={commit.hash}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.01 }}
                            onClick={() => setSelectedCommitHash(isSelected ? null : commit.hash)}
                            className={`relative shrink-0 flex flex-col items-start gap-1 p-3 border transition-all ${
                                isSelected 
                                ? "bg-cyan-500/20 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.15)]" 
                                : "bg-white/2 border-white/5 hover:border-white/20"
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <GitCommit size={12} className={isSelected ? "text-cyan-400" : "text-zinc-600"} />
                                <span className={`text-[10px] font-mono ${isSelected ? "text-cyan-300" : "text-zinc-400"}`}>
                                    {commit.hash.substring(0, 7)}
                                </span>
                            </div>
                            <div className="text-[11px] font-bold text-white truncate max-w-[150px] text-left">
                                {commit.message}
                            </div>
                            <div className="flex items-center gap-2 opacity-50">
                                <Calendar size={10} />
                                <span className="text-[9px] font-mono">{formatDate(commit.date)}</span>
                            </div>

                            {isSelected && (
                                <motion.div 
                                    layoutId="commit-active"
                                    className="absolute -top-1 left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_10px_#22d3ee]"
                                />
                            )}
                        </motion.button>
                    );
                })}
            </div>

            <div className="hidden md:flex items-center gap-2 shrink-0 ml-4">
                <button 
                   onClick={() => scrollRef.current?.scrollBy({ left: -300, behavior: 'smooth' })}
                   className="p-2 bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                >
                    <ChevronLeft size={16} />
                </button>
                <button 
                   onClick={() => scrollRef.current?.scrollBy({ left: 300, behavior: 'smooth' })}
                   className="p-2 bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
};
