import React, { useState } from 'react';
import { FileUp, Settings2 } from 'lucide-react';
import { Chapter, ProjectData } from '../../types';
import { parseTxtToChapters, parseEpub } from '../../services/epubService';

interface FilesViewProps {
  onProjectUpdate: (updates: Partial<ProjectData>) => void;
  onChaptersLoaded: (chapters: Chapter[], firstChapterId: string) => void;
}

const FilesView: React.FC<FilesViewProps> = ({ onProjectUpdate, onChaptersLoaded }) => {
  const [splitRegex, setSplitRegex] = useState<string>("^\\s*(Chapter\\s+\\d+|第[0-9一二三四五六七八九十百千]+[章回节]|序章|尾声|引子)");
  const [showSplitSettings, setShowSplitSettings] = useState(false);

  const handleTxtUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const parsedChapters = parseTxtToChapters(text, splitRegex);
        const newChapters: Chapter[] = parsedChapters.map((c, i) => ({
          id: Date.now().toString() + i,
          title: c.title,
          content: c.content,
          level: c.level,
          subItems: []
        }));
        
        onProjectUpdate({
          metadata: { 
            title: file.name.replace(/\.txt$/i, ''),
            creator: '未知作者',
            language: 'zh',
            description: '',
            publisher: '',
            date: new Date().toISOString().split('T')[0],
            series: '',
            subjects: []
          },
          chapters: newChapters,
          images: [],
          cover: null,
        });
        
        if (newChapters.length > 0) {
            onChaptersLoaded(newChapters, newChapters[0].id);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleEpubUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          try {
              const importedProject = await parseEpub(file);
              onProjectUpdate(importedProject);
              
              if (importedProject.chapters && importedProject.chapters.length > 0) {
                  onChaptersLoaded(importedProject.chapters, importedProject.chapters[0].id);
              }
          } catch (error) {
              console.error("Failed to parse EPUB:", error);
              alert(`EPUB 解析失败: ${error instanceof Error ? error.message : String(error)}`);
          }
      }
  };

  return (
    <div className="p-10 flex flex-col items-center justify-center h-full bg-[#F5F5F7]">
      <div className="bg-white/80 backdrop-blur-md p-10 rounded-[2rem] shadow-2xl border border-white/50 max-w-2xl w-full text-center transition-all">
        <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600"><FileUp size={40} /></div>
        <h2 className="text-3xl font-bold mb-3 text-gray-900 tracking-tight">导入内容</h2>
        <p className="text-gray-500 mb-8 font-medium">从 TXT 创建新书，或导入 EPUB 继续编辑。</p>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <label className="block w-full cursor-pointer group">
              <input type="file" accept=".txt" onChange={handleTxtUpload} className="hidden" />
              <div className="w-full bg-black text-white font-semibold py-4 px-6 rounded-2xl transition-transform active:scale-95 shadow-lg flex items-center justify-center">选择 TXT 文件</div>
            </label>
            <label className="block w-full cursor-pointer group">
              <input type="file" accept=".epub" onChange={handleEpubUpload} className="hidden" />
              <div className="w-full bg-blue-600 text-white font-semibold py-4 px-6 rounded-2xl transition-transform active:scale-95 shadow-lg flex items-center justify-center">导入 EPUB 文件</div>
            </label>
        </div>
        <div className="border-t border-gray-100 pt-4">
           <button onClick={() => setShowSplitSettings(!showSplitSettings)} className="text-xs font-semibold text-gray-500 flex items-center justify-center w-full hover:text-blue-600 transition-colors">
             <Settings2 size={14} className="mr-1" /> {showSplitSettings ? '隐藏 TXT 高级设置' : '高级设置 (用于TXT导入)'}
           </button>
           {showSplitSettings && (
             <div className="mt-4 text-left bg-gray-50 p-4 rounded-xl border border-gray-200">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">TXT 章节标题匹配规则 (Regex)</label>
                <p className="text-[10px] text-gray-500 mb-2">如果你的小说章节格式特殊，请修改此正则表达式以便正确切分 TXT 文件。</p>
                <input type="text" className="w-full font-mono text-xs bg-white border border-gray-300 rounded-lg px-3 py-2 text-blue-600 focus:ring-2 focus:ring-blue-500 outline-none" value={splitRegex} onChange={(e) => setSplitRegex(e.target.value)} />
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default FilesView;