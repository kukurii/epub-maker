/**
 * useResizableSidebar - 可拖拽调整侧边栏宽度的 Hook
 *
 * 功能：
 * 1. 支持鼠标拖拽调整侧边栏宽度
 * 2. 限制最小/最大宽度
 * 3. 保存用户偏好到 localStorage
 * 4. 响应式：移动端自动全屏，不支持调整
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseResizableSidebarOptions {
  /** 默认宽度 (px) */
  defaultWidth?: number;
  /** 最小宽度 (px) */
  minWidth?: number;
  /** 最大宽度 (px) */
  maxWidth?: number;
  /** localStorage 存储 key */
  storageKey?: string;
  /** 移动端断点 (px)，小于此宽度时不允许调整 */
  mobileBreakpoint?: number;
}

interface UseResizableSidebarReturn {
  /** 当前侧边栏宽度 */
  width: number;
  /** 是否正在拖拽 */
  isDragging: boolean;
  /** 是否为移动端 */
  isMobile: boolean;
  /** 拖拽手柄的事件处理器 */
  handleMouseDown: (e: React.MouseEvent) => void;
  /** 重置为默认宽度 */
  resetWidth: () => void;
}

const DEFAULT_WIDTH = 320; // 80 * 4 = 320px (w-80)
const MIN_WIDTH = 240;
const MAX_WIDTH = 480;
const STORAGE_KEY = 'epub-maker-sidebar-width';
const MOBILE_BREAKPOINT = 768;

export function useResizableSidebar(
  options: UseResizableSidebarOptions = {}
): UseResizableSidebarReturn {
  const {
    defaultWidth = DEFAULT_WIDTH,
    minWidth = MIN_WIDTH,
    maxWidth = MAX_WIDTH,
    storageKey = STORAGE_KEY,
    mobileBreakpoint = MOBILE_BREAKPOINT,
  } = options;

  // ─── 状态 ───
  const [width, setWidth] = useState<number>(() => {
    // 从 localStorage 读取保存的宽度
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= minWidth && parsed <= maxWidth) {
          return parsed;
        }
      }
    }
    return defaultWidth;
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  // ─── 检测移动端 ───
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < mobileBreakpoint);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [mobileBreakpoint]);

  // ─── 拖拽开始 ───
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // 移动端不支持拖拽调整
      if (isMobile) return;

      e.preventDefault();
      setIsDragging(true);
      startXRef.current = e.clientX;
      startWidthRef.current = width;
    },
    [isMobile, width]
  );

  // ─── 拖拽中 ───
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startXRef.current;
      const newWidth = startWidthRef.current + delta;

      // 限制宽度范围
      const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      setWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);

      // 保存到 localStorage
      localStorage.setItem(storageKey, width.toString());
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, minWidth, maxWidth, storageKey, width]);

  // ─── 重置宽度 ───
  const resetWidth = useCallback(() => {
    setWidth(defaultWidth);
    localStorage.setItem(storageKey, defaultWidth.toString());
  }, [defaultWidth, storageKey]);

  return {
    width,
    isDragging,
    isMobile,
    handleMouseDown,
    resetWidth,
  };
}
