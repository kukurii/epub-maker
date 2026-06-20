import React from 'react';
import { TocItem } from '../../types';
import { Hash } from 'lucide-react';

interface SubItemTreeProps {
  items: TocItem[];
  onClickItem: (anchorId: string) => void;
}

const SubItemTree: React.FC<SubItemTreeProps> = ({ items, onClickItem }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="ml-8 mt-1 space-y-0.5 border-l border-slate-200 pl-3">
      {items.map((item, index) => (
        <button
          key={item.id || `sub-${index}`}
          onClick={() => onClickItem(item.id)}
          className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-blue-50 hover:text-blue-700 ${
            item.level === 1 ? 'font-medium text-slate-700' : 'pl-5 text-slate-500'
          }`}
          title={item.text}
        >
          <Hash size={11} className="shrink-0 opacity-50" />
          <span className="min-w-0 flex-1 truncate">{item.text || '小节'}</span>
        </button>
      ))}
    </div>
  );
};

export default SubItemTree;
