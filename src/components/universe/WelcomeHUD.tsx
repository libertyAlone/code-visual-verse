import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Rocket, MousePointer2, Move, ZoomIn, Info, ShieldCheck, Zap, Layers } from "lucide-react";

export const WelcomeHUD = () => {
  const { t } = useTranslation();

  const features = [
    { icon: <Layers size={18} />, text: t('app.welcome.feature.mapping') },
    { icon: <Zap size={18} />, text: t('app.welcome.feature.telemetry') },
    { icon: <ShieldCheck size={18} />, text: t('app.welcome.feature.navigation') },
  ];

  const controls = [
    { icon: <MousePointer2 size={16} />, label: t('app.welcome.controls.rotate'), key: t('welcome.controls.rotate_key') },
    { icon: <Move size={16} />, label: t('app.welcome.controls.pan'), key: t('welcome.controls.pan_key') },
    { icon: <ZoomIn size={16} />, label: t('app.welcome.controls.zoom'), key: t('welcome.controls.zoom_key') },
    { icon: <Rocket size={16} />, label: t('app.welcome.controls.select'), key: t('welcome.controls.select_key') },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl w-full p-12 bg-black/60 backdrop-blur-3xl border border-white/10 relative overflow-hidden"
    >
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[100px] -mr-32 -mt-32 rounded-full" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 blur-[100px] -ml-32 -mb-32 rounded-full" />

      <div className="relative z-10 space-y-10">
        {/* Header */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-mono tracking-[0.3em] uppercase mb-4"
          >
            <Info size={12} />
            {t("welcome.guide_ready")}
          </motion.div>
          
          <h1 className="text-5xl font-black text-white tracking-tighter italic">
            {t('app.welcome.title')}
          </h1>
          <p className="text-zinc-500 font-mono text-sm tracking-widest uppercase">
            {t('app.welcome.subtitle')}
          </p>
        </div>

        {/* Features list */}
        <div className="grid gap-4">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="flex items-start gap-4 p-4 bg-white/5 border border-white/5 hover:border-cyan-500/30 transition-colors group"
            >
              <div className="text-cyan-500 mt-1 transition-transform group-hover:scale-110">{f.icon}</div>
              <p className="text-zinc-400 text-sm leading-relaxed">{f.text}</p>
            </motion.div>
          ))}
        </div>

        {/* Interaction Guide */}
        <div className="space-y-6 pt-6 border-t border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] font-mono">
              {t('app.welcome.controls.title')}
            </h2>
            <div className="h-px flex-1 bg-white/5 mx-4" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {controls.map((c, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center gap-2 text-zinc-500">
                  {c.icon}
                  <span className="text-[10px] uppercase tracking-wider">{c.label}</span>
                </div>
                <div className="text-[11px] font-mono text-cyan-400/80 bg-cyan-500/5 py-1 px-2 border border-cyan-500/10 inline-block">
                  {c.key}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Prompt */}
        <div className="text-center pt-4">
          <div className="text-[11px] font-mono text-cyan-500 animate-pulse tracking-[0.4em] uppercase">
            {t('app.welcome.import_guide')}
          </div>
        </div>
      </div>

      {/* Side corner accents */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500/40" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-500/40" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-500/40" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500/40" />
    </motion.div>
  );
};
