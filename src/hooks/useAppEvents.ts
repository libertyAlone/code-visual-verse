import { useEffect } from "react";
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
            const nextIndex = (tourIndex + 1) % directories.length;
            const target = directories[nextIndex];
            setTourIndex(nextIndex);
            setFocusTarget(target.path);
            handleSelectNode(target);
        };

        if (focusTarget === null) {
            runTourStep();
        }

        const timer = setInterval(runTourStep, 15000);
        return () => clearInterval(timer);
    }, [isTouring, nodes, tourIndex, focusTarget, setTourIndex, setFocusTarget, handleSelectNode]);
};
