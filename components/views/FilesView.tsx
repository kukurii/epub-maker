import React, { useState } from 'react';
import { Settings2, Library, BookOpen, FileType, Cloud, X, ChevronUp, ChevronDown } from 'lucide-react';
import { Chapter, ProjectData, ImageAsset, ExtraFile, Metadata } from '../../types';
import { parseTxtToChapters } from '../../services/textParser';
import { parseEpub } from '../../services/epubImport';
import { dialog } from '../../services/dialog';

interface FilesViewProps {
    onProjectUpdate: (updates: Partial<ProjectData>) => void;
    onChaptersLoaded: (chapters: Chapter[], firstChapterId: string) => void;
    onLoadingStart: (msg: string) => void;
    onLoadingEnd: () => void;
}

type DragZoneType = 'txt' | 'epub' | 'batch' | null;

const FilesView: React.FC<FilesViewProps> = ({ onProjectUpdate, onChaptersLoaded, onLoadingStart, onLoadingEnd }) => {
    const [splitRegex, setSplitRegex] = useState<string>("^\\s*(Chapter\\s+\\d+|第[0-9一二三四五六七八九十百千]+[章回节]|序章|尾声|引子|[（(][0-9一二三四五六七八九十百千]+[)）])");
    const [cleanHtml, setCleanHtml] = useState(true);
    const [removeImages, setRemoveImages] = useState(false);
    const [showSplitSettings, setShowSplitSettings] = useState(false);
    const [dragActive, setDragActive] = useState<DragZoneType>(null);
    const [batchFiles, setBatchFiles] = useState<File[]>([]);
    const [primaryFileIndex, setPrimaryFileIndex] = useState<number>(0);
    const [showBatchModal, setShowBatchModal] = useState<boolean>(false);

    // --- Processing Logic (Extracted for reuse) ---

    const processTxtFile = async (file: File) => {
        if (!file.name.toLowerCase().endsWith('.txt')) {
            await dialog.alert('请上传 .txt 格式的文件');
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
                dialog.alert('TXT 解析失败');
            } finally {
                onLoadingEnd();
            }
        };
        reader.onerror = () => onLoadingEnd();
        reader.readAsText(file);
    };

    const processEpubFile = async (file: File) => {
        if (!file.name.toLowerCase().endsWith('.epub')) {
            await dialog.alert('请上传 .epub 格式的文件');
            return;
        }
        onLoadingStart('正在解析 EPUB 文件...');
        // Delay slightly to ensure UI renders the loading state
        await new Promise(resolve => setTimeout(resolve, 50));
        try {
            const importedProject = await parseEpub(file, {
                imageStartId: 1,
                cleanHtml,
                removeImages
            });
            onProjectUpdate(importedProject);

            if (importedProject.chapters && importedProject.chapters.length > 0) {
                onChaptersLoaded(importedProject.chapters, importedProject.chapters[0].id);
            }
        } catch (error) {
            console.error("Failed to parse EPUB:", error);
            await dialog.alert(`EPUB 解析失败: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            onLoadingEnd();
        }
    };

    const handleShowBatchOptions = async (files: FileList | File[]) => {
        const epubFiles = Array.from(files).filter(f => f.name.toLowerCase().endsWith('.epub'));
        if (epubFiles.length === 0) {
            await dialog.alert('请选择至少一个 .epub 文件');
            return;
        }

        const sortedFiles = epubFiles.sort((a, b) => a.name.localeCompare(b.name, 'zh'));
        setBatchFiles(sortedFiles);
        setPrimaryFileIndex(0);
        setShowBatchModal(true);
    };

    const handleMoveBatchFile = (index: number, direction: 'up' | 'down', e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === batchFiles.length - 1) return;

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        const newBatchFiles = [...batchFiles];
        // Swap elements
        const temp = newBatchFiles[index];
        newBatchFiles[index] = newBatchFiles[newIndex];
        newBatchFiles[newIndex] = temp;

        // Adjust primaryFileIndex if it's affected
        if (primaryFileIndex === index) {
            setPrimaryFileIndex(newIndex);
        } else if (primaryFileIndex === newIndex) {
            setPrimaryFileIndex(index);
        }

        setBatchFiles(newBatchFiles);
    };

    const processBatchFiles = async (fileList: File[], primaryIndex: number) => {
        onLoadingStart(`准备合并 ${fileList.length} 本书籍...`);

        try {
            let mergedChapters: Chapter[] = [];
            let mergedImages: ImageAsset[] = [];
            let mergedExtraFiles: ExtraFile[] = [];
            let mergedCustomCSS = '';
            let primaryMetadata: Metadata | null = null;
            let primaryCover: string | null = null;
            let globalImageCount = 0;

            for (let i = 0; i < fileList.length; i++) {
                onLoadingStart(`正在合并第 ${i + 1}/${fileList.length} 本书: ${fileList[i].name}`);
                // Yield to UI thread
                await new Promise(resolve => setTimeout(resolve, 10));

                const file = fileList[i];
                const result = await parseEpub(file, {
                    imageStartId: globalImageCount + 1,
                    cleanHtml,
                    removeImages
                });

                if (result.chapters) mergedChapters = [...mergedChapters, ...result.chapters];
                if (result.images) {
                    mergedImages = [...mergedImages, ...result.images];
                    globalImageCount += result.images.length;
                }
                if (result.extraFiles) mergedExtraFiles = [...mergedExtraFiles, ...result.extraFiles];
                if (result.customCSS) mergedCustomCSS += `\n/* From ${file.name} */\n` + result.customCSS;

                if (i === primaryIndex) {
                    if (result.metadata) primaryMetadata = result.metadata;
                    if (result.cover) primaryCover = result.cover;
                }
            }

            onProjectUpdate({
                metadata: primaryMetadata || {
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
                cover: primaryCover,
                customCSS: mergedCustomCSS
            });

            if (mergedChapters.length > 0) {
                onChaptersLoaded(mergedChapters, mergedChapters[0].id);
            }
        } catch (error) {
            console.error("Batch merge failed:", error);
            await dialog.alert(`批量合并失败: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            onLoadingEnd();
        }
    };

    // --- Input Change Handlers ---

    const handleTxtUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processTxtFile(file);
        e.target.value = ''; // Clear input to allow re-uploading the same file
    };

    const handleEpubUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processEpubFile(file);
        e.target.value = ''; // Clear input
    };

    const handleBatchEpubUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) handleShowBatchOptions(files);
        e.target.value = ''; // Clear input
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
                handleShowBatchOptions(files);
            }
        }
    };

    return (
        <div className="p-4 md:p-10 flex flex-col items-center justify-center h-full bg-[#F5F5F7] overflow-y-auto">
            <div className="bg-white/80 backdrop-blur-md p-6 md:p-10 rounded-2xl md:rounded-[2.5rem] shadow-2xl border border-white/50 max-w-4xl w-full text-center transition-all">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 text-blue-600">
                    <BookOpen size={32} className="md:w-10 md:h-10" />
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
                        className={`relative block w-full cursor-pointer group rounded-3xl transition-all duration-300 ${dragActive === 'txt' ? 'ring-4 ring-gray-400 scale-105 shadow-2xl' : 'active:scale-95'
                            }`}
                        onDragEnter={(e) => handleDragEnter(e, 'txt')}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, 'txt')}
                    >
                        <input type="file" accept=".txt" onChange={handleTxtUpload} className="hidden" />
                        <div className={`w-full min-h-[140px] md:min-h-[180px] p-4 md:p-6 rounded-3xl shadow-xl flex flex-col items-center justify-center transition-colors border-2 border-transparent ${dragActive === 'txt' ? 'bg-gray-800 border-gray-500' : 'bg-gray-900 hover:bg-black'
                            } text-white`}>
                            {dragActive === 'txt' ? (
                                <Cloud size={32} className="mb-4 text-white animate-bounce" />
                            ) : (
                                <FileType size={32} className="mb-2 md:mb-4 text-gray-400 group-hover:text-white transition-colors" />
                            )}
                            <span className="font-bold text-base md:text-lg mb-1">{dragActive === 'txt' ? '释放以导入 TXT' : '导入 TXT'}</span>
                            <span className="text-[10px] opacity-60">自动切分章节</span>
                        </div>
                    </label>

                    {/* Single EPUB Import */}
                    <label
                        className={`relative block w-full cursor-pointer group rounded-3xl transition-all duration-300 ${dragActive === 'epub' ? 'ring-4 ring-blue-300 scale-105 shadow-2xl' : 'active:scale-95'
                            }`}
                        onDragEnter={(e) => handleDragEnter(e, 'epub')}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, 'epub')}
                    >
                        <input type="file" accept=".epub" onChange={handleEpubUpload} className="hidden" />
                        <div className={`w-full min-h-[140px] md:min-h-[180px] p-4 md:p-6 rounded-3xl shadow-xl flex flex-col items-center justify-center transition-colors border-2 border-transparent ${dragActive === 'epub' ? 'bg-blue-500 border-white/30' : 'bg-blue-600 hover:bg-blue-700'
                            } text-white`}>
                            {dragActive === 'epub' ? (
                                <Cloud size={32} className="mb-4 text-white animate-bounce" />
                            ) : (
                                <BookOpen size={32} className="mb-2 md:mb-4 text-blue-200 group-hover:text-white transition-colors" />
                            )}
                            <span className="font-bold text-base md:text-lg mb-1">{dragActive === 'epub' ? '释放以解析 EPUB' : '导入 EPUB'}</span>
                            <span className="text-[10px] opacity-60">解析现有电子书</span>
                        </div>
                    </label>

                    {/* Batch EPUB Merge */}
                    <label
                        className={`relative block w-full cursor-pointer group rounded-3xl transition-all duration-300 ${dragActive === 'batch' ? 'ring-4 ring-indigo-300 scale-105 shadow-2xl' : 'active:scale-95'
                            }`}
                        onDragEnter={(e) => handleDragEnter(e, 'batch')}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, 'batch')}
                    >
                        <input type="file" accept=".epub" multiple onChange={handleBatchEpubUpload} className="hidden" />
                        <div className={`w-full min-h-[140px] md:min-h-[180px] p-4 md:p-6 rounded-3xl shadow-xl flex flex-col items-center justify-center transition-all border border-white/10 ${dragActive === 'batch'
                            ? 'bg-gradient-to-br from-indigo-500 to-purple-500 border-white/30'
                            : 'bg-gradient-to-br from-indigo-600 to-purple-600 hover:shadow-indigo-500/30 shadow-2xl'
                            } text-white`}>
                            {dragActive === 'batch' ? (
                                <Cloud size={32} className="mb-4 text-white animate-bounce" />
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
                            <p className="text-[10px] text-gray-400 mt-2 mb-4 leading-relaxed">系统将使用此规则扫描 TXT 文件并创建新章节。</p>
                        </div>
                    )}



                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 pt-3 border-t border-gray-200">EPUB 解析选项</label>
                    <div className="space-y-2">
                        <label className="flex items-center gap-3 cursor-pointer group bg-white hover:bg-blue-50/60 border border-gray-200 hover:border-blue-200 rounded-xl px-4 py-3 transition-all">
                            <input type="checkbox" checked={cleanHtml} onChange={e => setCleanHtml(e.target.checked)} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 shrink-0 transition-colors" />
                            <div className="text-left text-xs">
                                <span className="font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">清洗旧版 HTML 格式</span>
                                <p className="text-gray-400 mt-0.5 leading-relaxed">强力移除无用的 {`<br>, <span>, <style>`} 等多余标签，使导入的内容更加纯净。</p>
                            </div>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group bg-white hover:bg-blue-50/60 border border-gray-200 hover:border-blue-200 rounded-xl px-4 py-3 transition-all">
                            <input type="checkbox" checked={removeImages} onChange={e => setRemoveImages(e.target.checked)} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 shrink-0 transition-colors" />
                            <div className="text-left text-xs">
                                <span className="font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">移除章节内页原配图片</span>
                                <p className="text-gray-400 mt-0.5 leading-relaxed">解决某些旧电子书每一章开头都带一张相同的超巨大封面，导致文件体积爆炸的问题。</p>
                            </div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Batch Merge Options Modal */}
            {showBatchModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95">
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">批量合并选项</h3>
                                <p className="text-xs text-gray-500 mt-1">请选择一本主书，合并后将使用该书的封面和元数据。</p>
                            </div>
                            <button onClick={() => setShowBatchModal(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100/50 hover:bg-gray-200/50 p-2 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1 space-y-2">
                            {batchFiles.map((file, idx) => (
                                <label key={idx} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${primaryFileIndex === idx ? 'border-indigo-500 bg-indigo-50/50 shadow-sm' : 'border-gray-200 hover:border-indigo-200 hover:bg-gray-50'}`}>
                                    <input
                                        type="radio"
                                        name="primaryBook"
                                        checked={primaryFileIndex === idx}
                                        onChange={() => setPrimaryFileIndex(idx)}
                                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm truncate font-medium ${primaryFileIndex === idx ? 'text-indigo-900' : 'text-gray-700'}`}>{file.name}</p>
                                    </div>
                                    {primaryFileIndex === idx && <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-1 rounded-md">主书本</span>}

                                    <div className="flex items-center gap-1 border-l pl-2 border-gray-100/50">
                                        <button
                                            type="button"
                                            onClick={(e) => handleMoveBatchFile(idx, 'up', e)}
                                            disabled={idx === 0}
                                            className={`p-1.5 rounded-lg transition-colors ${idx === 0 ? 'opacity-20 cursor-not-allowed' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`}
                                            title="上移"
                                        >
                                            <ChevronUp size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => handleMoveBatchFile(idx, 'down', e)}
                                            disabled={idx === batchFiles.length - 1}
                                            className={`p-1.5 rounded-lg transition-colors ${idx === batchFiles.length - 1 ? 'opacity-20 cursor-not-allowed' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`}
                                            title="下移"
                                        >
                                            <ChevronDown size={16} />
                                        </button>
                                    </div>
                                </label>
                            ))}
                        </div>
                        <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                            <button
                                onClick={() => setShowBatchModal(false)}
                                className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={() => {
                                    setShowBatchModal(false);
                                    processBatchFiles(batchFiles, primaryFileIndex);
                                }}
                                className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition-all active:scale-95"
                            >
                                开始合并
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FilesView;