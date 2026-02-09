import { useState, useEffect } from 'react';
import { ProjectData } from '../types';

const STORAGE_KEY = 'epub_maker_project_v1';

export const useAutoSave = (project: ProjectData, isLoaded: boolean, initialEnabled: boolean = true) => {
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(initialEnabled);

  useEffect(() => {
    if (isLoaded && autoSaveEnabled) {
      setSaveStatus('saving');
      const timeoutId = setTimeout(() => {
          try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
              setSaveStatus('saved');
          } catch (e: any) {
              console.error("Save failed", e);
              setSaveStatus('error');
              
              // Handle Quota Exceeded specifically
              if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                  alert("⚠️ 存储空间不足！\n\n项目内容（特别是图片）已超过浏览器本地存储限制。\n自动保存已暂停，请删除部分图片或导出项目后再试。");
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

  const clearStorage = () => {
      setAutoSaveEnabled(false);
      try {
          localStorage.removeItem(STORAGE_KEY);
      } catch (e) {
          console.error("Failed to clear storage:", e);
      }
  };

  return { saveStatus, autoSaveEnabled, toggleAutoSave, clearStorage };
};