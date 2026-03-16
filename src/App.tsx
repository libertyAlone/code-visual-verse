import { useState } from "react";
import { Universe } from "./components/universe/Universe";
import { Share2 } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { PlanetDetail } from "./components/universe/PlanetDetail";
import { WelcomeHUD } from "./components/universe/WelcomeHUD";
import { Sidebar } from "./components/ui/Sidebar";
import { ControlPanel } from "./components/ui/ControlPanel";
import { TourHUD } from "./components/ui/TourHUD";
import { LoadingOverlay } from "./components/ui/LoadingOverlay";
import { useStore } from "./store/useStore";
import { useProject } from "./hooks/useProject";
import { useAppEvents } from "./hooks/useAppEvents";

import { useTranslation } from "react-i18next";

function App() {
  const { t } = useTranslation();
  const [resetCounter, setResetCounter] = useState(0);
  const { handleSelectNode } = useProject();
  
  // Register global events and tour logic
  useAppEvents();

  const {
    nodes,
    loading,
    selectedNode,
    showDetail,
    focusTarget,
    maxDepth,
    projectPath,
    dirColors,
    setShowDetail,
    setFocusTarget,
    setDirColors,
  } = useStore();

  return (
    <div className="flex w-full h-screen bg-[#020208] text-zinc-100 selection:bg-cyan-500/30 overflow-hidden font-sans">
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

      <Sidebar />

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
                className="w-2.5 h-2.5 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.2)]" 
                style={{ backgroundColor: item.color }} 
              />
              <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] group-hover:text-cyan-400 transition-colors">
                {item.name}
              </span>
            </button>
          ))}
        </div>

        <ControlPanel onReset={() => setResetCounter((curr) => curr + 1)} />
        <TourHUD />
        <LoadingOverlay />

        <div className="absolute bottom-10 right-10 pointer-events-none text-right">
          <Share2 className="text-white/5 mb-2 float-right" size={32} />
          <p className="text-[8px] font-mono text-white/5 uppercase tracking-[0.4em] clear-both">
            {t("detail.protocol_label")} v0.1.0<br />
            {t("detail.system_status")}: {t("detail.status")}
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
