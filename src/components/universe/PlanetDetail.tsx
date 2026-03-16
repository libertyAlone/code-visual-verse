import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Code2, Cpu, History, GitBranch, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Node {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
  functions?: string[];
  imports?: string[];
  complexity?: number;
  sector?: string;
  color?: string;
}

interface GitLog {
  hash: string;
  author: string;
  date: string;
  message: string;
  branches?: string;
}

interface BlameMetadata {
  hash: string;
  author: string;
  date: string;
}

interface PlanetDetailProps {
  node: Node;
  allNodes: Node[];
  onBack: () => void;
  onJump: (node: Node) => void;
}

export const PlanetDetail = ({ node, allNodes, onBack, onJump }: PlanetDetailProps) => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<GitLog[]>([]);
  const [blameData, setBlameData] = useState<BlameMetadata[]>([]);
  const [sourceCode, setSourceCode] = useState<string>("");
  const [diff, setDiff] = useState<string | null>(null);
  const [hoveredHash, setHoveredHash] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gitLogs, blameInfo, content] = await Promise.all([
          invoke<GitLog[]>("get_git_log", { path: node.path }),
          invoke<string>("get_git_blame", { path: node.path }),
          invoke<string>("read_file", { path: node.path })
        ]);
        setLogs(gitLogs);
        setSourceCode(content);

        // Parse blame lines into metadata objects
        const lines = blameInfo.split('\n');
        const parsedBlame = lines.map(line => {
          const metaEndIndex = line.indexOf(') ');
          if (metaEndIndex !== -1) {
            const meta = line.substring(0, metaEndIndex);
            const parts = meta.split(/\s+/);
            const hash = parts[0].replace('^', '');
            const dateMatch = meta.match(/\d{4}-\d{2}-\d{2}/);
            const date = dateMatch ? dateMatch[0] : "";
            const authorStartIndex = hash.length + 2; 
            const dateIndex = meta.indexOf(date);
            const author = meta.substring(authorStartIndex, dateIndex).trim();
            return { hash, author, date };
          }
          return null;
        }).filter((b): b is BlameMetadata => b !== null);
        setBlameData(parsedBlame);

      } catch (err) {
        console.error("Failed to fetch node info:", err);
      }
    };
    fetchData();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onBack();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [node.path, onBack]);

  const showDiff = async (hash: string) => {
    try {
      const diffInfo = await invoke<string>("get_git_diff", { path: node.path, hash });
      setDiff(diffInfo);
    } catch (err) {
      console.error("Failed to fetch diff:", err);
    }
  };

  const getLanguage = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts': case 'tsx': return 'typescript';
      case 'js': case 'jsx': return 'javascript';
      case 'rs': return 'rust';
      case 'py': return 'python';
      case 'go': return 'go';
      case 'css': return 'css';
      case 'html': return 'html';
      case 'json': return 'json';
      default: return 'text';
    }
  };

  // Recursive function to render token nodes
  const renderTokenNode = (node: any, stylesheet: any, key: number): React.ReactNode => {
    if (node.type === 'text') {
      const text = node.value;
      const cleanText = text.trim().replace(/['"`;]/g, '').replace(/^[.\\/]+/, '');
      
      // Look for a node that matches the text as a filename or partial path
      const jumpTarget = allNodes.find(n => 
        !n.is_dir && (n.name === cleanText || n.name.split('.')[0] === cleanText || n.path.endsWith(cleanText))
      );

      if (jumpTarget && jumpTarget.path !== node.path) {
        return (
          <span 
            key={key}
            className="cursor-pointer text-cyan-300 underline decoration-cyan-500/40 hover:text-cyan-100 hover:decoration-cyan-400 transition-all italic"
            onClick={() => onJump(jumpTarget)}
            title={t("detail.jumpTo", { name: jumpTarget.name })}
          >
            {text}
          </span>
        );
      }
      return text;
    }
    if (node.tagName) {
      const Tag = node.tagName;
      const classNames = node.properties?.className || [];
      // Merge all styles from the stylesheet that match the classes
      const style = classNames.reduce((acc: any, cn: string) => {
        const s = stylesheet[cn];
        return s ? { ...acc, ...s } : acc;
      }, {});
      
      return (
        <Tag key={key} style={style}>
          {node.children.map((child: any, i: number) => renderTokenNode(child, stylesheet, i))}
        </Tag>
      );
    }
    return null;
  };

  // Custom renderer to combine blame and code
  const customRenderer = ({ rows, stylesheet }: any) => {
    return rows.map((row: any, i: number) => {
      const blame = blameData[i] || { hash: '...', author: '...', date: '...' };
      const isHovered = hoveredHash && (blame.hash.startsWith(hoveredHash) || hoveredHash.startsWith(blame.hash));

      return (
        <div 
          key={i} 
          className={`group flex min-h-[22px] border-b border-transparent transition-colors ${isHovered ? 'bg-cyan-500/10 border-white/5' : 'hover:bg-white/3'}`}
          onMouseEnter={() => setHoveredHash(blame.hash)}
          onMouseLeave={() => setHoveredHash(null)}
        >
          {/* Blame Gutter */}
          <div className="flex shrink-0 font-mono text-[9px] border-r border-white/5 bg-black/20 select-none">
            <div className="w-8 flex items-center justify-center text-zinc-700 border-r border-white/5">{i + 1}</div>
            <div 
                className={`w-[80px] flex items-center px-3 cursor-pointer transition-colors ${isHovered ? 'text-cyan-400 font-bold' : 'text-zinc-600'}`}
                onClick={() => blame.hash !== '...' && showDiff(blame.hash)}
            >
                {blame.hash.substring(0, 8)}
            </div>
            <div className="w-[100px] flex items-center px-3 text-zinc-500 truncate">{blame.author}</div>
            <div className="w-[80px] flex items-center px-3 text-zinc-700 truncate">{blame.date}</div>
          </div>

          {/* Code Content */}
          <div className="px-6 py-0.5 flex-1 overflow-hidden">
             {row.children.map((child: any, j: number) => renderTokenNode(child, stylesheet, j))}
          </div>
        </div>
      );
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="absolute inset-0 z-50 bg-[#020208] flex overflow-hidden font-sans"
    >
      {/* Side Profile Bar */}
      <div className="w-[440px] h-full border-r border-white/10 bg-black/90 flex flex-col relative z-20 shrink-0">
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pt-10 space-y-6">
          <button 
            onClick={onBack}
            className="group flex items-center gap-3 text-zinc-500 hover:text-white transition-colors"
          >
            <div className="w-10 h-10 border border-white/10 flex items-center justify-center group-hover:border-cyan-500/50 group-hover:bg-cyan-500/10 transition-all">
              <ArrowLeft size={20} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.4em] font-mono">{t('detail.depart')}</span>
          </button>

          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
               <div className="w-2.5 h-2.5 bg-cyan-500 animate-pulse shadow-[0_0_12px_rgba(6,182,212,0.8)]" />
                <span className="text-[10px] font-black text-cyan-500/90 uppercase tracking-[0.5em] font-mono">{t('detail.celestialIntel')}</span>
            </div>
             <h1 className="text-[22px] font-black text-white tracking-tighter leading-tight break-all border-l-3 border-cyan-500 pl-5 bg-linear-to-r from-cyan-500/10 to-transparent italic">
              {node.name}
            </h1>
            
            {node.sector && (
              <div className="flex items-center gap-2 pl-5">
                <div className="w-1 h-3" style={{ backgroundColor: node.color || '#fff' }} />
                <span className="text-[10px] font-mono tracking-widest opacity-80" style={{ color: node.color || '#fff' }}>
                  SECTOR: {node.sector === 'root' ? 'ROOT' : node.sector}
                </span>
              </div>
            )}
          </div>

          {/* Git Log Section */}
          <div className="space-y-4 pt-4 pb-32">
             <div className="flex items-center gap-2.5 text-zinc-400 border-b border-white/10 pb-2">
                <History size={18} />
                 <h3 className="text-[8px] font-black uppercase tracking-[0.4em]">{t('detail.gitLog')}</h3>
             </div>
             <div className="space-y-3">
                {logs.length > 0 ? logs.map((log, i) => (
                    <motion.div 
                        key={log.hash} 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => showDiff(log.hash)}
                        className={`px-5 py-4 border transition-all cursor-pointer group ${
                            hoveredHash && (log.hash.startsWith(hoveredHash) || hoveredHash.startsWith(log.hash))
                            ? "border-cyan-500 bg-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.2)]" 
                            : "bg-white/2 border-white/5 hover:border-cyan-500/30 hover:bg-cyan-500/5"
                        }`}
                    >
                        <div className="flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                     <span className="text-[10px] font-mono text-cyan-500 font-bold group-hover:text-cyan-400">#{log.hash.substring(0, 8)}</span>
                                    {log.branches && (
                                         <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-cyan-500/10 border border-cyan-500/20 text-[8px] text-cyan-400/70 font-bold max-w-[140px]">
                                            <GitBranch size={10} />
                                            <span className="truncate uppercase tracking-wider">{log.branches}</span>
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
        </div>

        <div className="p-8 border-t border-white/10 bg-black/80 backdrop-blur-3xl shrink-0 pl-12">
            <div className="flex items-center gap-3 italic">
                <Cpu size={20} className="text-cyan-500/50" />
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.6em]">{t('detail.integratedArchive')}</span>
            </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 h-full overflow-hidden flex flex-col bg-[#050510]">
        {/* Header Ribbon */}
        <div className="h-16 border-b border-white/10 flex items-center justify-between px-10 bg-black/40 shrink-0">
            <div className="flex items-center gap-10">
                <div className="flex flex-col">
                    <span className="text-[8px] font-black text-cyan-500 uppercase tracking-[0.3em]">{t('detail.telemetry')}</span>
                    <span className="text-[10px] font-mono text-zinc-400">{node.path}</span>
                </div>
            </div>
            <div className="flex gap-8">
                <div className="text-right">
                    <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">{t('detail.logicClusters')}</span>
                    <p className="text-base font-mono text-white leading-none">{node.functions?.length || 0}</p>
                </div>
                <div className="text-right">
                    <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">{t('detail.synchronization')}</span>
                    <p className="text-base font-mono text-cyan-500 leading-none">100%</p>
                </div>
            </div>
        </div>

        {/* Unified Code & Blame View */}
        <div className="flex-1 flex overflow-hidden relative">
            {/* Scanline FX */}
            <div className="absolute inset-0 pointer-events-none opacity-5 bg-size-[100%_2px,3px_100%] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,118,0.06))] z-10" />
            
            <div className="flex-1 overflow-auto custom-scrollbar bg-[#0a0a1f]/30">
                <SyntaxHighlighter
                    language={getLanguage(node.name)}
                    style={vscDarkPlus}
                    customStyle={{
                        background: 'transparent',
                        padding: 0,
                        margin: 0,
                        fontSize: '13px',
                        lineHeight: '1.6',
                        minWidth: '100%'
                    }}
                    renderer={customRenderer}
                >
                    {sourceCode}
                </SyntaxHighlighter>
                
                {sourceCode === "" && (
                    <div className="h-full flex flex-col items-center justify-center gap-6 opacity-20 pt-40">
                        <Code2 size={48} />
                        <span className="text-[13px] uppercase tracking-[0.3em] font-black">{t('detail.initBuffer')}</span>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Diff Modal */}
      <AnimatePresence>
        {diff && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-100 bg-black/90 backdrop-blur-md flex items-center justify-center p-20"
            >
                <div className="w-full h-full bg-[#0a0a1a] border border-white/10 flex flex-col">
                    <div className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-black/40">
                        <div className="flex items-center gap-4">
                            <GitBranch className="text-cyan-500" />
                            <span className="text-sm font-black uppercase tracking-widest">{t('detail.commitDiff')}</span>
                        </div>
                        <button 
                            onClick={() => setDiff(null)}
                            className="w-10 h-10 border border-white/10 flex items-center justify-center hover:bg-red-500/20 hover:border-red-500/50 transition-all text-zinc-400 hover:text-white"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-auto p-10 font-mono text-xs leading-relaxed custom-scrollbar bg-black/40">
                        <pre className="whitespace-pre">
                            {diff.split('\n').map((line, i) => {
                                let color = "text-zinc-400";
                                if (line.startsWith('+') && !line.startsWith('+++')) color = "text-emerald-400 bg-emerald-500/5";
                                if (line.startsWith('-') && !line.startsWith('---')) color = "text-rose-400 bg-rose-500/5";
                                if (line.startsWith('@@')) color = "text-cyan-400 bg-cyan-500/5";
                                return (
                                    <div key={i} className={`${color} px-2`}>{line}</div>
                                );
                            })}
                        </pre>
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
