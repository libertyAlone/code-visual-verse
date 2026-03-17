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
        setFocusTarget 
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

    // Tour Cycle
    useEffect(() => {
        if (!isTouring || nodes.length === 0) return;

        const directories = nodes.filter(n => n.is_dir);
        if (directories.length === 0) return;

        const runTourStep = () => {
            // Rate limit tour steps to prevent stack overflow if camera logic fires too fast
            const now = Date.now();
            if (now - lastTourStepRef.current < 2000) return; 
            lastTourStepRef.current = now;

            const nextIndex = (tourIndex + 1) % directories.length;
            const target = directories[nextIndex];
            setTourIndex(nextIndex);
            setFocusTarget(target.path);
            handleSelectNode(target);
        };

        // If in tour mode and nothing is being focused, start next step after a short delay
        let timeout: any;
        if (focusTarget === null) {
            timeout = setTimeout(runTourStep, 3000); 
        }

        const timer = setInterval(runTourStep, 15000);
        return () => {
            clearInterval(timer);
            if (timeout) clearTimeout(timeout);
        };
    }, [isTouring, nodes, tourIndex, focusTarget, setTourIndex, setFocusTarget, handleSelectNode]);
};
