import React, { useState } from 'react';
import { Settings2, Library, Loader2, BookUp, FileType } from 'lucide-react';
import { Chapter, ProjectData, ImageAsset, ExtraFile, Metadata } from '../../types';
import { parseTxtToChapters, parseEpub } from '../../services/epubService';

interface FilesViewProps {
  onProjectUpdate: (updates: Partial<ProjectData>) => void;
  onChaptersLoaded: (chapters: Chapter[], firstChapterId: string) => void;
}

const FilesView: React.FC<FilesViewProps> = ({ onProjectUpdate, onChaptersLoaded }) => {
  const [splitRegex, setSplitRegex] = useState<string>("^\\s*(Chapter\\s+\\d+|第[0-9一二三四五六七八九十百千]+[章回节]|序章|尾声|引子)");
  const [showSplitSettings, setShowSplitSettings] = useState(false);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });

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
          customCSS: ''
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

  const handleBatchEpubUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      setIsBatchProcessing(true);
      setBatchProgress({ current: 0, total: files.length });

      try {
          let mergedChapters: Chapter[] = [];
          let mergedImages: ImageAsset[] = [];
          let mergedExtraFiles: ExtraFile[] = [];
          let mergedCustomCSS = '';
          let firstMetadata: Metadata | null = null;
          let firstCover: string | null = null;

          const fileList = (Array.from(files) as File[]).sort((a, b) => a.name.localeCompare(b.name, 'zh'));

          for (let i = 0; i < fileList.length; i++) {
              setBatchProgress({ current: i + 1, total: fileList.length });
              const file = fileList[i];
              const result = await parseEpub(file);

              if (result.chapters) mergedChapters = [...mergedChapters, ...result.chapters];
              if (result.images) mergedImages = [...mergedImages, ...result.images];
              if (result.extraFiles) mergedExtraFiles = [...mergedExtraFiles, ...result.extraFiles];
              if (result.customCSS) mergedCustomCSS += `\n/* From ${file.name} */\n` + result.customCSS;
              
              if (!firstMetadata && result.metadata) firstMetadata = result.metadata;
              if (!firstCover && result.cover) firstCover = result.cover;
          }

          onProjectUpdate({
              metadata: firstMetadata || {
                  title: '合并书籍合集',
                  creator: '多位作者',
                  language: 'zh',
                  description: '由多个 EPUB 文件合并而成。',
                  publisher: '',
                  date: new Date().toISOString().split('T')[0],
                  series: '',
                  subjects: ['合集']
              },
              chapters: mergedChapters,
              images: mergedImages,
              extraFiles: mergedExtraFiles,
              cover: firstCover,
              customCSS: mergedCustomCSS
          });

          if (mergedChapters.length > 0) {
              onChaptersLoaded(mergedChapters, mergedChapters[0].id);
          }
      } catch (error) {
          console.error("Batch merge failed:", error);
          alert(`批量合并失败: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
          setIsBatchProcessing(false);
      }
  };

  return (
    <div className="p-10 flex flex-col items-center justify-center h-full bg-[#F5F5F7]">
      <div className="bg-white/80 backdrop-blur-md p-10 rounded-[2.5rem] shadow-2xl border border-white/50 max-w-4xl w-full text-center transition-all">
        <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
            {isBatchProcessing ? <Loader2 size={40} className="animate-spin text-indigo-500" /> : <BookUp size={40} />}
        </div>
        
        <h2 className="text-3xl font-bold mb-3 text-gray-900 tracking-tight">
            {isBatchProcessing ? `正在处理书籍 (${batchProgress.current}/${batchProgress.total})` : '开始创作'}
        </h2>
        <p className="text-gray-500 mb-10 font-medium">
            {isBatchProcessing ? '请稍候，我们正在为您整合所有资源...' : '选择一个入口开始您的电子书制作之旅。'}
        </p>

        {isBatchProcessing && (
            <div className="w-full bg-gray-100 rounded-full h-2.5 mb-10 overflow-hidden shadow-inner">
                <div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full transition-all duration-300" 
                    style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                ></div>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {/* TXT Import */}
            <label className="block w-full cursor-pointer group">
              <input type="file" accept=".txt" onChange={handleTxtUpload} className="hidden" disabled={isBatchProcessing} />
              <div className="w-full min-h-[160px] bg-gray-900 text-white p-6 rounded-3xl transition-all active:scale-95 shadow-xl flex flex-col items-center justify-center hover:bg-black disabled:bg-gray-400 group-hover:-translate-y-1">
                  <FileType size={32} className="mb-4 text-gray-400 group-hover:text-white transition-colors" />
                  <span className="font-bold text-lg mb-1">导入 TXT</span>
                  <span className="text-[10px] opacity-60">自动切分章节</span>
              </div>
            </label>
            
            {/* Single EPUB Import */}
            <label className="block w-full cursor-pointer group">
              <input type="file" accept=".epub" onChange={handleEpubUpload} className="hidden" disabled={isBatchProcessing} />
              <div className="w-full min-h-[160px] bg-blue-600 text-white p-6 rounded-3xl transition-all active:scale-95 shadow-xl flex flex-col items-center justify-center hover:bg-blue-700 disabled:bg-blue-300 group-hover:-translate-y-1">
                  <BookUp size={32} className="mb-4 text-blue-200 group-hover:text-white transition-colors" />
                  <span className="font-bold text-lg mb-1">导入 EPUB</span>
                  <span className="text-[10px] opacity-60">解析现有电子书</span>
              </div>
            </label>

            {/* Batch EPUB Merge */}
            <label className="block w-full cursor-pointer group">
                <input type="file" accept=".epub" multiple onChange={handleBatchEpubUpload} className="hidden" disabled={isBatchProcessing} />
                <div className="w-full min-h-[160px] bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-6 rounded-3xl transition-all active:scale-95 shadow-2xl flex flex-col items-center justify-center hover:shadow-indigo-500/30 disabled:opacity-50 border border-white/10 group-hover:-translate-y-1">
                    <Library size={32} className="mb-4 text-indigo-200 group-hover:text-white transition-colors" />
                    <span className="font-bold text-lg mb-1">批量合并</span>
                    <span className="text-[10px] opacity-60">多卷合一模式</span>
                </div>
            </label>
        </div>

        <div className="border-t border-gray-100 pt-6">
           <button onClick={() => setShowSplitSettings(!showSplitSettings)} className="text-xs font-semibold text-gray-400 flex items-center justify-center w-full hover:text-blue-600 transition-colors">
             <Settings2 size={14} className="mr-1.5" /> {showSplitSettings ? '收起高级设置' : '高级导入设置'}
           </button>
           {showSplitSettings && (
             <div className="mt-6 text-left bg-gray-50 p-5 rounded-2xl border border-gray-200 animate-in slide-in-from-top-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">TXT 章节切分正则 (Regex)</label>
                <div className="flex gap-2">
                    <input 
                      type="text" 
                      className="flex-1 font-mono text-xs bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-blue-600 focus:ring-2 focus:ring-blue-500 outline-none shadow-inner" 
                      value={splitRegex} 
                      onChange={(e) => setSplitRegex(e.target.value)} 
                    />
                    <button onClick={() => setSplitRegex("^\\s*(Chapter\\s+\\d+|第[0-9一二三四五六七八九十百千]+[章回节]|序章|尾声|引子)")} className="px-3 py-2 text-[10px] bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-xl transition-colors font-bold">恢复默认</button>
                </div>
                <p className="text-[10px] text-gray-400 mt-3 leading-relaxed">系统将使用此规则扫描 TXT 文件并创建新章节。支持大多数主流中文及英文小说格式。</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default FilesView;