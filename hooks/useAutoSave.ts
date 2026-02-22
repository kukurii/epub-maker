import { useState, useEffect, useRef } from 'react';
import { ProjectData } from '../types';
import localforage from 'localforage';

const STORAGE_KEY = 'epub_maker_project_v1';

export const useAutoSave = (project: ProjectData, isLoaded: boolean, initialEnabled: boolean = true) => {
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
    const [autoSaveEnabled, setAutoSaveEnabled] = useState(initialEnabled);

    // Track previous project string to avoid saving if not changed
    const lastSavedProjectStrRef = useRef<string>('');

    useEffect(() => {
        if (isLoaded && autoSaveEnabled) {
            const currentProjectStr = JSON.stringify(project);

            // Skip save if nothing actually changed
            if (currentProjectStr === lastSavedProjectStrRef.current) {
                return;
            }

            setSaveStatus('saving');
            const timeoutId = setTimeout(async () => {
                try {
                    // Now we pass the object directly, localforage handles serialization efficiently via IndexedDB
                    await localforage.setItem(STORAGE_KEY, project);
                    lastSavedProjectStrRef.current = currentProjectStr;
                    setSaveStatus('saved');
                } catch (e: any) {
                    console.error("Save failed in IndexedDB", e);
                    setSaveStatus('error');

                    // IndexedDB theoretically has much higher limits, but we should still catch quotas
                    if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                        alert("⚠️ 存储空间不足！\n\n项目内容已超过浏览器 IndexedDB 存储限制，请清理空间或导出。");
                        setAutoSaveEnabled(false);
                    }
                }
            }, 1000); // 1 second debounce

            return () => clearTimeout(timeoutId);
        }
    }, [project, isLoaded, autoSaveEnabled]);

    const toggleAutoSave = () => {
        setAutoSaveEnabled(prev => !prev);
    };

    const clearStorage = async () => {
        setAutoSaveEnabled(false);
        try {
            await localforage.removeItem(STORAGE_KEY);
        } catch (e) {
            console.error("Failed to clear storage:", e);
        }
    };

    return { saveStatus, autoSaveEnabled, toggleAutoSave, clearStorage };
};