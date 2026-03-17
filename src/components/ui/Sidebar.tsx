import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Settings, 
    FolderOpen, 
    ChevronRight, 
    Box, 
    Zap, 
    Database, 
    Cpu, 
    ZoomIn, 
    FileText,
    Activity,
    Search,
    Sparkles,
    Compass,
    Thermometer,
    Menu,
    ChevronLeft
} from "lucide-react";
import { Logo } from "./Logo";
import { useStore, ProjectFile } from "../../store/useStore";
import { useProject } from "../../hooks/useProject";

export const Sidebar = () => {
    const { t, i18n } = useTranslation();
    const { handleImport, handleSelectNode } = useProject();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [activeSearchIndex, setActiveSearchIndex] = useState(-1);
    const [searchResults, setSearchResults] = useState<ProjectFile[]>([]);

    const {
        nodes,
        loading,
        selectedNode,
        onlySrc,
        ignoreDotFiles,
        ignoreGitIgnore,
        maxDepth,
        searchQuery,
        setOnlySrc,
        setIgnoreDotFiles,
        setIgnoreGitIgnore,
        setMaxDepth,
        setSearchQuery,
        setShowDetail,
        setFocusTarget,
        setIsAIChatOpen,
        setIsAISettingsModalOpen,
        hoveredSatellite,
        showHeatmap,
        controlMode,
        setShowHeatmap,
        setControlMode,
        performanceMode,
        setPerformanceMode,
        isLowPerformance,
        isMobile,
        sidebarCollapsed,
        setSidebarCollapsed,
    } = useStore();

    useEffect(() => {
        if (isMobile) {
            setSidebarCollapsed(true);
        } else {
            // Restore sidebar when moving back to desktop
            setSidebarCollapsed(false);
        }
    }, [isMobile, setSidebarCollapsed]);

    const formatDate = (timestamp: number) => {
        if (!timestamp) return "N/A";
        return new Date(timestamp * 1000).toLocaleString();
    };

    const handleSearchChange = (q: string) => {
        setSearchQuery(q);
        if (q.length > 1) {
            const filtered = nodes.filter(
                (n) => !n.is_dir && n.name.toLowerCase().includes(q.toLowerCase())
            );
            setSearchResults(filtered);
            setActiveSearchIndex(0);
        } else {
            setSearchResults([]);
            setActiveSearchIndex(-1);
        }
    };

    return (
        <div className={`h-full flex shrink-0 relative z-20 transition-all duration-500 ease-in-out ${sidebarCollapsed ? 'w-0' : 'w-[440px]'}`}>
            {/* Toggle Button - Outside content wrapper to avoid clipping */}
            <button 
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                aria-label={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                className={`absolute top-1/2 -translate-y-1/2 -right-10 w-10 h-20 bg-[#060712] border border-white/10 border-l-0 rounded-r-2xl flex items-center justify-center transition-all hover:bg-cyan-500/10 hover:border-cyan-500/30 group z-50 pointer-events-auto ${sidebarCollapsed ? 'opacity-100' : 'opacity-40 hover:opacity-100'}`}
            >
                {sidebarCollapsed ? (
                    <Menu size={20} className="text-cyan-400 group-hover:scale-110" />
                ) : (
                    <ChevronLeft size={20} className="text-zinc-500 group-hover:text-white" />
                )}
            </button>

            {/* Main Content Area - Fixed width to prevent squishing during transition */}
            <div className={`h-full flex flex-col min-h-0 overflow-hidden border-r border-white/10 bg-[#060712] shadow-[40px_0_80px_rgba(0,0,0,0.8)] transition-all duration-500 w-[440px] ${sidebarCollapsed ? 'w-0 opacity-0' : 'w-[440px] opacity-100'}`}>
                {/* Search / Project Info Section */}
                <div className="px-8 py-6 border-b border-white/5 bg-linear-to-b from-white/2 to-transparent shrink-0">
                    <div className="flex flex-row items-center justify-between gap-6">
                        <div className="flex flex-row items-center gap-6">
                            <div className="shrink-0 w-14 h-14 bg-linear-to-br from-cyan-500/10 to-blue-600/10 border border-white/5 flex items-center justify-center shadow-2xl relative">
                                {/* Decorative Glow */}
                                <div className="absolute inset-0 bg-cyan-500/10 blur-xl rounded-full" />
                                <Logo size={32} className="relative z-10" />
                            </div>
                            <div>
                                <h1 className="text-lg font-black text-white tracking-[0.2em] uppercase leading-none whitespace-nowrap">
                                    {t("app.title")}
                                </h1>
                                <p className="text-[11px] font-bold text-cyan-500/60 uppercase tracking-widest mt-1 whitespace-nowrap">
                                    {t("app.subtitle")}
                                </p>
                            </div>
                        </div>

                        <div className="relative">
                            <button
                                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                                aria-label="Settings"
                                className={`p-2.5 border border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-all ${isSettingsOpen ? "bg-cyan-500/20 border-cyan-500/50" : ""}`}
                            >
                                <Settings
                                    size={16}
                                    className={isSettingsOpen ? "text-cyan-400" : "text-zinc-500"}
                                />
                            </button>

                            <AnimatePresence>
                                {isSettingsOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute top-full right-0 mt-4 w-72 bg-[#0a0c1a] border border-cyan-500/30 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8)] z-50 space-y-6"
                                    >
                                        <h4 className="text-[11px] font-black text-cyan-400 uppercase tracking-[0.4em] mb-4 border-b border-white/5 pb-4">
                                            {t("app.settings")}
                                        </h4>

                                        <div className="space-y-4">
                                            <label className="flex justify-between items-center text-[11px] font-black text-zinc-300 uppercase tracking-[0.2em]">
                                                {t("settings.depth")}
                                                <span className="text-cyan-400 font-mono text-sm">
                                                    {maxDepth}
                                                </span>
                                            </label>
                                            <div className="px-1">
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="5"
                                                    step="1"
                                                    value={maxDepth}
                                                    onChange={(e) => setMaxDepth(parseInt(e.target.value))}
                                                    className="w-full h-1 bg-white/5 appearance-none cursor-pointer accent-cyan-500"
                                                />
                                                <div className="flex justify-between mt-2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                                                    <span>{t("sidebar.level", { level: 1 })}</span>
                                                    <span>{t("sidebar.level", { level: 5 })}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-white/5">
                                            <button 
                                                onClick={() => i18n.changeLanguage(i18n.language === 'zh' ? 'en' : 'zh')}
                                                className="w-full text-left text-[12px] font-black text-zinc-400 hover:text-white transition-colors flex justify-between items-center uppercase tracking-[0.3em]"
                                            >
                                                {t("settings.lang")}
                                                <span className="text-cyan-400 bg-cyan-500/10 px-2 py-0.5 border border-cyan-500/20 text-[12px]">
                                                    {i18n.language === "zh" ? t("settings.zh") : t("settings.en")}
                                                </span>
                                            </button>
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-white/5">
                                            <button 
                                                onClick={() => setShowHeatmap(!showHeatmap)}
                                                className="w-full text-left text-[11px] font-black transiton-all flex justify-between items-center uppercase tracking-[0.2em]"
                                            >
                                                <span className={showHeatmap ? "text-red-400" : "text-zinc-400"}>
                                                    {t("settings.heatmap")}
                                                </span>
                                                <div className={`p-1.5 border ${showHeatmap ? "border-red-500/50 bg-red-500/10 text-red-400" : "border-white/10 text-zinc-600"}`}>
                                                    <Thermometer size={14} />
                                                </div>
                                            </button>

                                            <button 
                                                onClick={() => setControlMode(controlMode === 'manual' ? 'auto' : 'manual')}
                                                className="w-full text-left text-[11px] font-black transiton-all flex justify-between items-center uppercase tracking-[0.2em]"
                                            >
                                                <span className={controlMode === 'manual' ? "text-cyan-400" : "text-zinc-400"}>
                                                    {t("settings.manualPilot")}
                                                </span>
                                                <div className={`p-1.5 border ${controlMode === 'manual' ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-400" : "border-white/10 text-zinc-600"}`}>
                                                    <Compass size={14} />
                                                </div>
                                            </button>

                                            <button 
                                                onClick={() => setPerformanceMode(performanceMode === 'low' ? 'high' : 'low')}
                                                className="w-full text-left text-[11px] font-black transiton-all flex justify-between items-center uppercase tracking-[0.2em]"
                                            >
                                                <span className={isLowPerformance ? "text-yellow-400" : "text-zinc-400"}>
                                                    {isLowPerformance ? t("settings.performanceMode") : t("settings.highQuality")}
                                                </span>
                                                <div className={`p-1.5 border ${isLowPerformance ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400" : "border-white/10 text-zinc-600"}`}>
                                                    <Zap size={14} />
                                                </div>
                                            </button>
                                        </div>

                                        <div className="pt-4 border-t border-white/5">
                                            <button 
                                                onClick={() => setIsAISettingsModalOpen(true)}
                                                className="w-full text-left text-[12px] font-black text-cyan-400 hover:text-white transition-colors flex justify-between items-center uppercase tracking-[0.3em] group/ai"
                                            >
                                                {t("ai.settings_title")}
                                                <div className="flex items-center gap-2">
                                                    <Sparkles size={12} className="text-cyan-500 group-hover/ai:animate-pulse" />
                                                    <ChevronRight size={12} className="text-cyan-700" />
                                                </div>
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Scrollable HUD Content */}
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pt-6 pb-12 space-y-5">
                        <button
                            onClick={handleImport}
                            disabled={loading}
                            className="group relative w-full h-14 bg-white/2 border border-white/10 flex items-center px-5 hover:bg-white/5 transition-all overflow-hidden"
                        >
                            <div className="flex items-center gap-4 relative z-10 w-full">
                                <div className="w-9 h-9 flex items-center justify-center bg-white/5 group-hover:bg-cyan-500/20 transition-colors">
                                    <FolderOpen
                                        className="text-zinc-400 group-hover:text-cyan-400"
                                        size={18}
                                    />
                                </div>
                                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-300 group-hover:text-white transition-colors flex-1 text-left whitespace-nowrap">
                                    {t("app.scan")}
                                </span>
                                <ChevronRight
                                    size={14}
                                    className="text-zinc-500 group-hover:text-cyan-400 transition-all group-hover:translate-x-1"
                                />
                            </div>
                            <div className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-cyan-500/50 to-transparent translate-y-full group-hover:translate-y-0 transition-transform" />
                        </button>

                        <div className="grid grid-cols-1 gap-2">
                            <div 
                                onClick={() => setOnlySrc(!onlySrc)}
                                className="flex items-center gap-4 p-3.5 bg-white/2 border border-white/5 group hover:border-cyan-500/30 transition-all cursor-pointer"
                            >
                                <div className={`shrink-0 w-8 h-8 flex items-center justify-center border transition-all ${onlySrc ? 'bg-cyan-500/20 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'bg-white/5 border-white/10'}`}>
                                    <div className={`w-2 h-2 transition-transform duration-300 ${onlySrc ? 'bg-cyan-400 scale-100' : 'bg-transparent scale-0'}`} />
                                </div>
                                <div className="flex flex-col gap-0.5 min-w-0">
                                    <span className="text-[12px] font-black text-zinc-300 uppercase tracking-widest group-hover:text-white transition-colors whitespace-nowrap">
                                        {t("app.onlySrc")}
                                    </span>
                                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-tighter truncate opacity-60">
                                        {t("sidebar.filter_desc")}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div 
                                    onClick={() => setIgnoreDotFiles(!ignoreDotFiles)}
                                    className="flex items-center gap-3 p-3 bg-white/2 border border-white/5 group hover:border-cyan-500/30 transition-all cursor-pointer"
                                >
                                    <div className={`shrink-0 w-6 h-6 flex items-center justify-center border transition-all ${ignoreDotFiles ? 'bg-cyan-500/20 border-cyan-500/50' : 'bg-white/5 border-white/10'}`}>
                                        <div className={`w-1.5 h-1.5 transition-transform duration-300 ${ignoreDotFiles ? 'bg-cyan-400 scale-100' : 'bg-transparent scale-0'}`} />
                                    </div>
                                    <div className="flex flex-col gap-0 min-w-0">
                                        <span className="text-[11px] font-black text-zinc-300 uppercase tracking-widest group-hover:text-white transition-colors truncate whitespace-nowrap">
                                            {t("app.ignoreDotFiles")}
                                        </span>
                                        <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-tighter truncate opacity-60">
                                            {t("sidebar.ignoreDotFiles_desc")}
                                        </span>
                                    </div>
                                </div>

                                <div 
                                    onClick={() => setIgnoreGitIgnore(!ignoreGitIgnore)}
                                    className="flex items-center gap-3 p-3 bg-white/2 border border-white/5 group hover:border-cyan-500/30 transition-all cursor-pointer"
                                >
                                    <div className={`shrink-0 w-6 h-6 flex items-center justify-center border transition-all ${ignoreGitIgnore ? 'bg-cyan-500/20 border-cyan-500/50' : 'bg-white/5 border-white/10'}`}>
                                        <div className={`w-1.5 h-1.5 transition-transform duration-300 ${ignoreGitIgnore ? 'bg-cyan-400 scale-100' : 'bg-transparent scale-0'}`} />
                                    </div>
                                    <div className="flex flex-col gap-0 min-w-0">
                                        <span className="text-[11px] font-black text-zinc-300 uppercase tracking-widest group-hover:text-white transition-colors truncate whitespace-nowrap">
                                            {t("app.ignoreGitIgnore")}
                                        </span>
                                        <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-tighter truncate opacity-60">
                                            {t("sidebar.ignoreGitIgnore_desc")}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* AI Assistant Button */}
                        {nodes.length > 0 && (
                            <button
                                onClick={() => setIsAIChatOpen(true)}
                                className="group relative w-full h-14 bg-linear-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/30 flex items-center px-5 hover:from-cyan-500/20 hover:to-blue-600/20 transition-all overflow-hidden"
                            >
                                <div className="flex items-center gap-4 relative z-10 w-full">
                                    <div className="w-9 h-9 flex items-center justify-center bg-cyan-500/20 group-hover:bg-cyan-500/40 transition-colors">
                                        <Sparkles
                                            className="text-cyan-400"
                                            size={18}
                                        />
                                    </div>
                                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-100 group-hover:text-white transition-colors flex-1 text-left whitespace-nowrap">
                                        {t("sidebar.ai_assistant")}
                                    </span>
                                    <ChevronRight
                                        size={14}
                                        className="text-cyan-500 group-hover:text-cyan-400 transition-all group-hover:translate-x-1"
                                    />
                                </div>
                                <div className="absolute inset-x-0 bottom-0 h-[2px] bg-linear-to-r from-transparent via-cyan-400 to-transparent" />
                            </button>
                        )}

                        {nodes.length > 0 && (
                            <div className="space-y-3 pt-4 border-t border-white/5">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3.5 bg-white/2 border border-white/5 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <FolderOpen size={20} />
                                        </div>
                                        <p className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2 whitespace-nowrap">
                                            {t("summary.galaxies")}
                                        </p>
                                        <p className="text-xl font-mono text-white tracking-widest leading-none">
                                            {nodes.filter(n => n.is_dir).length}
                                        </p>
                                    </div>
                                    <div className="p-3.5 bg-white/2 border border-white/5 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <Box size={20} />
                                        </div>
                                        <p className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2 whitespace-nowrap">
                                            {t("summary.planets")}
                                        </p>
                                        <p className="text-xl font-mono text-cyan-400 tracking-widest leading-none">
                                            {nodes.filter(n => !n.is_dir).length}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {nodes.length > 0 && (
                            <div className="relative pt-4 border-t border-white/5 mt-2">
                                <div className="relative group">
                                    <input
                                        type="text"
                                        placeholder={t("app.searchPlaceholder")}
                                        value={searchQuery}
                                        onChange={(e) => handleSearchChange(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "ArrowDown") {
                                                e.preventDefault();
                                                setActiveSearchIndex((prev) => (prev + 1) % searchResults.length);
                                            } else if (e.key === "ArrowUp") {
                                                e.preventDefault();
                                                setActiveSearchIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
                                            } else if (e.key === "Enter" && searchResults.length > 0) {
                                                const target = activeSearchIndex >= 0 ? searchResults[activeSearchIndex] : searchResults[0];
                                                handleSelectNode(target);
                                                setFocusTarget(target.path);
                                                setSearchQuery("");
                                                setSearchResults([]);
                                                setActiveSearchIndex(-1);
                                            }
                                        }}
                                        className="w-full bg-black border border-white/10 px-5 py-3.5 text-[11px] font-mono text-white placeholder:text-zinc-600 focus:border-cyan-500/50 outline-none transition-all shadow-2xl focus:bg-[#08091a]"
                                    />
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-cyan-500 transition-colors">
                                        <Search size={16} />
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {searchResults.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute top-full left-0 right-0 mt-2 bg-[#0a0c1a] border border-cyan-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-50 overflow-y-auto max-h-[400px] custom-scrollbar"
                                        >
                                            {searchResults.map((res, i) => (
                                                <button
                                                    key={res.path}
                                                    onClick={() => {
                                                        handleSelectNode(res);
                                                        setFocusTarget(res.path);
                                                        setSearchQuery("");
                                                        setSearchResults([]);
                                                        setActiveSearchIndex(-1);
                                                    }}
                                                    onMouseEnter={() => setActiveSearchIndex(i)}
                                                    className={`w-full text-left px-4 py-2.5 flex flex-col gap-1 border-b border-white/5 last:border-0 transition-colors group ${activeSearchIndex === i ? "bg-cyan-500/20" : "hover:bg-cyan-500/10"}`}
                                                >
                                                    <span className="text-[11px] font-bold text-white truncate">
                                                        {res.name}
                                                    </span>
                                                    <span className="text-[10px] font-mono text-zinc-400 truncate group-hover:text-cyan-400/70 transition-colors">
                                                        {res.path}
                                                    </span>
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        {/* Dynamic Node Detail Panel */}
                        <AnimatePresence mode="wait">
                            {nodes.length > 0 && (
                                !selectedNode ? (
                                    <motion.div
                                        key="empty"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="pt-10 flex flex-col items-center justify-center text-center space-y-6 opacity-30"
                                    >
                                        <div className="w-20 h-20 border border-dashed border-zinc-700 flex items-center justify-center">
                                            <Box size={32} className="text-zinc-700" />
                                        </div>
                                        <p className="text-[12px] font-bold uppercase tracking-[0.3em] leading-relaxed max-w-[200px]">
                                            {t("app.emptyPrompt")}
                                        </p>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key={selectedNode.path}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="pt-6 space-y-8"
                                    >
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <Cpu className="text-cyan-400/60" size={14} />
                                                <span className="text-[12px] uppercase font-black tracking-[0.3em] text-cyan-400/90">
                                                    {selectedNode.is_dir
                                                        ? t("node.systemCore")
                                                        : t("node.planetaryCore")}
                                                </span>
                                            </div>
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                                                    <h3 className="text-xl font-bold tracking-tighter text-white leading-tight truncate flex items-center gap-2">
                                                        {selectedNode.name}
                                                        {selectedNode.has_readme && <FileText size={14} className="text-cyan-400 animate-pulse" />}
                                                    </h3>
                                                    {selectedNode.sector && (
                                                        <div className="flex items-center gap-2">
                                                            <div 
                                                                className="w-0.5 h-3" 
                                                                style={{ 
                                                                    backgroundColor: selectedNode.color || '#06b6d4' 
                                                                }} 
                                                            />
                                                            <span 
                                                                className="text-[11px] font-mono font-bold tracking-[0.2em] uppercase"
                                                                style={{ 
                                                                    color: selectedNode.color || '#06b6d4' 
                                                                }}
                                                            >
                                                                {t('node.sector')}: {selectedNode.sector}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                {!selectedNode.is_dir && (
                                                    <button
                                                        onClick={() => setShowDetail(true)}
                                                        className="shrink-0 w-11 h-11 border border-cyan-500/30 bg-cyan-500/10 flex items-center justify-center text-cyan-400 hover:bg-cyan-500/20 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(6,182,212,0.1)]"
                                                        title={t("detail.deepScan")}
                                                    >
                                                        <ZoomIn size={18} />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="flex gap-4">
                                                <span className="px-3.5 py-1.5 bg-white/5 border border-white/10 text-[11px] font-black tracking-widest text-zinc-300 uppercase">
                                                    {selectedNode.is_dir
                                                        ? t("node.starSystem")
                                                        : t("node.planet")}
                                                </span>
                                            </div>
                                        </div>

                                        {!selectedNode.is_dir && (
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="p-4 bg-white/3 border border-white/5">
                                                    <p className="text-[12px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                                                        <Zap size={12} className="text-amber-500/50" />{" "}
                                                        {t("node.mass")}
                                                    </p>
                                                    <p className="text-base font-mono text-white tracking-tighter">
                                                        {(selectedNode.size / 1024).toFixed(2)}{" "}
                                                        <span className="text-[11px] text-zinc-500 font-bold">
                                                            KB
                                                        </span>
                                                    </p>
                                                </div>
                                                <div className="p-4 bg-white/3 border border-white/5">
                                                    <p className="text-[12px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                                                        <Database size={12} className="text-purple-500/50" />{" "}
                                                        {t("node.complexity")}
                                                    </p>
                                                    <p className="text-base font-mono text-white tracking-tighter">
                                                        {selectedNode.complexity ?? "N/A"}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="p-4 bg-white/3 border border-white/5 group relative">
                                                <div className="flex justify-between items-start mb-1.5">
                                                    <p className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">
                                                        {t("node.coordinates")}
                                                    </p>
                                                    <div className="w-1 h-3 bg-cyan-500/30 group-hover:bg-cyan-500 transition-colors" />
                                                </div>
                                                <p className="text-[12px] font-mono text-white/90 break-all leading-relaxed pr-8">
                                                    {selectedNode.path}
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-4 bg-white/3 border border-white/5">
                                                    <p className="text-[11px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">
                                                        {t("node.createdTime")}
                                                    </p>
                                                    <p className="text-[12px] font-mono text-zinc-300">
                                                        {formatDate(selectedNode.created_at)}
                                                    </p>
                                                </div>
                                                <div className="p-4 bg-white/3 border border-white/5">
                                                    <p className="text-[11px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">
                                                        {t("node.modifiedTime")}
                                                    </p>
                                                    <p className="text-[12px] font-mono text-zinc-300">
                                                        {formatDate(selectedNode.modified_at)}
                                                    </p>
                                                </div>
                                            </div>

                                            <AnimatePresence>
                                               {hoveredSatellite && (
                                                   <motion.div 
                                                       initial={{ opacity: 0, height: 0 }}
                                                       animate={{ opacity: 1, height: 'auto' }}
                                                       exit={{ opacity: 0, height: 0 }}
                                                       className="p-5 bg-cyan-500/10 border border-cyan-500/30 overflow-hidden shadow-[inset_0_0_20px_rgba(6,182,212,0.1)]"
                                                   >
                                                       <p className="text-[11px] font-black text-cyan-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                                           <Box size={12} className="animate-pulse" />
                                                           {t("node.emissions")}
                                                       </p>
                                                       <p className="text-sm font-bold text-white tracking-normal break-all uppercase leading-relaxed">
                                                           {hoveredSatellite}
                                                       </p>
                                                   </motion.div>
                                               )}
                                            </AnimatePresence>
                                        </div>
                                    </motion.div>
                                )
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Footer HUD */}
                    <div className="px-8 py-4 border-t border-white/5 bg-linear-to-t from-white/2 to-transparent">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Activity size={12} className="text-cyan-500" />
                                <span className="text-[12px] font-mono text-zinc-500 uppercase tracking-widest">
                                    {t("app.syncTime")}
                                </span>
                            </div>
                            <span className="text-[12px] font-mono text-zinc-600 bg-zinc-950 px-2 py-1 border border-white/5">
                                {nodes.length} {t("app.celestials")}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
