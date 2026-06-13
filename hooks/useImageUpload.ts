/**
 * 图片上传 Hook（阶段三优化版）
 *
 * 改进：
 * 1. 支持多图片同时上传
 * 2. 增强错误处理和用户反馈
 * 3. 添加图片压缩提示
 * 4. 优化拖拽体验
 */

import { useCallback, useRef, useState } from 'react';
import { ImageAsset } from '../types';
import { getNextImageId, sanitizeFilename } from '../components/text-editor/editorHelpers';

interface UseImageUploadOptions {
  onUpload: (image: ImageAsset) => void;
  images: ImageAsset[]; // 当前已有的图片列表，用于生成正确的ID
  maxSize?: number; // 最大文件大小（字节），默认 5MB
  allowedTypes?: string[]; // 允许的文件类型
  maxBatchSize?: number; // 批量上传最大数量
}

export const useImageUpload = ({
  onUpload,
  images,
  maxSize = 5 * 1024 * 1024, // 5MB
  allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  maxBatchSize = 10,
}: UseImageUploadOptions) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const dragCounter = useRef(0);

  /**
   * 处理单个文件上传
   */
  const processFile = useCallback(
    async (file: File): Promise<boolean> => {
      setError(null);

      // 验证文件类型
      if (!allowedTypes.includes(file.type)) {
        setError(`不支持的文件类型: ${file.type}`);
        return false;
      }

      // 验证文件大小
      if (file.size > maxSize) {
        const maxSizeMB = (maxSize / 1024 / 1024).toFixed(1);
        setError(`文件 "${file.name}" 过大，最大支持 ${maxSizeMB}MB`);
        return false;
      }

      // 大图片警告（超过2MB）
      if (file.size > 2 * 1024 * 1024) {
        console.warn(`⚠️ 图片 "${file.name}" 较大 (${(file.size / 1024 / 1024).toFixed(2)}MB)，建议压缩后上传`);
      }

      try {
        // 读取文件为 Data URL
        const dataUrl = await readFileAsDataURL(file);

        // 获取图片尺寸
        const dimensions = await getImageDimensions(dataUrl);

        // 生成唯一ID
        const id = getNextImageId(images);

        // 清理文件名
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
        return true;
      } catch (err) {
        console.error('Image upload error:', err);
        setError(`图片 "${file.name}" 上传失败，请重试`);
        return false;
      }
    },
    [allowedTypes, maxSize, onUpload, images]
  );

  /**
   * 处理多个文件上传
   */
  const processFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      // 限制批量上传数量
      if (files.length > maxBatchSize) {
        setError(`一次最多上传 ${maxBatchSize} 张图片`);
        return;
      }

      setIsProcessing(true);
      setUploadProgress(0);

      let successCount = 0;
      const total = files.length;

      for (let i = 0; i < files.length; i++) {
        const success = await processFile(files[i]);
        if (success) successCount++;

        setUploadProgress(Math.round(((i + 1) / total) * 100));

        // 延迟一下，避免UI卡顿
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      setIsProcessing(false);
      setUploadProgress(0);

      if (successCount < total) {
        setError(`成功上传 ${successCount}/${total} 张图片`);
      }
    },
    [processFile, maxBatchSize]
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

      // 处理所有图片文件
      processFiles(imageFiles);
    },
    [processFiles]
  );

  /**
   * 处理粘贴
   */
  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            imageFiles.push(file);
          }
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault();
        processFiles(imageFiles);
      }
    },
    [processFiles]
  );

  /**
   * 处理文件选择
   */
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        processFiles(Array.from(files));
      }
      // 清空 input，允许重复选择同一个文件
      e.target.value = '';
    },
    [processFiles]
  );

  return {
    isDragging,
    isProcessing,
    error,
    uploadProgress,
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

