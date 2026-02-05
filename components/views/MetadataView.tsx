import React from 'react';
import { ProjectData } from '../../types';

interface MetadataViewProps {
  metadata: ProjectData['metadata'];
  onUpdate: (metadata: ProjectData['metadata']) => void;
}

const MetadataView: React.FC<MetadataViewProps> = ({ metadata, onUpdate }) => {
  const handleChange = (key: keyof ProjectData['metadata'], value: any) => {
    onUpdate({ ...metadata, [key]: value });
  };

  return (
    <div className="p-10 h-full bg-[#F5F5F7] overflow-y-auto">
      <h2 className="text-3xl font-bold mb-8 text-gray-900 tracking-tight">元数据 (Metadata)</h2>
      <div className="max-w-3xl space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">书名 (Title)</label>
             <input type="text" className="w-full text-lg font-semibold border-b border-gray-200 pb-2 focus:border-blue-500 outline-none bg-transparent" value={metadata.title} onChange={e => handleChange('title', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">作者 (Author)</label>
                <input type="text" className="w-full font-medium border-b border-gray-200 pb-2 focus:border-blue-500 outline-none bg-transparent" value={metadata.creator} onChange={e => handleChange('creator', e.target.value)} />
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">语言 (Language)</label>
                <input type="text" className="w-full font-medium border-b border-gray-200 pb-2 focus:border-blue-500 outline-none bg-transparent" value={metadata.language} onChange={e => handleChange('language', e.target.value)} />
            </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">系列 (Series)</label>
             <input type="text" className="w-full font-medium border-b border-gray-200 pb-2 focus:border-blue-500 outline-none bg-transparent" placeholder="例如：哈利波特系列" value={metadata.series || ''} onChange={e => handleChange('series', e.target.value)} />
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">标签 (Tags)</label>
             <input type="text" className="w-full font-medium border-b border-gray-200 pb-2 focus:border-blue-500 outline-none bg-transparent" placeholder="例如：奇幻, 魔法, 冒险 (用逗号分隔)" value={metadata.subjects?.join(', ') || ''} onChange={e => handleChange('subjects', e.target.value.split(/[，,]/).map((s: string) => s.trim()).filter((s: string) => s))} />
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">简介 (Description)</label>
             <textarea rows={5} className="w-full font-medium border-b border-gray-200 pb-2 focus:border-blue-500 outline-none bg-transparent resize-none" value={metadata.description} onChange={e => handleChange('description', e.target.value)} />
        </div>
      </div>
    </div>
  );
};

export default MetadataView;