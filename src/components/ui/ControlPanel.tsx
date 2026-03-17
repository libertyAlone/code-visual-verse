import { Play, Pause, Home } from "lucide-react";
import { useStore } from "../../store/useStore";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

interface ControlPanelProps {
    onReset: () => void;
}

export const ControlPanel = ({ onReset }: ControlPanelProps) => {
    const { t } = useTranslation();
    const { 
        isTouring, 
        setIsTouring, 
        setTourIndex, 
        showAllDependencies, 
        setShowAllDependencies,
        isMobile
    } = useStore();

    return (
        <div className={`absolute ${isMobile ? 'top-4 right-4' : 'top-10 right-10'} flex flex-col gap-4 items-end z-30 pointer-events-none transition-all`}>
            {/* Dependency Toggle */}
            {!isMobile && (
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAllDependencies(!showAllDependencies)}
                className={`pointer-events-auto px-4 py-3 border backdrop-blur-xl transition-all flex items-center gap-3 shadow-2xl ${
                    showAllDependencies 
                    ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]" 
                    : "bg-[#05060f]/80 border-white/10 text-white/60 hover:border-cyan-500/50"
                }`}
            >
                <div className={`w-2 h-2 rounded-full ${showAllDependencies ? "bg-cyan-400 animate-pulse" : "bg-white/20"}`} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                    {t("node.linkages")}: {showAllDependencies ? "ACTIVE" : "HIDDEN"}
                </span>
            </motion.button>
            )}

            <div className="flex flex-col gap-4 pointer-events-auto">
                <button
                    onClick={() => {
                        setIsTouring(!isTouring);
                        if (!isTouring) setTourIndex(0);
                    }}
                    className={`group ${isMobile ? 'w-10 h-10' : 'w-14 h-14'} backdrop-blur-xl border flex flex-col items-center justify-center gap-1 transition-all shadow-2xl active:scale-90 ${isTouring ? 'bg-cyan-500/20 border-cyan-500/50' : 'bg-[#05060f]/80 border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/10'}`}
                >
                    {isTouring ? (
                        <Pause size={20} className="text-cyan-400" />
                    ) : (
                        <Play size={20} className="text-zinc-400 group-hover:text-cyan-400 transition-colors" />
                    )}
                    <span className={`text-[8px] font-black uppercase tracking-widest ${isTouring ? 'text-cyan-400' : 'text-zinc-500 group-hover:text-cyan-500/80'} ${isMobile ? 'hidden' : 'block'}`}>
                        {isTouring ? t("universe.touring") : t("universe.tour")}
                    </span>
                </button>

                <button
                    onClick={onReset}
                    className={`group ${isMobile ? 'w-10 h-10' : 'w-14 h-14'} bg-[#05060f]/80 backdrop-blur-xl border border-white/10 flex flex-col items-center justify-center gap-1 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-all shadow-2xl active:scale-90`}
                >
                    <Home
                        size={20}
                        className="text-zinc-400 group-hover:text-cyan-400 transition-colors"
                    />
                    <span className={`text-[8px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-cyan-500/80 ${isMobile ? 'hidden' : 'block'}`}>
                        {t("app.returnHome")}
                    </span>
                </button>
            </div>
        </div>
    );
};
