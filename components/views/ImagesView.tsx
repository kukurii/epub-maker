import React from 'react';
import { Trash2 } from 'lucide-react';
import { ImageAsset } from '../../types';

interface ImagesViewProps {
  images: ImageAsset[];
  onUpdateImages: (images: ImageAsset[]) => void;
}

const ImagesView: React.FC<ImagesViewProps> = ({ images, onUpdateImages }) => {
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const data = ev.target?.result as string;
          onUpdateImages([
            ...images,
            { 
              id: Date.now().toString() + Math.random().toString(36).substr(2, 5), 
              name: file.name, 
              data, 
              type: file.type 
            }
          ]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleDelete = (id: string) => {
    onUpdateImages(images.filter(img => img.id !== id));
  };

  return (
    <div className="p-8 h-full bg-[#F5F5F7] overflow-y-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 tracking-tight">图片素材</h2>
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8 flex flex-col items-center justify-center border-dashed border-2 border-gray-200 hover:border-blue-400 transition-colors">
         <p className="text-gray-500 mb-4 font-medium">点击上传图片</p>
         <input type="file" accept="image/*" multiple className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-full file:border-0 file:bg-black file:text-white hover:file:bg-gray-800 cursor-pointer max-w-xs mx-auto" onChange={handleImageUpload} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
         {images.map((img) => (
            <div key={img.id} className="relative group bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
               <div className="aspect-square bg-gray-50 rounded-xl mb-3 flex items-center justify-center overflow-hidden"><img src={img.data} alt={img.name} className="object-contain w-full h-full" /></div>
               <p className="text-xs truncate text-center text-gray-500 font-medium px-1">{img.name}</p>
               <button onClick={() => handleDelete(img.id)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button>
            </div>
         ))}
      </div>
    </div>
  );
};

export default ImagesView;