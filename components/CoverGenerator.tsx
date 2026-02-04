import React, { useRef, useState } from 'react';
import * as htmlToImage from 'html-to-image';
import { ProjectData } from '../types';
import { Upload, Camera, Type, Check, Code, Loader2, Sparkles, Library, X } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface CoverGeneratorProps {
  project: ProjectData;
  onUpdateCover: (dataUrl: string) => void;
  onUpdateCoverCSS: (css: string) => void;
  apiKey: string;
  onShowApiKeyModal: () => void;
}

const CoverGenerator: React.FC<CoverGeneratorProps> = ({ project, onUpdateCover, onUpdateCoverCSS, apiKey, onShowApiKeyModal }) => {
  const coverRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTemplate, setActiveTemplate] = useState(0);
  const [status, setStatus] = useState<'idle' | 'generating' | 'success'>('idle');
  const [showCssEditor, setShowCssEditor] = useState(false);
  const [aiCoverPrompt, setAiCoverPrompt] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [selectedBgImage, setSelectedBgImage] = useState<string | null>(null);
  const [showTextOnCover, setShowTextOnCover] = useState(true);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onUpdateCover(event.target.result as string);
          setSelectedBgImage(null); // Uploading a full cover resets the background generator
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectImageFromLibrary = (imageDataUrl: string) => {
    setSelectedBgImage(imageDataUrl);
  };

  const generateCover = async () => {
    if (coverRef.current && status !== 'generating') {
      try {
        setStatus('generating');
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const dataUrl = await htmlToImage.toPng(coverRef.current, { 
            quality: 0.95,
            pixelRatio: 2
        });
        
        onUpdateCover(dataUrl);
        setStatus('success');
        
        setTimeout(() => setStatus('idle'), 2000);
      } catch (error) {
        console.error('Error generating cover:', error);
        setStatus('idle');
      }
    }
  };
  
  const handleAiGenerateCoverCss = async () => {
    if (!apiKey) {
      alert("请先设置您的 Gemini API 密钥。");
      onShowApiKeyModal();
      return;
    }
    if (!aiCoverPrompt || isAiGenerating) return;

    setIsAiGenerating(true);
    try {
        const ai = new GoogleGenAI({ apiKey });
        const fullPrompt = `
        You are an expert book cover designer. Generate CSS code to style a book cover based on the user's request.
        You should only provide CSS rules. Do not include explanations or markdown backticks.
        The HTML structure is a main div with id #cover-preview, containing an h1 with id #cover-title and an h2 with id #cover-author.
        
        User's request: "${aiCoverPrompt}"

        Generate the CSS code now. For example:
        #cover-preview { background: linear-gradient(45deg, #1d2b64, #f8cdda); }
        #cover-title { font-family: 'Garamond', serif; color: white; text-shadow: 2px 2px 5px black; }
        #cover-author { font-style: italic; color: #e0e0e0; }
        `;
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: fullPrompt
        });

        const generatedCss = response.text?.replace(/```css/g, '').replace(/```/g, '').trim() || '';
        
        if (generatedCss) {
            onUpdateCoverCSS(generatedCss);
        }

    } catch (error) {
        console.error("AI Cover CSS generation failed:", error);
        alert("AI 样式生成失败，请检查您的 API 密钥或网络连接。");
    } finally {
        setIsAiGenerating(false);
    }
  };

  const templates = [
    { name: "商务蓝", bg: 'bg-gradient-to-br from-blue-900 to-gray-900', text: 'text-white', font: 'font-serif' },
    { name: "文艺粉", bg: 'bg-gradient-to-tr from-rose-100 to-teal-100', text: 'text-gray-800', font: 'font-sans' },
    { name: "极客黑", bg: 'bg-gray-800', text: 'text-yellow-500', font: 'font-mono' },
    { name: "经典白", bg: 'bg-white border-8 border-double border-gray-900', text: 'text-black', font: 'font-serif' },
  ];

  return (
    <div className="h-full flex flex-col md:flex-row p-6 gap-6 bg-[#F5F5F7] overflow-hidden">
      
      {/* Left: Controls */}
      <div className="w-full md:w-1/3 flex flex-col space-y-6 overflow-y-auto pr-2 pb-6">
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-4 flex items-center text-gray-800">
            <Upload className="mr-2 text-blue-500" size={20} /> 1. 上传或选择图片
          </h3>
          <p className="text-xs text-gray-500 mb-4">您可以上传最终封面，或从素材库选择一张图片作为背景。</p>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={handleFileUpload}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl transition-colors border border-gray-200 dashed mb-4"
          >
            上传完整封面...
          </button>
          
          <div>
              <h4 className="text-sm font-semibold text-gray-600 mb-3 flex items-center"><Library size={16} className="mr-2 text-green-500"/> 从素材库选择背景</h4>
              <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto bg-gray-50/50 p-2 rounded-lg border">
                 {project.images.map(img => (
                    <button key={img.id} onClick={() => handleSelectImageFromLibrary(img.data)} className="aspect-square border-2 border-transparent hover:border-blue-500 rounded-md overflow-hidden p-0.5 focus:outline-none focus:ring-2 focus:ring-blue-400">
                       <img src={img.data} alt={img.name} className="w-full h-full object-cover rounded-sm" />
                    </button>
                 ))}
                 {project.images.length === 0 && <p className="col-span-4 text-xs text-center text-gray-400 py-4">素材库为空</p>}
              </div>
              {selectedBgImage && <button onClick={() => setSelectedBgImage(null)} className="text-xs text-gray-500 hover:text-red-500 mt-2 flex items-center"><X size={12} className="mr-1"/>清除背景</button>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex-1">
          <h3 className="text-lg font-bold mb-4 flex items-center text-gray-800">
            <Type className="mr-2 text-purple-500" size={20} /> 2. 设计与生成
          </h3>
          <div className="space-y-5">
            <div>
                <label className="block text-sm font-semibold text-gray-600 mb-3">封面模式</label>
                <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setShowTextOnCover(true)}
                        className={`w-full text-center px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${showTextOnCover ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:bg-gray-200/50'}`}
                    >
                        图文封面
                    </button>
                    <button
                        onClick={() => setShowTextOnCover(false)}
                        className={`w-full text-center px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${!showTextOnCover ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:bg-gray-200/50'}`}
                    >
                        纯图封面
                    </button>
                </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-3">预设风格</label>
              <div className="grid grid-cols-2 gap-3">
                {templates.map((t, idx) => (
                  <button key={idx} onClick={() => setActiveTemplate(idx)} className={`h-12 w-full rounded-lg border-2 transition-all flex items-center justify-center text-xs font-medium ${ activeTemplate === idx ? 'border-blue-500 ring-2 ring-blue-100 shadow-md' : 'border-gray-200 hover:border-blue-300' }`}><span className={`w-3 h-3 rounded-full mr-2 border border-black/10 ${t.bg}`}></span>{t.name}</button>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100 space-y-3">
                <h4 className="text-sm font-semibold text-gray-600 flex items-center"><Sparkles size={16} className="mr-2 text-yellow-500"/> AI 封面设计</h4>
                <textarea className="w-full h-20 bg-white/70 text-sm p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none shadow-inner" placeholder="例如：黑暗奇幻风格，标题用破碎的哥特字体..." value={aiCoverPrompt} onChange={(e) => setAiCoverPrompt(e.target.value)} />
                <button onClick={handleAiGenerateCoverCss} disabled={isAiGenerating || !aiCoverPrompt} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center justify-center transition-all shadow-md shadow-blue-500/20 active:scale-95 font-semibold text-xs disabled:bg-blue-300 disabled:cursor-not-allowed">
                    {isAiGenerating ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Sparkles size={14} className="mr-2" />}
                    {isAiGenerating ? '生成中...' : '生成样式'}
                </button>
            </div>
            
            <div><button onClick={() => setShowCssEditor(!showCssEditor)} className="text-xs font-semibold text-gray-500 flex items-center hover:text-blue-600 transition-colors"><Code size={14} className="mr-1" /> {showCssEditor ? '隐藏 CSS 编辑器' : '自定义 CSS (Advanced)'}</button>{showCssEditor && (<textarea className="w-full h-32 mt-2 bg-gray-900 text-green-400 font-mono text-xs p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="/* 输入 CSS */&#10;#cover-preview { ... }&#10;#cover-title { ... }" value={project.coverCustomCSS || ''} onChange={(e) => onUpdateCoverCSS(e.target.value)} />)}</div>

            <button onClick={generateCover} disabled={status !== 'idle'} className={`w-full py-3 rounded-xl flex items-center justify-center font-bold text-white transition-all duration-300 shadow-lg ${ status === 'success' ? 'bg-green-500 shadow-green-200' : status === 'generating' ? 'bg-blue-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 hover:scale-[1.02] active:scale-95' }`}>{status === 'generating' && <Loader2 size={18} className="mr-2 animate-spin" />}{status === 'success' && <Check size={18} className="mr-2" />}{status === 'idle' && <Camera size={18} className="mr-2" />}{status === 'generating' ? '正在渲染...' : status === 'success' ? '封面已更新!' : '生成并应用封面'}</button>
          </div>
        </div>
      </div>

      <div className="w-full md:w-2/3 bg-gray-200/50 rounded-3xl border border-gray-200 flex flex-col items-center justify-center p-8 relative overflow-hidden">
         <div className="absolute inset-0 pattern-grid opacity-10 pointer-events-none"></div>
         <div className="relative group mb-8">
            <div className="absolute -inset-4 bg-white/40 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div 
              id="cover-preview"
              ref={coverRef}
              className={`w-[320px] h-[480px] shadow-2xl flex flex-col items-center justify-center p-8 text-center transition-all duration-300 relative overflow-hidden ${!selectedBgImage ? templates[activeTemplate].bg : ''}`}
              style={{ minWidth: '320px', minHeight: '480px', backgroundImage: selectedBgImage ? `url(${selectedBgImage})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}
            >
              <style>{project.coverCustomCSS}</style>
              {selectedBgImage && showTextOnCover && <div className="absolute inset-0 bg-black/20" ></div>}

              {showTextOnCover && (
                <>
                  <h1 id="cover-title" className={`text-4xl font-bold mb-6 break-words w-full z-10 ${templates[activeTemplate].text} ${templates[activeTemplate].font} leading-tight`}>
                    {project.metadata.title || "Book Title"}
                  </h1>
                  <div className={`w-16 h-1 mb-8 z-10 ${templates[activeTemplate].text === 'text-white' ? 'bg-white/80' : 'bg-gray-800/80'}`}></div>
                  <h2 id="cover-author" className={`text-xl z-10 ${templates[activeTemplate].text} ${templates[activeTemplate].font}`}>
                    {project.metadata.creator || "Author Name"}
                  </h2>
                </>
              )}

              {!selectedBgImage && showTextOnCover && activeTemplate === 0 && <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full"></div>}
              {!selectedBgImage && showTextOnCover && activeTemplate === 1 && <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-white/20 to-transparent"></div>}
            </div>
         </div>
         {project.cover && (<div className="flex items-center space-x-3 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span><span className="text-xs font-medium text-gray-500">当前已应用此封面</span></div>)}
      </div>
    </div>
  );
};

export default CoverGenerator;
