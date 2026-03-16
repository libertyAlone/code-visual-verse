import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

export interface GitLog {
    hash: string;
    author: string;
    date: string;
    message: string;
    branches?: string;
}

export interface BlameMetadata {
    hash: string;
    author: string;
    date: string;
}

export const useGitInfo = (path: string) => {
    const [logs, setLogs] = useState<GitLog[]>([]);
    const [blameData, setBlameData] = useState<BlameMetadata[]>([]);
    const [diff, setDiff] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [gitLogs, blameInfo] = await Promise.all([
                    invoke<GitLog[]>("get_git_log", { path }),
                    invoke<string>("get_git_blame", { path })
                ]);
                setLogs(gitLogs);

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
                console.error("Failed to fetch git info:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [path]);

    const showDiff = async (hash: string) => {
        try {
            const diffInfo = await invoke<string>("get_git_diff", { path, hash });
            setDiff(diffInfo);
        } catch (err) {
            console.error("Failed to fetch diff:", err);
        }
    };

    return { logs, blameData, diff, loading, setDiff, showDiff };
};
