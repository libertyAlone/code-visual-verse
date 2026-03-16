import { Play, Pause, Home } from "lucide-react";
import { useStore } from "../../store/useStore";
import { useTranslation } from "react-i18next";

interface ControlPanelProps {
    onReset: () => void;
}

export const ControlPanel = ({ onReset }: ControlPanelProps) => {
    const { t } = useTranslation();
    const { isTouring, setIsTouring, setTourIndex } = useStore();

    return (
        <div className="absolute top-10 right-10 flex flex-col gap-4 items-end z-30">
            <button
                onClick={() => {
                    setIsTouring(!isTouring);
                    if (!isTouring) setTourIndex(0);
                }}
                className={`group w-14 h-14 backdrop-blur-xl border flex flex-col items-center justify-center gap-1 transition-all shadow-2xl active:scale-90 ${isTouring ? 'bg-cyan-500/20 border-cyan-500/50' : 'bg-[#05060f]/80 border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/10'}`}
            >
                {isTouring ? (
                    <Pause size={20} className="text-cyan-400" />
                ) : (
                    <Play size={20} className="text-zinc-400 group-hover:text-cyan-400 transition-colors" />
                )}
                <span className={`text-[8px] font-black uppercase tracking-widest ${isTouring ? 'text-cyan-400' : 'text-zinc-500 group-hover:text-cyan-500/80'}`}>
                    {isTouring ? t("universe.touring") : t("universe.tour")}
                </span>
            </button>

            <button
                onClick={onReset}
                className="group w-14 h-14 bg-[#05060f]/80 backdrop-blur-xl border border-white/10 flex flex-col items-center justify-center gap-1 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-all shadow-2xl active:scale-90"
            >
                <Home
                    size={20}
                    className="text-zinc-400 group-hover:text-cyan-400 transition-colors"
                />
                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-cyan-500/80">
                    {t("app.returnHome")}
                </span>
            </button>
        </div>
    );
};
