import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { listen } from "@tauri-apps/api/event";
import { Universe } from "./components/universe/Universe";
import {
  FolderOpen,
  Rocket,
  Cpu,
  Zap,
  Database,
  ChevronRight,
  Box,
  Activity,
  Share2,
  ZoomIn,
  Home,
  Search,
  HelpCircle,
  Settings,
  X,
  Play,
  Pause,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { processFile } from "./lib/ast-processor";
import { PlanetDetail } from "./components/universe/PlanetDetail";
import { WelcomeHUD } from "./components/universe/WelcomeHUD";
import { useTranslation } from "react-i18next";

interface ProjectFile {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
  functions?: string[];
  imports?: string[];
  complexity?: number;
  created_at: number;
  modified_at: number;
  sector?: string;
  color?: string;
  commit_count?: number;
  has_readme?: boolean;
}

function App() {
  const { t, i18n } = useTranslation();
  const [nodes, setNodes] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<ProjectFile | null>(null);
  const [onlySrc, setOnlySrc] = useState(true);
  const [showDetail, setShowDetail] = useState(false);
  const [resetCounter, setResetCounter] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProjectFile[]>([]);
  const [focusTarget, setFocusTarget] = useState<string | null>(null);
  const [activeSearchIndex, setActiveSearchIndex] = useState(-1);
  const [maxDepth, setMaxDepth] = useState(2);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeHelp, setActiveHelp] = useState<{
    title: string;
    content: string;
  } | null>(null);
  const [projectPath, setProjectPath] = useState<string | null>(null);
  const [dirColors, setDirColors] = useState<{ name: string, color: string, path: string }[]>([]);
  const [isTouring, setIsTouring] = useState(false);
  const [tourIndex, setTourIndex] = useState(0);

  const formatDate = (timestamp: number) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp * 1000).toLocaleString();
  };

  useEffect(() => {
    const unlisten = listen<string>("change-lang", (event) => {
      i18n.changeLanguage(event.payload);
    });
    return () => {
      unlisten.then((f) => f());
    };
  }, [i18n]);

  useEffect(() => {
    if (!isTouring || nodes.length === 0) return;

    const directories = nodes.filter(n => n.is_dir);
    if (directories.length === 0) return;

    const runTourStep = () => {
      const nextIndex = (tourIndex + 1) % directories.length;
      const target = directories[nextIndex];
      setTourIndex(nextIndex);
      setFocusTarget(target.path);
      handleSelectNode(target); // Auto-select for more UI feedback
    };

    // Immediate first step if we just started
    if (focusTarget === null) {
      runTourStep();
    }

    const timer = setInterval(runTourStep, 15000); // Settle down the pace for observation
    return () => clearInterval(timer);
  }, [isTouring, nodes, tourIndex, focusTarget]);

  const handleImport = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
      });

      if (selected) {
        setProjectPath(selected as string);
        setLoading(true);
        setNodes([]); // Clear previous nodes
        try {
          const files: ProjectFile[] = await invoke("scan_project", {
            path: selected,
            onlySrc,
            maxDepth,
          });

          // Validate files is an array
          if (!Array.isArray(files)) {
            console.error("Invalid response from scan_project:", files);
            setLoading(false);
            return;
          }

          const uniqueFilesMap = new Map();
          files.forEach((f) => {
            if (f && f.path) {
              uniqueFilesMap.set(f.path, f);
            }
          });
          const uniqueFiles = Array.from(uniqueFilesMap.values());

          // If no files found, just set empty nodes
          if (uniqueFiles.length === 0) {
            setNodes([]);
            setLoading(false);
            return;
          }

          const enrichedFiles = [...uniqueFiles];
          const sourceFiles = uniqueFiles.filter(
            (f) =>
              !f.is_dir &&
              ["ts", "tsx", "js", "jsx"].some((ext) =>
                f.name.toLowerCase().endsWith(ext),
              ),
          );

          // Only process first 30 source files to avoid performance issues
          const subset = sourceFiles.slice(0, 30);
          const batchSize = 5;
          for (let i = 0; i < subset.length; i += batchSize) {
            const batch = subset.slice(i, i + batchSize);
            await Promise.all(
              batch.map(async (file) => {
                try {
                  const content: string = await invoke("read_file", {
                    path: file.path,
                  });
                  const analysis = processFile(content, file.name);
                  const idx = enrichedFiles.findIndex(
                    (f) => f.path === file.path,
                  );
                  if (idx !== -1) {
                    enrichedFiles[idx] = { ...enrichedFiles[idx], ...analysis };
                  }
                } catch (e) {
                  console.warn(`Skip parsing ${file.name}:`, e);
                }
              }),
            );
          }

          setNodes(enrichedFiles);
        } catch (error) {
          console.error("Import failed:", error);
          // Show error but don't crash
          setNodes([]);
        } finally {
          setLoading(false);
        }
      }
    } catch (e) {
      console.error("Import dialog failed:", e);
      setLoading(false);
    }
  };

  const handleSelectNode = async (node: ProjectFile | any) => {
    if (node.is_dir) return;

    if (node.functions) {
      setSelectedNode(node);
      return;
    }

    const isSourceFile = ["ts", "tsx", "js", "jsx", "rs", "py", "go"].some(
      (ext) => node.name.toLowerCase().endsWith(ext),
    );
    if (!isSourceFile) {
      setSelectedNode(node);
      return;
    }

    try {
      const content: string = await invoke("read_file", { path: node.path });
      const result = processFile(content, node.name);

      const updatedNode = {
        ...node,
        ...result,
      };

      setNodes((prev: ProjectFile[]) =>
        prev.map((n) => (n.path === node.path ? updatedNode : n)),
      );
      setSelectedNode(updatedNode);
    } catch (e) {
      console.error("Failed to parse file:", e);
      setSelectedNode(node);
    }
  };

  return (
    <div className="flex w-full h-screen bg-[#020208] text-zinc-100 selection:bg-cyan-500/30 overflow-hidden font-sans">
      <AnimatePresence>
        {activeHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-8"
            onClick={() => setActiveHelp(null)}
          >
            <div
              className="bg-[#0a0c1a] border border-cyan-500/30 p-8 max-w-md relative shadow-[0_0_50px_rgba(6,182,212,0.1)]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setActiveHelp(null)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              <div className="flex items-center gap-3 mb-4">
                <HelpCircle size={20} className="text-cyan-400" />
                <h4 className="text-sm font-black uppercase tracking-widest text-cyan-400">
                  {activeHelp.title}
                </h4>
              </div>
              <p className="text-xs leading-relaxed text-zinc-400 font-mono italic">
                {activeHelp.content}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDetail && selectedNode && (
          <PlanetDetail
            node={selectedNode}
            allNodes={nodes as any}
            onBack={() => setShowDetail(false)}
            onJump={(target) => {
              setShowDetail(false);
              handleSelectNode(target);
              setFocusTarget(target.path);
            }}
          />
        )}
      </AnimatePresence>

      {/* Sidebar HUD - Left Side */}
      <div className="w-[440px] pl-3! h-full flex flex-col border-r border-white/10 bg-[#060712] relative z-20 shadow-[40px_0_80px_rgba(0,0,0,0.8)]">
        {/* Header Section */}
        <div className="px-8 py-5 border-b border-white/5 bg-linear-to-b from-white/2 to-transparent space-y-5 relative z-30">
          <div className="flex flex-row items-center justify-between gap-6">
            <div className="flex flex-row items-center gap-6">
              <div className="shrink-0 w-12 h-12 bg-linear-to-br from-cyan-500/20 to-blue-600/20 border border-white/10 flex items-center justify-center shadow-lg">
                <Rocket className="text-cyan-400" size={20} />
              </div>
              <div>
                <h1 className="text-lg font-black text-white tracking-[0.2em] uppercase leading-none">
                  {t("app.title")}
                </h1>
                <p className="text-[9px] font-bold text-cyan-500/60 uppercase tracking-widest mt-1">
                  {t("app.subtitle")}
                </p>
              </div>
            </div>

            <div className="relative">
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
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
                      <label className="flex justify-between items-center text-[9px] font-black text-zinc-300 uppercase tracking-[0.2em]">
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
                          onChange={(e) =>
                            setMaxDepth(parseInt(e.target.value))
                          }
                          className="w-full h-1 bg-white/5 appearance-none cursor-pointer accent-cyan-500"
                        />
                        <div className="flex justify-between mt-2 text-[8px] font-mono text-zinc-500 uppercase tracking-widest">
                          <span>Lv.1</span>
                          <span>Lv.5</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/5">
                      <button 
                        onClick={() => i18n.changeLanguage(i18n.language === 'zh' ? 'en' : 'zh')}
                        className="w-full text-left text-[10px] font-black text-zinc-400 hover:text-white transition-colors flex justify-between items-center uppercase tracking-[0.3em]"
                      >
                        {t("settings.lang")}
                        <span className="text-cyan-400 bg-cyan-500/10 px-2 py-0.5 border border-cyan-500/20 text-[9px]">
                          {i18n.language === "zh" ? "中文" : "ENG"}
                        </span>
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
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-300 group-hover:text-white transition-colors flex-1 text-left">
                  {t("app.scan")}
                </span>
                <ChevronRight
                  size={14}
                  className="text-zinc-500 group-hover:text-cyan-400 transition-all group-hover:translate-x-1"
                />
              </div>
              <div className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-cyan-500/50 to-transparent translate-y-full group-hover:translate-y-0 transition-transform" />
            </button>

            <div 
              onClick={() => setOnlySrc(!onlySrc)}
              className="flex items-center gap-4 p-3.5 bg-white/2 border border-white/5 group hover:border-cyan-500/30 transition-all cursor-pointer"
            >
              <div className={`shrink-0 w-8 h-8 flex items-center justify-center border transition-all ${onlySrc ? 'bg-cyan-500/20 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'bg-white/5 border-white/10'}`}>
                <div className={`w-2 h-2 transition-transform duration-300 ${onlySrc ? 'bg-cyan-400 scale-100' : 'bg-transparent scale-0'}`} />
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest group-hover:text-white transition-colors">
                  {t("app.onlySrc")}
                </span>
                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-tighter truncate opacity-60">
                  Filter primary source artifacts only
                </span>
              </div>
            </div>

            {nodes.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-white/5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 bg-white/2 border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                      <FolderOpen size={20} />
                    </div>
                    <p className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">
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
                    <p className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">
                      {t("summary.planets")}
                    </p>
                    <p className="text-xl font-mono text-cyan-400 tracking-widest leading-none">
                      {nodes.filter(n => !n.is_dir).length}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-1.5 opacity-80 mt-1">
                  <div className="flex items-center justify-between px-3 py-2 bg-white/2 border border-white/5 hover:bg-white/5 transition-colors group">
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-red-500/40 shadow-[0_0_8px_rgba(239,68,68,0.2)]" />
                       <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest leading-none group-hover:text-zinc-400">{t("summary.largePlanets")}</span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-300 leading-none">{nodes.filter(n => !n.is_dir && n.size > 50 * 1024).length}</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 bg-white/2 border border-white/5 hover:bg-white/5 transition-colors group">
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.2)]" />
                       <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest leading-none group-hover:text-zinc-400">{t("summary.mediumPlanets")}</span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-300 leading-none">{nodes.filter(n => !n.is_dir && n.size <= 50 * 1024 && n.size >= 10 * 1024).length}</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 bg-white/2 border border-white/5 hover:bg-white/5 transition-colors group">
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-zinc-500/40 shadow-[0_0_8px_rgba(113,113,122,0.2)]" />
                       <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest leading-none group-hover:text-zinc-400">{t("summary.smallPlanets")}</span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-300 leading-none">{nodes.filter(n => !n.is_dir && n.size < 10 * 1024).length}</span>
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
                    onChange={(e) => {
                      const q = e.target.value;
                      setSearchQuery(q);
                      if (q.length > 1) {
                        const filtered = nodes
                          .filter(
                            (n) =>
                              !n.is_dir &&
                              n.name.toLowerCase().includes(q.toLowerCase()),
                          );
                        setSearchResults(filtered);
                        setActiveSearchIndex(0);
                      } else {
                        setSearchResults([]);
                        setActiveSearchIndex(-1);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        setActiveSearchIndex(
                          (prev) => (prev + 1) % searchResults.length,
                        );
                      } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        setActiveSearchIndex(
                          (prev) =>
                            (prev - 1 + searchResults.length) %
                            searchResults.length,
                        );
                      } else if (e.key === "Enter" && searchResults.length > 0) {
                        const target =
                          activeSearchIndex >= 0
                            ? searchResults[activeSearchIndex]
                            : searchResults[0];
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
                          <span className="text-[9px] font-mono text-zinc-400 truncate group-hover:text-cyan-400/70 transition-colors">
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
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] leading-relaxed max-w-[200px]">
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
                        <span className="text-[9px] uppercase font-black tracking-[0.3em] text-cyan-400/90">
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
                                className="text-[9px] font-mono font-bold tracking-[0.2em] uppercase"
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
                        <span className="px-3.5 py-1.5 bg-white/5 border border-white/10 text-[9px] font-black tracking-widest text-zinc-300 uppercase">
                          {selectedNode.is_dir
                            ? t("node.starSystem")
                            : t("node.planet")}
                        </span>
                      </div>
                    </div>

                    {!selectedNode.is_dir && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 bg-white/3 border border-white/5">
                          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                            <Zap size={12} className="text-amber-500/50" />{" "}
                            {t("node.mass")}
                          </p>
                          <p className="text-base font-mono text-white tracking-tighter">
                            {(selectedNode.size / 1024).toFixed(2)}{" "}
                            <span className="text-[9px] text-zinc-500 font-bold">
                              KB
                            </span>
                          </p>
                        </div>
                        <div className="p-4 bg-white/3 border border-white/5">
                          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2 mb-2">
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
                          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                            {t("node.coordinates")}
                          </p>
                          <div className="w-1 h-3 bg-cyan-500/30 group-hover:bg-cyan-500 transition-colors" />
                        </div>
                        <p className="text-[10px] font-mono text-white/90 break-all leading-relaxed pr-8">
                          {selectedNode.path}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white/3 border border-white/5">
                          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">
                            {t("node.createdTime")}
                          </p>
                          <p className="text-[10px] font-mono text-zinc-300">
                            {formatDate(selectedNode.created_at)}
                          </p>
                        </div>
                        <div className="p-4 bg-white/3 border border-white/5">
                          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">
                            {t("node.modifiedTime")}
                          </p>
                          <p className="text-[10px] font-mono text-zinc-300">
                            {formatDate(selectedNode.modified_at)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {selectedNode.functions && selectedNode.functions.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center mb-1.5">
                          <h4 className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                            {t("node.emissions")}
                          </h4>
                          <span className="text-[8px] font-mono text-cyan-500 bg-cyan-500/10 px-2 py-0.5">
                            {selectedNode.functions.length} {t("node.detected")}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 gap-1">
                          {selectedNode.functions.map((fn: string, i: number) => (
                            <div
                              key={i}
                              className="flex items-center justify-between p-3.5 bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all cursor-pointer group"
                            >
                              <span className="text-[10px] font-mono text-zinc-300 truncate pr-4 group-hover:text-cyan-400 transition-colors">
                                {fn}()
                              </span>
                              <ChevronRight
                                size={12}
                                className="text-zinc-600 shrink-0 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedNode.imports && selectedNode.imports.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center mb-1.5">
                          <h4 className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                            {t("node.linkages")}
                          </h4>
                          <span className="text-[8px] font-mono text-purple-500 bg-purple-500/10 px-2 py-0.5">
                            {selectedNode.imports.length} {t("node.connections")}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedNode.imports.map((imp: string, i: number) => (
                            <span
                              key={i}
                              className="px-3 py-1.5 bg-white/5 border border-white/5 text-[9px] font-mono text-zinc-400 hover:text-cyan-400 transition-colors cursor-default"
                            >
                              {imp.split("/").pop()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
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
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                  {t("app.syncTime")}
                </span>
              </div>
              <span className="text-[9px] font-mono text-zinc-600 bg-zinc-950 px-2 py-1 border border-white/5">
                {nodes.length} {t("app.celestials")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main 3D Universe - Right Side */}
      <div className="flex-1 h-full relative">
        <div className="w-full h-full relative">
          <Universe
            nodes={nodes as any}
            selectedPath={selectedNode?.path ?? null}
            onSelect={handleSelectNode as any}
            resetCounter={resetCounter}
            focusTarget={focusTarget}
            onFocusComplete={() => setFocusTarget(null)}
            maxDepth={maxDepth}
            projectPath={projectPath}
            onDirectoryColors={setDirColors}
          />
          
          <AnimatePresence>
            {nodes.length === 0 && !loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#010103]/40 z-10 pointer-events-none">
                <div className="pointer-events-auto">
                    <WelcomeHUD />
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Directory Color Legend */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-wrap justify-center gap-4 bg-black/40 backdrop-blur-md px-6 py-3 border border-white/5 pointer-events-auto max-w-[80vw]">
          {dirColors.map((item, i) => (
            <button 
              key={i} 
              onClick={() => setFocusTarget(item.path)}
              className="flex items-center gap-2 group cursor-pointer border-none bg-transparent outline-none"
            >
              <div 
                className="w-2.5 h-2.5 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] transition-transform group-hover:scale-125" 
                style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}44` }} 
              />
              <span className="text-[9px] font-mono text-zinc-400 tracking-widest whitespace-nowrap group-hover:text-white transition-colors">
                {item.name}
              </span>
            </button>
          ))}
        </div>

        {/* Global Control Overlays */}
        <div className="absolute top-10 right-10 flex flex-col gap-4 items-end">
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
            onClick={() => setResetCounter((curr) => curr + 1)}
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

        {/* Universe Overlay Elements */}
        {isTouring && selectedNode && (
           <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-10 left-1/2 -translate-x-1/2 px-8 py-4 bg-cyan-950/40 border-y border-cyan-500/30 backdrop-blur-2xl flex flex-col items-center min-w-[320px] shadow-[0_0_50px_rgba(6,182,212,0.15)]"
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

              <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent mt-4" />
              
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
        )}

        <div className="absolute bottom-10 right-10 pointer-events-none text-right">
          <Share2
            className="text-white/20 mb-2 inline-block animate-pulse"
            size={40}
          />
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.4em]">
            {t("node.linkages")}
          </p>
        </div>
      </div>

      {/* Cinematic Overlays */}
      <AnimatePresence>
        {loading && projectPath && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 flex items-center justify-center bg-[#020208]/90 backdrop-blur-3xl"
          >
            <div className="flex flex-col items-center gap-10">
              <div className="relative">
                <div className="w-48 h-48 border border-cyan-500/10 rounded-full animate-[ping_2s_infinite]" />
                <div className="absolute inset-0 w-48 h-48 border-[3px] border-cyan-500 border-t-transparent rounded-full animate-spin" />
                <Rocket
                  className="absolute inset-0 m-auto text-cyan-400"
                  size={48}
                />
              </div>
              <div className="text-center space-y-6">
                <h2 className="text-5xl font-black tracking-[0.8em] text-white uppercase ml-8">
                  {t("loading.sync")}
                </h2>
                <div className="flex flex-col items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                  <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.5em]">
                    {t("loading.constructing")}
                  </p>
                </div>
                <p className="text-[9px] text-zinc-700 font-mono uppercase tracking-[0.3em] animate-pulse">
                  {t("loading.scanning")}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
