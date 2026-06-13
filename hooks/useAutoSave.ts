import { useState, useEffect, useRef } from 'react';
import { ProjectData } from '../types';
import localforage from 'localforage';

const STORAGE_KEY = 'epub_maker_project_v1';
const BACKUP_KEY = 'epub_maker_project_backup';
const DEBOUNCE_TIME = 2000; // 增加到 2 秒，减少频繁保存

export const useAutoSave = (project: ProjectData, isLoaded: boolean, initialEnabled: boolean = true) => {
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
    const [autoSaveEnabled, setAutoSaveEnabled] = useState(initialEnabled);

    // Track previous project string to avoid saving if not changed
    const lastSavedProjectStrRef = useRef<string>('');
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isSavingRef = useRef(false); // 防止并发保存

    useEffect(() => {
        if (isLoaded && autoSaveEnabled) {
            const currentProjectStr = JSON.stringify(project);

            // Skip save if nothing actually changed
            if (currentProjectStr === lastSavedProjectStrRef.current) {
                return;
            }

            // 清除之前的定时器
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }

            setSaveStatus('saving');

            saveTimeoutRef.current = setTimeout(async () => {
                // 防止并发保存
                if (isSavingRef.current) {
                    return;
                }

                isSavingRef.current = true;

                try {
                    // 先备份当前数据（如果存在）
                    const existingData = await localforage.getItem(STORAGE_KEY);
                    if (existingData) {
                        await localforage.setItem(BACKUP_KEY, existingData);
                    }

                    // 保存新数据
                    await localforage.setItem(STORAGE_KEY, project);
                    lastSavedProjectStrRef.current = currentProjectStr;
                    setSaveStatus('saved');

                    console.log('✅ 自动保存成功', new Date().toLocaleTimeString());
                } catch (e: any) {
                    console.error("❌ 保存失败:", e);
                    setSaveStatus('error');

                    // 处理存储空间不足
                    if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                        const shouldExport = window.confirm(
                            "⚠️ 存储空间不足！\n\n" +
                            "项目内容已超过浏览器存储限制。\n\n" +
                            "建议立即导出 EPUB 文件保存您的工作。\n\n" +
                            "点击「确定」关闭自动保存，点击「取消」继续尝试。"
                        );

                        if (shouldExport) {
                            setAutoSaveEnabled(false);
                            alert("💡 提示：请点击左侧菜单的「导出 EPUB」按钮保存您的作品。");
                        }
                    } else {
                        // 其他错误，尝试恢复备份
                        console.warn("尝试恢复备份数据...");
                        try {
                            const backupData = await localforage.getItem(BACKUP_KEY);
                            if (backupData) {
                                await localforage.setItem(STORAGE_KEY, backupData);
                                console.log("✅ 已恢复备份数据");
                            }
                        } catch (restoreErr) {
                            console.error("恢复备份失败:", restoreErr);
                        }
                    }
                } finally {
                    isSavingRef.current = false;
                }
            }, DEBOUNCE_TIME);

            return () => {
                if (saveTimeoutRef.current) {
                    clearTimeout(saveTimeoutRef.current);
                }
            };
        }
    }, [project, isLoaded, autoSaveEnabled]);

    const toggleAutoSave = () => {
        setAutoSaveEnabled(prev => !prev);
    };

    const clearStorage = async () => {
        setAutoSaveEnabled(false);
        try {
            await localforage.removeItem(STORAGE_KEY);
            await localforage.removeItem(BACKUP_KEY);
            console.log("✅ 已清除所有存储数据");
        } catch (e) {
            console.error("清除存储失败:", e);
        }
    };

    return { saveStatus, autoSaveEnabled, toggleAutoSave, clearStorage };
};