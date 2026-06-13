/**
 * useEditorSettings - 编辑器设置管理 Hook
 *
 * 管理编辑器的用户偏好设置：
 * 1. 字体大小
 * 2. 行高
 * 3. 主题模式
 * 4. 是否显示行号
 *
 * 所有设置保存到 localStorage，跨会话持久化
 */

import { useState, useCallback, useEffect } from 'react';

export type EditorTheme = 'white' | 'green' | 'dark';
export type FontSize = 'small' | 'base' | 'medium' | 'large';

interface EditorSettings {
  fontSize: FontSize;
  lineHeight: number;
  theme: EditorTheme;
  showLineNumbers: boolean;
}

interface UseEditorSettingsReturn extends EditorSettings {
  /** 设置字体大小 */
  setFontSize: (size: FontSize) => void;
  /** 增大字体 */
  increaseFontSize: () => void;
  /** 减小字体 */
  decreaseFontSize: () => void;
  /** 获取字体大小的像素值 */
  getFontSizeValue: () => number;
  /** 设置行高 */
  setLineHeight: (height: number) => void;
  /** 设置主题 */
  setTheme: (theme: EditorTheme) => void;
  /** 切换行号显示 */
  toggleLineNumbers: () => void;
  /** 重置为默认设置 */
  resetSettings: () => void;
}

// ─── 常量 ───
const STORAGE_KEY = 'epub-maker-editor-settings';

const DEFAULT_SETTINGS: EditorSettings = {
  fontSize: 'base',
  lineHeight: 1.8,
  theme: 'white',
  showLineNumbers: false,
};

const FONT_SIZE_MAP: Record<FontSize, number> = {
  small: 14,
  base: 16,
  medium: 18,
  large: 20,
};

const FONT_SIZE_ORDER: FontSize[] = ['small', 'base', 'medium', 'large'];

// ─── Hook ───
export function useEditorSettings(): UseEditorSettingsReturn {
  // ─── 初始化状态 ───
  const [settings, setSettings] = useState<EditorSettings>(() => {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load editor settings:', error);
    }

    return DEFAULT_SETTINGS;
  });

  // ─── 保存到 localStorage ───
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save editor settings:', error);
    }
  }, [settings]);

  // ─── 设置字体大小 ───
  const setFontSize = useCallback((size: FontSize) => {
    setSettings((prev) => ({ ...prev, fontSize: size }));
  }, []);

  // ─── 增大字体 ───
  const increaseFontSize = useCallback(() => {
    setSettings((prev) => {
      const currentIndex = FONT_SIZE_ORDER.indexOf(prev.fontSize);
      const nextIndex = Math.min(currentIndex + 1, FONT_SIZE_ORDER.length - 1);
      return { ...prev, fontSize: FONT_SIZE_ORDER[nextIndex] };
    });
  }, []);

  // ─── 减小字体 ───
  const decreaseFontSize = useCallback(() => {
    setSettings((prev) => {
      const currentIndex = FONT_SIZE_ORDER.indexOf(prev.fontSize);
      const nextIndex = Math.max(currentIndex - 1, 0);
      return { ...prev, fontSize: FONT_SIZE_ORDER[nextIndex] };
    });
  }, []);

  // ─── 获取字体大小像素值 ───
  const getFontSizeValue = useCallback((): number => {
    return FONT_SIZE_MAP[settings.fontSize];
  }, [settings.fontSize]);

  // ─── 设置行高 ───
  const setLineHeight = useCallback((height: number) => {
    setSettings((prev) => ({ ...prev, lineHeight: height }));
  }, []);

  // ─── 设置主题 ───
  const setTheme = useCallback((theme: EditorTheme) => {
    setSettings((prev) => ({ ...prev, theme }));
  }, []);

  // ─── 切换行号显示 ───
  const toggleLineNumbers = useCallback(() => {
    setSettings((prev) => ({ ...prev, showLineNumbers: !prev.showLineNumbers }));
  }, []);

  // ─── 重置设置 ───
  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return {
    ...settings,
    setFontSize,
    increaseFontSize,
    decreaseFontSize,
    getFontSizeValue,
    setLineHeight,
    setTheme,
    toggleLineNumbers,
    resetSettings,
  };
}
