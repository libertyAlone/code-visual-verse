import React from "react";
import { useTranslation } from "react-i18next";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ProjectFile } from "../../store/useStore";
import { BlameMetadata } from "../../hooks/useGitInfo";
import { Code2 } from "lucide-react";

interface CodeViewerProps {
    node: ProjectFile;
    sourceCode: string;
    blameData: BlameMetadata[];
    allNodes: ProjectFile[];
    onJump: (node: ProjectFile) => void;
    showDiff: (hash: string) => void;
    hoveredHash: string | null;
    setHoveredHash: (hash: string | null) => void;
    targetFunction?: string;
}

export const CodeViewer = ({
    node,
    sourceCode,
    blameData,
    allNodes,
    onJump,
    showDiff,
    hoveredHash,
    setHoveredHash,
    targetFunction
}: CodeViewerProps) => {
    const { t } = useTranslation();
    const jumpRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (targetFunction && jumpRef.current) {
            setTimeout(() => {
                jumpRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 500);
        }
    }, [targetFunction, sourceCode]);

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

    const renderTokenNode = (token: any, stylesheet: any, key: number): React.ReactNode => {
        if (token.type === 'text') {
            const text = token.value;
            const cleanText = text.trim().replace(/['"`;]/g, '').replace(/^[.\\/]+/, '');
            
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
        if (token.tagName) {
            const Tag = token.tagName;
            const classNames = token.properties?.className || [];
            const style = classNames.reduce((acc: any, cn: string) => {
                const s = stylesheet[cn];
                return s ? { ...acc, ...s } : acc;
            }, {});
            
            return (
                <Tag key={key} style={style}>
                    {token.children.map((child: any, i: number) => renderTokenNode(child, stylesheet, i))}
                </Tag>
            );
        }
        return null;
    };

    const hasGit = blameData && blameData.length > 0;

    const customRenderer = ({ rows, stylesheet }: any) => {
        return rows.map((row: any, i: number) => {
            const blame = blameData[i] || { hash: '...', author: '...', date: '...' };
            const isHovered = hoveredHash && (blame.hash.startsWith(hoveredHash) || hoveredHash.startsWith(blame.hash));
            
            // Basic detection for function definition highlight
            const isTargetFunction = targetFunction && row.children.some((child: any) => 
                child.children?.some((grandchild: any) => 
                    grandchild.value === targetFunction || (grandchild.children && grandchild.children.some((g: any) => g.value === targetFunction))
                )
            );

            return (
                <div 
                    key={i} 
                    ref={isTargetFunction ? jumpRef : null}
                    className={`group flex min-h-[22px] border-b border-transparent transition-colors 
                        ${isHovered ? 'bg-cyan-500/15 border-l-2 border-l-cyan-500' : 'hover:bg-white/5'}
                        ${isTargetFunction ? 'bg-yellow-500/20 border-l-2 border-l-yellow-400 ring-1 ring-yellow-500/30 z-10' : ''}
                    `}
                    onMouseEnter={() => setHoveredHash(blame.hash)}
                    onMouseLeave={() => setHoveredHash(null)}
                >
                    {/* Blame Gutter - Only show if we have valid git data */}
                    {hasGit && (
                        <div className="flex shrink-0 font-mono text-[12px] border-r border-white/5 bg-black/20 select-none">
                            <div className="w-10 flex items-center justify-center text-zinc-700 border-r border-white/5 opacity-40">{i + 1}</div>
                            <div 
                                className={`w-[100px] flex items-center px-4 cursor-pointer transition-colors ${isHovered ? 'text-cyan-400 font-bold' : 'text-zinc-600'}`}
                                onClick={() => blame.hash !== '...' && showDiff(blame.hash)}
                            >
                                {blame.hash.substring(0, 8)}
                            </div>
                            <div className="w-[120px] flex items-center px-4 text-zinc-500 truncate">{blame.author}</div>
                            <div className="w-[100px] flex items-center px-4 text-zinc-700 truncate">{blame.date}</div>
                        </div>
                    )}

                    {!hasGit && (
                        <div className="w-12 shrink-0 font-mono text-[11px] border-r border-white/5 bg-black/10 select-none flex items-center justify-center text-zinc-800 opacity-60">
                            {i + 1}
                        </div>
                    )}

                    {/* Code Content */}
                    <div className="px-8 py-0.5 flex-1 overflow-hidden">
                         {row.children.map((child: any, j: number) => renderTokenNode(child, stylesheet, j))}
                    </div>
                </div>
            );
        });
    };

    return (
        <div className="flex-1 overflow-auto custom-scrollbar bg-[#0a0a1f]/30">
            {/* Scanline FX */}
            <div className="absolute inset-0 pointer-events-none opacity-5 bg-size-[100%_2px,3px_100%] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,118,0.06))] z-10" />

            {sourceCode !== "" ? (
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
            ) : (
                <div className="h-full flex flex-col items-center justify-center gap-6 opacity-20 pt-40">
                    <Code2 size={48} />
                    <span className="text-[14px] uppercase tracking-[0.3em] font-black">{t('detail.initBuffer')}</span>    
                </div>
            )}
        </div>
    );
};
