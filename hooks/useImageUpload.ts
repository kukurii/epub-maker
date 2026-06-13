/**
 * 图片上传 Hook
 * 支持拖拽、粘贴、选择文件
 */

import { useCallback, useRef, useState } from 'react';
import { ImageAsset } from '../types';
import { getNextImageId, sanitizeFilename } from '../components/text-editor/editorHelpers';

interface UseImageUploadOptions {
  onUpload: (image: ImageAsset) => void;
  images: ImageAsset[]; // 当前已有的图片列表，用于生成正确的ID
  maxSize?: number; // 最大文件大小（字节），默认 5MB
  allowedTypes?: string[]; // 允许的文件类型
}

export const useImageUpload = ({
  onUpload,
  images,
  maxSize = 5 * 1024 * 1024, // 5MB
  allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
}: UseImageUploadOptions) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dragCounter = useRef(0);

  /**
   * 处理文件上传
   */
  const processFile = useCallback(
    async (file: File) => {
      setError(null);

      // 验证文件类型
      if (!allowedTypes.includes(file.type)) {
        setError(`不支持的文件类型: ${file.type}`);
        return;
      }

      // 验证文件大小
      if (file.size > maxSize) {
        const maxSizeMB = (maxSize / 1024 / 1024).toFixed(1);
        setError(`文件过大，最大支持 ${maxSizeMB}MB`);
        return;
      }

      setIsProcessing(true);

      try {
        // 读取文件为 Data URL
        const dataUrl = await readFileAsDataURL(file);

        // 获取图片尺寸
        const dimensions = await getImageDimensions(dataUrl);

        // 生成唯一ID（修复：使用统一的ID生成策略）
        const id = getNextImageId(images);

        // 清理文件名（修复：防止不安全字符）
        const safeName = sanitizeFilename(file.name);

        const imageAsset: ImageAsset = {
          id,
          name: safeName,
          data: dataUrl,
          type: file.type,
          dimensions: `${dimensions.width}×${dimensions.height}`,
          size: file.size,
        };

        onUpload(imageAsset);
      } catch (err) {
        console.error('Image upload error:', err);
        setError('图片上传失败，请重试');
      } finally {
        setIsProcessing(false);
      }
    },
    [allowedTypes, maxSize, onUpload, images]
  );

  /**
   * 处理拖拽进入
   */
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  /**
   * 处理拖拽离开
   */
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  /**
   * 处理拖拽悬停
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  /**
   * 处理拖拽放下
   */
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      setIsDragging(false);
      dragCounter.current = 0;

      const files = Array.from(e.dataTransfer.files);
      const imageFiles = files.filter((file) => file.type.startsWith('image/'));

      if (imageFiles.length === 0) {
        setError('请拖入图片文件');
        return;
      }

      // 处理第一个图片文件
      processFile(imageFiles[0]);
    },
    [processFile]
  );

  /**
   * 处理粘贴
   */
  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            processFile(file);
          }
          break;
        }
      }
    },
    [processFile]
  );

  /**
   * 处理文件选择
   */
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        processFile(files[0]);
      }
      // 清空 input，允许重复选择同一个文件
      e.target.value = '';
    },
    [processFile]
  );

  return {
    isDragging,
    isProcessing,
    error,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handlePaste,
    handleFileSelect,
    clearError: () => setError(null),
  };
};

/**
 * 读取文件为 Data URL
 */
const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * 获取图片尺寸
 */
const getImageDimensions = (dataUrl: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = reject;
    img.src = dataUrl;
  });
};
