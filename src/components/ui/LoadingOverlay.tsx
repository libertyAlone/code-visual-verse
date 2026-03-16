import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "../../store/useStore";
import { useTranslation } from "react-i18next";
import { Rocket } from "lucide-react";

export const LoadingOverlay = () => {
    const { t } = useTranslation();
    const { loading } = useStore();

    return (
        <AnimatePresence>
            {loading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-[#020208]/90 backdrop-blur-xl"
                >
                    <div className="relative w-32 h-32 mb-8">
                        {/* Outer rotating ring */}
                        <motion.div 
                            className="absolute inset-0 border-2 border-cyan-500/20 rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        />
                        {/* Inner pulsing glow */}
                        <motion.div 
                            className="absolute inset-4 bg-cyan-500/10 rounded-full blur-xl"
                            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                        {/* Center icon */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Rocket className="text-cyan-400 w-10 h-10" />
                        </div>
                        
                        {/* Scanning beam */}
                        <motion.div 
                            className="absolute top-0 left-1/2 w-1 h-full bg-linear-to-b from-transparent via-cyan-400 to-transparent"
                            animate={{ left: ["0%", "100%", "0%"] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        />
                    </div>

                    <div className="flex flex-col items-center gap-2">
                        <motion.span 
                            className="text-white text-sm font-black uppercase tracking-[0.5em] animate-pulse"
                        >
                            {t("app.importing") || "Initializing Scan"}
                        </motion.span>
                        <div className="flex gap-1">
                            {[...Array(3)].map((_, i) => (
                                <motion.div 
                                    key={i}
                                    className="w-1.5 h-1.5 bg-cyan-500 rounded-full"
                                    animate={{ opacity: [0.2, 1, 0.2] }}
                                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Background data particles */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                        <div className="absolute inset-0 grid grid-cols-6 gap-4 p-8">
                            {[...Array(24)].map((_, i) => (
                                <motion.div 
                                    key={i}
                                    className="text-[8px] font-mono text-cyan-700 truncate"
                                    initial={{ y: "100%" }}
                                    animate={{ y: "-100%" }}
                                    transition={{ duration: 5 + Math.random() * 5, repeat: Infinity, ease: "linear", delay: Math.random() * 5 }}
                                >
                                    0101010111001010101...
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
