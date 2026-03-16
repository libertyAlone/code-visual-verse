import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useStore } from "../../store/useStore";

export const TourHUD = () => {
    const { t } = useTranslation();
    const { isTouring, selectedNode } = useStore();

    if (!isTouring || !selectedNode) return null;

    return (
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-10 left-1/2 -translate-x-1/2 px-8 py-4 bg-cyan-950/40 border-y border-cyan-500/30 backdrop-blur-2xl flex flex-col items-center min-w-[320px] shadow-[0_0_50px_rgba(6,182,212,0.15)] z-30 pointer-events-none"
        >
            <div className="flex items-center gap-3 mb-1">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.4em]">{t("universe.autopilot")}</span>
            </div>
            
            <div className="flex flex-col items-center">
                <span className="text-white font-mono text-xs opacity-40 mb-1">{t("universe.scanning")}</span>
                <span className="text-xl font-bold text-white tracking-widest uppercase truncate max-w-[280px]">
                    {selectedNode.name}
                </span>
            </div>

            <div className="w-full h-px bg-linear-to-r from-transparent via-cyan-500/40 to-transparent mt-4" />
            
            <div className="flex gap-2 mt-3">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="w-4 h-0.5 bg-cyan-500/20 overflow-hidden">
                        <motion.div 
                            className="w-full h-full bg-cyan-400"
                            animate={{ x: ["-100%", "100%"] }}
                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                        />
                    </div>
                ))}
            </div>
        </motion.div>
    );
};
