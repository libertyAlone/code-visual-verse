import { useEffect, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import { useTranslation } from "react-i18next";
import { useStore } from "../store/useStore";
import { useProject } from "./useProject";

export const useAppEvents = () => {
    const { i18n } = useTranslation();
    const { handleSelectNode } = useProject();
    const { 
        isTouring, 
        nodes, 
        tourIndex, 
        focusTarget, 
        setTourIndex, 
        setFocusTarget,
        setIsMobile
    } = useStore();

    const lastTourStepRef = useRef<number>(0);

    // Language Sync
    useEffect(() => {
        const unlisten = listen<string>("change-lang", (event) => {
            i18n.changeLanguage(event.payload);
        });
        return () => {
            unlisten.then((f) => f());
        };
    }, [i18n]);

    // Responsive Layout Detection
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, [setIsMobile]);

    // Tour Cycle
    useEffect(() => {
        if (!isTouring) {
            if (focusTarget !== null) setFocusTarget(null);
            return;
        }
        if (nodes.length === 0) return;

        const directories = nodes.filter(n => n.is_dir);
        if (directories.length === 0) return;

        const runTourStep = () => {
            const now = Date.now();
            if (now - lastTourStepRef.current < 2000) return; 
            lastTourStepRef.current = now;

            // Strict Filter: Only rendered nodes
            const renderedNodes = nodes.filter(n => !n.is_dir);
            
            if (renderedNodes.length === 0) return;

            // Pick high complexity or interesting candidates that are actually in the rendered list
            const candidates = renderedNodes.filter(n => (n.complexity || 0) > 5 || n.commit_count && n.commit_count > 0);
            const tourPool = candidates.length > 5 ? candidates : renderedNodes;

            const nextIndex = (tourIndex + 1) % tourPool.length;
            const target = tourPool[nextIndex];

            if (target) {
                setTourIndex(nextIndex);
                // Ensure we use the exact path the layout engine expects
                setFocusTarget(target.path);
                handleSelectNode(target);
            }
        };

        let timeout: any;
        if (focusTarget === null) {
            timeout = setTimeout(runTourStep, 4000); 
        }

        const timer = setInterval(runTourStep, 12000);
        return () => {
            clearInterval(timer);
            if (timeout) clearTimeout(timeout);
        };
    }, [isTouring, nodes, tourIndex, focusTarget, setTourIndex, setFocusTarget, handleSelectNode]);
};
