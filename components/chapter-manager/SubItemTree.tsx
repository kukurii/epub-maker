import React from 'react';
import { TocItem } from '../../types';
import { Hash } from 'lucide-react';

interface SubItemTreeProps {
  /** 子项列表 */
  items: TocItem[];
  /** 点击子项时触发，用于跳转到对应锚点 */
  onClickItem: (anchorId: string) => void;
}

/**
 * 子项树状展示组件
 * 展示章节内的 H1/H2 子标题，带树状连线
 */
const SubItemTree: React.FC<SubItemTreeProps> = ({ items, onClickItem }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="pl-4 mt-1 space-y-0.5">
      {items.map((item, index) => {
        const isH1 = item.level === 1;
        const isLast = index === items.length - 1;

        return (
          <button
            key={item.id || `sub-${index}`}
            onClick={() => onClickItem(item.id)}
            className={`
              w-full flex items-center pr-2 py-1.5 rounded-lg text-sm
              transition-colors relative hover:bg-blue-50 text-left
              ${isH1
                ? 'pl-6 font-medium text-gray-700 hover:text-blue-700'
                : 'pl-10 text-gray-500 hover:text-blue-600'
              }
            `}
          >
            {/* H1 子项的树状连线 */}
            {isH1 && (
              <>
                {/* 水平连接线 */}
                <div className="absolute left-[8px] top-1/2 -translate-y-1/2 w-4 h-px bg-gray-300" />
                {/* 垂直延伸线（非最后一个时显示） */}
                {!isLast && (
                  <div className="absolute left-[8px] top-1/2 bottom-[-4px] w-px bg-gray-200" />
                )}
              </>
            )}

            {/* H2 子项的连接线 */}
            {!isH1 && (
              <div className="absolute left-[26px] top-1/2 -translate-y-1/2 w-4 h-px bg-gray-200" />
            )}

            <span
              className="truncate flex-1 min-w-0 flex items-center z-10"
              title={item.text}
            >
              <Hash size={10} className="mr-1.5 opacity-40 flex-shrink-0" />
              {item.text || '小节'}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default SubItemTree;
