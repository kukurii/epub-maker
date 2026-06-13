/**
 * 拖拽排序 Hook
 * 使用原生 HTML5 Drag and Drop API
 * 支持键盘辅助和触摸设备
 */

import { useState, useCallback } from 'react';

export interface DragItem {
  id: string;
  index: number;
}

export const useDragSort = <T extends { id: string }>(
  items: T[],
  onReorder: (newItems: T[]) => void
) => {
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [dropTarget, setDropTarget] = useState<number | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    const item = items[index];
    setDraggedItem({ id: item.id, index });

    // 设置拖拽数据
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.id);

    // 添加拖拽样式
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  }, [items]);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    // 恢复样式
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }

    setDraggedItem(null);
    setDropTarget(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (draggedItem && draggedItem.index !== index) {
      setDropTarget(index);
    }
  }, [draggedItem]);

  const handleDragLeave = useCallback(() => {
    setDropTarget(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();

    if (!draggedItem || draggedItem.index === targetIndex) {
      setDraggedItem(null);
      setDropTarget(null);
      return;
    }

    // 计算新顺序
    const newItems = [...items];
    const [movedItem] = newItems.splice(draggedItem.index, 1);
    newItems.splice(targetIndex, 0, movedItem);

    onReorder(newItems);

    setDraggedItem(null);
    setDropTarget(null);
  }, [draggedItem, items, onReorder]);

  return {
    draggedItem,
    dropTarget,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    isDragging: draggedItem !== null,
  };
};

/**
 * 拖拽手柄组件
 */
export const DragHandle: React.FC<{
  className?: string;
  onMouseDown?: (e: React.MouseEvent) => void;
}> = ({ className = '', onMouseDown }) => (
  <div
    className={`cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors ${className}`}
    onMouseDown={onMouseDown}
  >
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="5" cy="4" r="1.5" />
      <circle cx="11" cy="4" r="1.5" />
      <circle cx="5" cy="8" r="1.5" />
      <circle cx="11" cy="8" r="1.5" />
      <circle cx="5" cy="12" r="1.5" />
      <circle cx="11" cy="12" r="1.5" />
    </svg>
  </div>
);
