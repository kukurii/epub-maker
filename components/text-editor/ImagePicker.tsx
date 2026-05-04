import React from 'react';
import { X, ImageIcon } from 'lucide-react';
import { ImageAsset } from '../../types';

interface ImagePickerProps {
  images: ImageAsset[];
  onInsert: (img: ImageAsset) => void;
  onClose: () => void;
}

/**
 * 图片选择弹窗
 * 从素材库中选择图片插入到编辑器
 */
const ImagePicker: React.FC<ImagePickerProps> = ({ images, onInsert, onClose }) => {
  return (
    <div className="absolute inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 md:p-8">
      <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-2xl w-full max-h-[80%] flex flex-col animate-in zoom-in-95 duration-200">
        {/* 标题栏 */}
        <div className="flex justify-between mb-4">
          <h3 className="font-bold text-gray-800">选择图片插入</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X />
          </button>
        </div>

        {/* 图片网格 */}
        <div className="overflow-y-auto grid grid-cols-3 md:grid-cols-4 gap-4 p-2 custom-scrollbar">
          {images.map((img) => (
            <button
              key={img.id}
              onClick={() => onInsert(img)}
              className="border border-gray-200 rounded-xl p-2 hover:border-blue-500
                hover:ring-2 hover:ring-blue-100 transition-all bg-gray-50"
            >
              <img
                src={img.data}
                className="w-full h-24 object-contain rounded-lg mb-2 bg-white"
                alt={img.name}
              />
              <p className="text-[10px] text-gray-500 truncate w-full">{img.name}</p>
            </button>
          ))}

          {images.length === 0 && (
            <div className="col-span-4 py-10 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <ImageIcon size={32} className="mb-2 opacity-50" />
              <p>素材库为空，请先在"图片素材"中上传</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImagePicker;
