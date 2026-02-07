import React, { useState } from 'react';
import { Settings2, Library, BookUp, FileType, UploadCloud } from 'lucide-react';
import { Chapter, ProjectData, ImageAsset, ExtraFile, Metadata } from '../../types';
import { parseTxtToChapters, parseEpub } from '../../services/epubService';

interface FilesViewProps {
  onProjectUpdate: (updates: Partial<ProjectData>) => void;
  onChaptersLoaded: (chapters: Chapter[], firstChapterId: string) => void;
  onLoadingStart: (msg: string) => void;
  onLoadingEnd: () => void;
}

type DragZoneType = 'txt' | 'epub' | 'batch' | null;

const FilesView: React.FC<FilesViewProps> = ({ onProjectUpdate, onChaptersLoaded, onLoadingStart, onLoadingEnd }) => {
  const [splitRegex, setSplitRegex] = useState<string>("^\\s*(Chapter\\s+\\d+|第[0-9一二三四五六七八九十百千]+[章回节]|序章|尾声|引子|[（(][0-9一二三四五六七八九十百千]+[)）])");
  const [showSplitSettings, setShowSplitSettings] = useState(false);
  const [dragActive, setDragActive] = useState<DragZoneType>(null);

  // --- Processing Logic (Extracted for reuse) ---

  const processTxtFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.txt')) {
        alert('请上传 .txt 格式的文件');
        return;
    }
    onLoadingStart('正在解析 TXT 文件...');
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
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
      } catch (error) {
          console.error(error);
          alert('TXT 解析失败');
      } finally {
          onLoadingEnd();
      }
    };
    reader.onerror = () => onLoadingEnd();
    reader.readAsText(file);
  };

  const processEpubFile = async (file: File) => {
      if (!file.name.toLowerCase().endsWith('.epub')) {
          alert('请上传 .epub 格式的文件');
          return;
      }
      onLoadingStart('正在解析 EPUB 文件...');
      // Delay slightly to ensure UI renders the loading state
      await new Promise(resolve => setTimeout(resolve, 50));
      try {
          const importedProject = await parseEpub(file);
          onProjectUpdate(importedProject);
          
          if (importedProject.chapters && importedProject.chapters.length > 0) {
              onChaptersLoaded(importedProject.chapters, importedProject.chapters[0].id);
          }
      } catch (error) {
          console.error("Failed to parse EPUB:", error);
          alert(`EPUB 解析失败: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
          onLoadingEnd();
      }
  };

  const processBatchFiles = async (files: FileList | File[]) => {
      const epubFiles = Array.from(files).filter(f => f.name.toLowerCase().endsWith('.epub'));
      if (epubFiles.length === 0) {
          alert('请选择至少一个 .epub 文件');
          return;
      }

      onLoadingStart(`准备合并 ${epubFiles.length} 本书籍...`);

      try {
          let mergedChapters: Chapter[] = [];
          let mergedImages: ImageAsset[] = [];
          let mergedExtraFiles: ExtraFile[] = [];
          let mergedCustomCSS = '';
          let firstMetadata: Metadata | null = null;
          let firstCover: string | null = null;

          const fileList = epubFiles.sort((a, b) => a.name.localeCompare(b.name, 'zh'));

          for (let i = 0; i < fileList.length; i++) {
              onLoadingStart(`正在合并第 ${i + 1}/${fileList.length} 本书: ${fileList[i].name}`);
              // Yield to UI thread
              await new Promise(resolve => setTimeout(resolve, 10));
              
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
          onLoadingEnd();
      }
  };

  // --- Input Change Handlers ---

  const handleTxtUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processTxtFile(file);
  };

  const handleEpubUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processEpubFile(file);
  };

  const handleBatchEpubUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files) processBatchFiles(files);
  };

  // --- Drag & Drop Handlers ---

  const handleDragEnter = (e: React.DragEvent, zone: DragZoneType) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(zone);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only clear if we are leaving the current target container, not entering a child
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragActive(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent, zone: DragZoneType) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(null);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
        if (zone === 'txt') {
            processTxtFile(files[0]);
        } else if (zone === 'epub') {
            processEpubFile(files[0]);
        } else if (zone === 'batch') {
            processBatchFiles(files);
        }
    }
  };

  return (
    <div className="p-4 md:p-10 flex flex-col items-center justify-center h-full bg-[#F5F5F7] overflow-y-auto">
      <div className="bg-white/80 backdrop-blur-md p-6 md:p-10 rounded-2xl md:rounded-[2.5rem] shadow-2xl border border-white/50 max-w-4xl w-full text-center transition-all">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 text-blue-600">
            <BookUp size={32} className="md:w-10 md:h-10" />
        </div>
        
        <h2 className="text-2xl md:text-3xl font-bold mb-2 md:mb-3 text-gray-900 tracking-tight">
            开始创作
        </h2>
        <p className="text-gray-500 mb-6 md:mb-10 font-medium text-sm md:text-base">
            选择一个入口或拖入文件开始您的电子书制作之旅。
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-10">
            {/* TXT Import */}
            <label 
                className={`relative block w-full cursor-pointer group rounded-3xl transition-all duration-300 ${
                   dragActive === 'txt' ? 'ring-4 ring-gray-400 scale-105 shadow-2xl' : 'active:scale-95'
                }`}
                onDragEnter={(e) => handleDragEnter(e, 'txt')}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'txt')}
            >
              <input type="file" accept=".txt" onChange={handleTxtUpload} className="hidden" />
              <div className={`w-full min-h-[140px] md:min-h-[180px] p-4 md:p-6 rounded-3xl shadow-xl flex flex-col items-center justify-center transition-colors border-2 border-transparent ${
                  dragActive === 'txt' ? 'bg-gray-800 border-gray-500' : 'bg-gray-900 hover:bg-black'
              } text-white`}>
                  {dragActive === 'txt' ? (
                      <UploadCloud size={32} className="mb-4 text-white animate-bounce" />
                  ) : (
                      <FileType size={32} className="mb-2 md:mb-4 text-gray-400 group-hover:text-white transition-colors" />
                  )}
                  <span className="font-bold text-base md:text-lg mb-1">{dragActive === 'txt' ? '释放以导入 TXT' : '导入 TXT'}</span>
                  <span className="text-[10px] opacity-60">自动切分章节</span>
              </div>
            </label>
            
            {/* Single EPUB Import */}
            <label 
                className={`relative block w-full cursor-pointer group rounded-3xl transition-all duration-300 ${
                   dragActive === 'epub' ? 'ring-4 ring-blue-300 scale-105 shadow-2xl' : 'active:scale-95'
                }`}
                onDragEnter={(e) => handleDragEnter(e, 'epub')}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'epub')}
            >
              <input type="file" accept=".epub" onChange={handleEpubUpload} className="hidden" />
              <div className={`w-full min-h-[140px] md:min-h-[180px] p-4 md:p-6 rounded-3xl shadow-xl flex flex-col items-center justify-center transition-colors border-2 border-transparent ${
                  dragActive === 'epub' ? 'bg-blue-500 border-white/30' : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}>
                  {dragActive === 'epub' ? (
                      <UploadCloud size={32} className="mb-4 text-white animate-bounce" />
                  ) : (
                      <BookUp size={32} className="mb-2 md:mb-4 text-blue-200 group-hover:text-white transition-colors" />
                  )}
                  <span className="font-bold text-base md:text-lg mb-1">{dragActive === 'epub' ? '释放以解析 EPUB' : '导入 EPUB'}</span>
                  <span className="text-[10px] opacity-60">解析现有电子书</span>
              </div>
            </label>

            {/* Batch EPUB Merge */}
            <label 
                className={`relative block w-full cursor-pointer group rounded-3xl transition-all duration-300 ${
                   dragActive === 'batch' ? 'ring-4 ring-indigo-300 scale-105 shadow-2xl' : 'active:scale-95'
                }`}
                onDragEnter={(e) => handleDragEnter(e, 'batch')}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'batch')}
            >
                <input type="file" accept=".epub" multiple onChange={handleBatchEpubUpload} className="hidden" />
                <div className={`w-full min-h-[140px] md:min-h-[180px] p-4 md:p-6 rounded-3xl shadow-xl flex flex-col items-center justify-center transition-all border border-white/10 ${
                    dragActive === 'batch' 
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-500 border-white/30' 
                    : 'bg-gradient-to-br from-indigo-600 to-purple-600 hover:shadow-indigo-500/30 shadow-2xl'
                } text-white`}>
                    {dragActive === 'batch' ? (
                      <UploadCloud size={32} className="mb-4 text-white animate-bounce" />
                    ) : (
                      <Library size={32} className="mb-2 md:mb-4 text-indigo-200 group-hover:text-white transition-colors" />
                    )}
                    <span className="font-bold text-base md:text-lg mb-1">{dragActive === 'batch' ? '释放以批量合并' : '批量合并'}</span>
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
                <div className="flex flex-col md:flex-row gap-2">
                    <input 
                      type="text" 
                      className="flex-1 font-mono text-xs bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-blue-600 focus:ring-2 focus:ring-blue-500 outline-none shadow-inner w-full" 
                      value={splitRegex} 
                      onChange={(e) => setSplitRegex(e.target.value)} 
                    />
                    <button onClick={() => setSplitRegex("^\\s*(Chapter\\s+\\d+|第[0-9一二三四五六七八九十百千]+[章回节]|序章|尾声|引子|[（(][0-9一二三四五六七八九十百千]+[)）])")} className="px-3 py-2 text-[10px] bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-xl transition-colors font-bold whitespace-nowrap">恢复默认</button>
                </div>
                <p className="text-[10px] text-gray-400 mt-3 leading-relaxed">系统将使用此规则扫描 TXT 文件并创建新章节。支持大多数主流中文及英文小说格式，例如“第一章”、“Chapter 1”、“（一）”等。</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default FilesView;