import React, { useState, useRef } from 'react';
import { Trash2, UploadCloud, Image as ImageIcon, FileText } from 'lucide-react';
import { ImageAsset } from '../../types';

interface ImagesViewProps {
  images: ImageAsset[];
  onUpdateImages: (images: ImageAsset[]) => void;
}

// --- Helper Functions ---
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const getImageDetails = (file: File): Promise<ImageAsset> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        resolve({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          name: file.name,
          data: dataUrl,
          type: file.type,
          dimensions: `${img.naturalWidth} × ${img.naturalHeight}`,
          size: file.size,
        });
      };
      img.onerror = reject;
      img.src = dataUrl;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};


// --- Components ---

const ImageCard: React.FC<{ image: ImageAsset; onDelete: (id: string) => void }> = ({ image, onDelete }) => (
  <div className="relative group bg-white p-2 rounded-2xl border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
    <div className="aspect-square bg-gray-50 rounded-xl mb-2 flex items-center justify-center overflow-hidden">
      <img src={image.data} alt={image.name} className="object-contain w-full h-full" />
    </div>
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none p-3 flex flex-col justify-end">
       <p className="text-xs font-bold text-white truncate">{image.name}</p>
       <div className="flex items-center text-[10px] text-white/70 mt-1">
          <ImageIcon size={10} className="mr-1" /> {image.dimensions}
          <span className="mx-1.5">·</span>
          <FileText size={10} className="mr-1" /> {formatBytes(image.size)}
       </div>
    </div>
    <button onClick={() => onDelete(image.id)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95 z-10">
      <Trash2 size={14} />
    </button>
  </div>
);

const SkeletonCard: React.FC = () => (
    <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm animate-pulse">
        <div className="aspect-square bg-gray-200 rounded-xl"></div>
    </div>
);


const ImagesView: React.FC<ImagesViewProps> = ({ images, onUpdateImages }) => {
  const [dragActive, setDragActive] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const processFiles = async (files: FileList | File[]) => {
      const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
      if (imageFiles.length === 0) return;

      const tempIds = imageFiles.map(f => f.name + f.lastModified);
      setLoadingFiles(prev => [...prev, ...tempIds]);

      const newAssets = await Promise.all(imageFiles.map(getImageDetails));
      
      onUpdateImages([...images, ...newAssets]);
      setLoadingFiles(prev => prev.filter(id => !tempIds.includes(id)));
  };

  // --- Event Handlers ---
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleUploadClick = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
      // Reset input value to allow re-uploading the same file
      e.target.value = '';
    }
  };

  const handleDelete = (id: string) => {
    onUpdateImages(images.filter(img => img.id !== id));
  };

  return (
    <div className="p-8 h-full bg-[#F5F5F7] overflow-y-auto" onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">图片素材</h2>
        <span className="text-sm font-medium text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-200">{images.length} 张图片</span>
      </div>

      <div 
        onClick={() => fileInputRef.current?.click()}
        className={`relative w-full p-8 rounded-3xl mb-8 flex flex-col items-center justify-center border-2 border-dashed transition-all duration-300 cursor-pointer group ${dragActive ? 'border-blue-500 bg-blue-50 scale-[1.02]' : 'border-gray-300 hover:border-blue-400 bg-white'}`}
      >
        <div className={`absolute inset-0 bg-white transition-opacity ${dragActive ? 'opacity-50' : 'opacity-0'}`}></div>
        <input 
            ref={fileInputRef}
            type="file" 
            accept="image/*" 
            multiple 
            className="hidden" 
            onChange={handleUploadClick} 
        />
        <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 mb-4 ${dragActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-500'}`}>
            <UploadCloud size={32} />
        </div>
        <p className="text-lg font-semibold text-gray-700">{dragActive ? '释放以开始上传' : '拖拽图片到此处'}</p>
        <p className="text-sm text-gray-500 mt-1">或 <span className="text-blue-600 font-medium">点击浏览文件</span></p>
      </div>
      
      {images.length === 0 && loadingFiles.length === 0 && (
          <div className="text-center py-16">
              <p className="text-gray-400">暂无图片素材</p>
          </div>
      )}

      <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-6">
         {images.map((img) => (
            <ImageCard key={img.id} image={img} onDelete={handleDelete} />
         ))}
         {loadingFiles.map((id) => (
            <SkeletonCard key={id} />
         ))}
      </div>
    </div>
  );
};

export default ImagesView;