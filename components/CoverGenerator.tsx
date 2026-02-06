
import React, { useRef, useState } from 'react';
import * as htmlToImage from 'html-to-image';
import { ProjectData, CoverDesign } from '../types';
import { Upload, Camera, Type, Check, Code, Loader2, Sparkles, Library, X, ChevronDown, ChevronUp, Palette, Plus, Settings2, Info } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface CoverGeneratorProps {
  project: ProjectData;
  onUpdateCover: (dataUrl: string) => void;
  onUpdateCoverCSS: (css: string) => void;
  onUpdateCoverDesign?: (design: CoverDesign) => void;
}

// --- Configuration Types ---
type FieldType = 'color' | 'number' | 'range' | 'select';

interface SnippetField {
  key: string;
  label: string;
  type: FieldType;
  default: any;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: string }[];
  unit?: string;
}

interface SnippetTemplate {
  id: string;
  name: string;
  selector: string;
  description?: string;
  fields: SnippetField[];
  generate: (values: any) => string;
}

// --- Predefined Snippets ---
const SNIPPET_TEMPLATES: SnippetTemplate[] = [
  {
    id: 'gradient_bg',
    name: '渐变背景',
    selector: '#cover-preview',
    fields: [
      { key: 'color1', label: '起始颜色', type: 'color', default: '#667eea' },
      { key: 'color2', label: '结束颜色', type: 'color', default: '#764ba2' },
      { key: 'angle', label: '角度', type: 'range', min: 0, max: 360, default: 135, unit: 'deg' }
    ],
    generate: (v) => `background: linear-gradient(${v.angle}deg, ${v.color1} 0%, ${v.color2} 100%);`
  },
  {
    id: 'text_glow',
    name: '文字发光',
    selector: '#cover-title',
    fields: [
      { key: 'color', label: '光晕颜色', type: 'color', default: '#ffffff' },
      { key: 'blur', label: '模糊半径', type: 'range', min: 0, max: 50, default: 10, unit: 'px' }
    ],
    generate: (v) => `text-shadow: 0 0 ${v.blur}px ${v.color}, 0 0 ${v.blur * 2}px ${v.color};`
  },
  {
    id: 'glass',
    name: '磨砂标题',
    selector: '#cover-title',
    fields: [
      { key: 'bgColor', label: '背景颜色', type: 'color', default: '#ffffff' },
      { key: 'opacity', label: '不透明度', type: 'range', min: 0, max: 1, step: 0.1, default: 0.2 },
      { key: 'blur', label: '模糊程度', type: 'range', min: 0, max: 20, default: 8, unit: 'px' },
      { key: 'radius', label: '圆角', type: 'number', default: 12, unit: 'px' }
    ],
    generate: (v) => {
        const hex = v.bgColor.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `background: rgba(${r}, ${g}, ${b}, ${v.opacity});
backdrop-filter: blur(${v.blur}px);
-webkit-backdrop-filter: blur(${v.blur}px);
padding: 20px;
border-radius: ${v.radius}px;
border: 1px solid rgba(255, 255, 255, 0.3);`;
    }
  },
  {
    id: 'border_frame',
    name: '内框线',
    selector: '#cover-preview',
    fields: [
      { key: 'color', label: '边框颜色', type: 'color', default: '#ffffff' },
      { key: 'width', label: '粗细', type: 'number', default: 2, unit: 'px' },
      { key: 'offset', label: '内缩距离', type: 'number', default: 16, unit: 'px' }
    ],
    generate: (v) => `outline: ${v.width}px solid ${v.color};
outline-offset: -${v.offset}px;`
  },
  {
    id: 'vignette',
    name: '暗角压暗',
    selector: '#cover-preview',
    fields: [
       { key: 'color', label: '暗角颜色', type: 'color', default: '#000000' },
       { key: 'intensity', label: '强度', type: 'range', min: 0, max: 100, default: 40, unit: '%' }
    ],
    generate: (v) => `box-shadow: inset 0 0 150px rgba(0,0,0, ${v.intensity / 100});`
  },
  {
    id: 'retro_grid',
    name: '复古网格',
    selector: '#cover-preview',
    fields: [
        { key: 'color', label: '线条颜色', type: 'color', default: '#ffffff' },
        { key: 'opacity', label: '透明度', type: 'range', min: 0.05, max: 0.5, step: 0.05, default: 0.1 },
        { key: 'size', label: '网格大小', type: 'number', default: 40, unit: 'px' }
    ],
    generate: (v) => {
        const hex = v.color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        const rgba = `rgba(${r},${g},${b},${v.opacity})`;
        return `background-image: 
linear-gradient(${rgba} 1px, transparent 1px),
linear-gradient(90deg, ${rgba} 1px, transparent 1px);
background-size: ${v.size}px ${v.size}px;`;
    }
  },
  {
    id: '3d_text',
    name: '立体文字',
    selector: '#cover-title',
    fields: [
       { key: 'color', label: '阴影颜色', type: 'color', default: '#555555' }
    ],
    generate: (v) => `text-shadow: 
1px 1px 0 ${v.color},
2px 2px 0 ${v.color},
3px 3px 0 ${v.color},
4px 4px 0 ${v.color};`
  },
  {
      id: 'author_deco',
      name: '作者修饰',
      selector: '#cover-author',
      fields: [
          { key: 'color', label: '线条颜色', type: 'color', default: '#ffffff' },
          { key: 'spacing', label: '字间距', type: 'number', default: 4, unit: 'px' }
      ],
      generate: (v) => `border-top: 1px solid ${v.color};
padding-top: 8px;
margin-top: 8px;
letter-spacing: ${v.spacing}px;
display: inline-block;`
  }
];

const CoverGenerator: React.FC<CoverGeneratorProps> = ({ project, onUpdateCover, onUpdateCoverCSS, onUpdateCoverDesign }) => {
  const coverRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTemplate, setActiveTemplate] = useState(0);
  const [status, setStatus] = useState<'idle' | 'generating' | 'success'>('idle');
  const [showCssEditor, setShowCssEditor] = useState(false); // Default hidden
  const [aiCoverPrompt, setAiCoverPrompt] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [selectedBgImage, setSelectedBgImage] = useState<string | null>(null);
  const [showTextOnCover, setShowTextOnCover] = useState(true);

  // --- Snippet Modal State ---
  const [activeSnippet, setActiveSnippet] = useState<SnippetTemplate | null>(null);
  const [snippetValues, setSnippetValues] = useState<Record<string, any>>({});

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
    if (!aiCoverPrompt || isAiGenerating) return;

    setIsAiGenerating(true);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
            setShowCssEditor(true); // Auto show editor to see result
        }

    } catch (error) {
        console.error("AI Cover CSS generation failed:", error);
        alert("AI 样式生成失败，请检查网络连接。");
    } finally {
        setIsAiGenerating(false);
    }
  };

  // --- Snippet Logic ---
  const toggleSnippetPopup = (template: SnippetTemplate) => {
      if (activeSnippet?.id === template.id) {
          setActiveSnippet(null);
      } else {
          const defaults: Record<string, any> = {};
          template.fields.forEach(f => defaults[f.key] = f.default);
          setSnippetValues(defaults);
          setActiveSnippet(template);
      }
  };

  const confirmSnippet = () => {
      if (!activeSnippet) return;
      const cssRule = activeSnippet.generate(snippetValues);
      const fullCss = `/* ${activeSnippet.name} */\n${activeSnippet.selector} {\n  ${cssRule.replace(/\n/g, '\n  ')}\n}`;
      
      const current = project.coverCustomCSS || '';
      const sep = current && !current.endsWith('\n') ? '\n\n' : '';
      onUpdateCoverCSS(current + sep + fullCss);
      
      setActiveSnippet(null);
  };

  const handleToggleSeries = () => {
    if (onUpdateCoverDesign) {
      onUpdateCoverDesign({
        ...project.coverDesign!,
        showSeries: !project.coverDesign?.showSeries
      });
    }
  };

  const templates = [
    { name: "商务蓝", bg: 'bg-gradient-to-br from-blue-900 to-gray-900', text: 'text-white', font: 'font-serif', series: 'text-white/60' },
    { name: "文艺粉", bg: 'bg-gradient-to-tr from-rose-100 to-teal-100', text: 'text-gray-800', font: 'font-sans', series: 'text-gray-500' },
    { name: "极客黑", bg: 'bg-gray-800', text: 'text-yellow-500', font: 'font-mono', series: 'text-yellow-500/50' },
    { name: "经典白", bg: 'bg-white border-8 border-double border-gray-900', text: 'text-black', font: 'font-serif', series: 'text-gray-400' },
  ];

  const currentTemplate = templates[activeTemplate];

  return (
    <div className="h-full flex flex-col md:flex-row p-6 gap-6 bg-[#F5F5F7] overflow-hidden relative">
      
      {/* Left: Controls */}
      <div className="w-full md:w-1/3 flex flex-col space-y-6 overflow-y-auto pr-2 pb-6 custom-scrollbar">
        
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
                <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg mb-4">
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
                
                {showTextOnCover && (
                  <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-700">显示系列丛书</span>
                        {!project.metadata.series && <span className="text-[10px] text-gray-400 flex items-center mt-0.5"><Info size={10} className="mr-1"/> 需在“书籍信息”中填写</span>}
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={project.coverDesign?.showSeries || false} onChange={handleToggleSeries} disabled={!project.metadata.series} />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                  </div>
                )}
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
                <button onClick={handleAiGenerateCoverCss} disabled={isAiGenerating || !aiCoverPrompt} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg flex items-center justify-center transition-all shadow-md shadow-blue-500/20 active:scale-95 font-semibold text-xs disabled:bg-blue-300 disabled:cursor-not-allowed">
                    {isAiGenerating ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Sparkles size={14} className="mr-2" />}
                    {isAiGenerating ? '生成中...' : '生成样式'}
                </button>
            </div>
            
            <div className="border-t border-gray-100 pt-4">
                <div 
                    onClick={() => setShowCssEditor(!showCssEditor)} 
                    className="flex items-center justify-between cursor-pointer group mb-3 select-none"
                >
                    <span className="text-sm font-bold text-gray-700 flex items-center">
                        <Code size={16} className="mr-2 text-gray-400 group-hover:text-blue-500" />
                        {showCssEditor ? '隐藏 CSS 编辑器' : '自定义 CSS (Advanced)'}
                    </span>
                    {showCssEditor ? <ChevronUp size={16} className="text-gray-400"/> : <ChevronDown size={16} className="text-gray-400"/>}
                </div>
                
                {showCssEditor && (
                    <div className="animate-in slide-in-from-top-2 fade-in duration-300">
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-4 relative">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">快速添加样式</label>
                            
                            <div className="grid grid-cols-2 gap-3 relative">
                                 {SNIPPET_TEMPLATES.map((snippet, idx) => {
                                    const isActive = activeSnippet?.id === snippet.id;
                                    return (
                                        <div key={snippet.id} className="relative group/snippet">
                                            <button
                                                onClick={() => toggleSnippetPopup(snippet)}
                                                className={`w-full py-3 px-2 rounded-xl border transition-all flex flex-col items-center justify-center gap-2 ${
                                                    isActive 
                                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30' 
                                                    : 'bg-white border-gray-100 text-gray-600 hover:border-blue-300 hover:text-blue-600 hover:shadow-md'
                                                }`}
                                            >
                                                <Plus size={16} className={isActive ? 'text-blue-200' : 'text-gray-300'}/>
                                                <span className="text-xs font-bold">{snippet.name}</span>
                                            </button>
                                            
                                            {isActive && (
                                                <div className={`absolute top-full mt-3 z-50 w-64 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 p-4 animate-in fade-in zoom-in-95 duration-200 ${idx % 2 === 0 ? 'left-0' : 'right-0'}`}>
                                                    <div className="flex justify-between items-center mb-3 border-b border-gray-100 pb-2">
                                                        <h4 className="text-xs font-bold text-gray-800 flex items-center">
                                                            <Palette size={12} className="mr-1.5 text-blue-500"/> 配置{snippet.name}
                                                        </h4>
                                                        <button onClick={() => setActiveSnippet(null)} className="text-gray-400 hover:text-gray-600"><X size={14}/></button>
                                                    </div>

                                                    <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                                                        {snippet.fields.map(field => (
                                                            <div key={field.key}>
                                                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 flex justify-between">
                                                                    <span>{field.label}</span>
                                                                    {field.type === 'range' && <span className="text-gray-400 font-mono">{snippetValues[field.key]}{field.unit}</span>}
                                                                </label>
                                                                
                                                                {field.type === 'color' && (
                                                                    <div className="flex items-center space-x-2">
                                                                        <input 
                                                                            type="color" 
                                                                            value={snippetValues[field.key] || field.default} 
                                                                            onChange={e => setSnippetValues(prev => ({...prev, [field.key]: e.target.value}))}
                                                                            className="h-8 w-8 rounded-lg cursor-pointer border border-gray-200 p-0 overflow-hidden shadow-sm"
                                                                        />
                                                                        <input 
                                                                            type="text" 
                                                                            value={snippetValues[field.key] || field.default} 
                                                                            onChange={e => setSnippetValues(prev => ({...prev, [field.key]: e.target.value}))}
                                                                            className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-xs font-mono uppercase focus:ring-2 focus:ring-blue-500 outline-none"
                                                                        />
                                                                    </div>
                                                                )}

                                                                {field.type === 'number' && (
                                                                    <div className="relative">
                                                                        <input 
                                                                            type="number"
                                                                            value={snippetValues[field.key] || field.default}
                                                                            onChange={e => setSnippetValues(prev => ({...prev, [field.key]: Number(e.target.value)}))}
                                                                            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                                                                        />
                                                                        {field.unit && <span className="absolute right-3 top-1.5 text-[10px] text-gray-400">{field.unit}</span>}
                                                                    </div>
                                                                )}

                                                                {field.type === 'range' && (
                                                                    <input 
                                                                        type="range"
                                                                        min={field.min}
                                                                        max={field.max}
                                                                        step={field.step || 1}
                                                                        value={snippetValues[field.key] || field.default}
                                                                        onChange={e => setSnippetValues(prev => ({...prev, [field.key]: Number(e.target.value)}))}
                                                                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 block mt-2"
                                                                    />
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="flex justify-end pt-2 border-t border-gray-100">
                                                        <button 
                                                            onClick={confirmSnippet} 
                                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-3 rounded-lg shadow-md shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center"
                                                        >
                                                            <Check size={14} className="mr-1.5"/> 确认添加
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                 })}
                            </div>
                        </div>
                        <textarea 
                            className="w-full h-40 bg-gray-900 text-green-400 font-mono text-xs p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y shadow-inner" 
                            placeholder="/* 输入 CSS */&#10;#cover-preview { ... }&#10;#cover-title { ... }" 
                            value={project.coverCustomCSS || ''} 
                            onChange={(e) => onUpdateCoverCSS(e.target.value)} 
                        />
                    </div>
                )}
            </div>

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
              className={`w-[320px] h-[480px] shadow-2xl flex flex-col items-center justify-center p-8 text-center transition-all duration-300 relative overflow-hidden ${!selectedBgImage ? currentTemplate.bg : ''}`}
              style={{ minWidth: '320px', minHeight: '480px', backgroundImage: selectedBgImage ? `url(${selectedBgImage})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}
            >
              <style>{project.coverCustomCSS}</style>
              {selectedBgImage && showTextOnCover && <div className="absolute inset-0 bg-black/20" ></div>}

              {showTextOnCover && (
                <>
                  {project.coverDesign?.showSeries && project.metadata.series && (
                    <div id="cover-series" className={`text-[10px] uppercase tracking-[0.3em] font-bold mb-3 z-10 ${currentTemplate.series} ${currentTemplate.font}`}>
                        {project.metadata.series}
                    </div>
                  )}
                  <h1 id="cover-title" className={`text-4xl font-bold mb-6 break-words w-full z-10 ${currentTemplate.text} ${currentTemplate.font} leading-tight`}>
                    {project.metadata.title || "Book Title"}
                  </h1>
                  <div className={`w-16 h-1 mb-8 z-10 ${currentTemplate.text === 'text-white' ? 'bg-white/80' : 'bg-gray-800/80'}`}></div>
                  <h2 id="cover-author" className={`text-xl z-10 ${currentTemplate.text} ${currentTemplate.font}`}>
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
