/**
 * AI 生成 Hook
 * 封装 Gemini API 调用逻辑，统一处理错误和加载状态
 */

import { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { dialog } from '../services/dialog';

/**
 * 获取 Gemini API Key
 * 优先级：用户提供的 key > 环境变量
 */
const getEnvGeminiApiKey = () => {
  const env = (import.meta as any).env || {};
  return env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || (globalThis as any).__GEMINI_API_KEY__ || '';
};

interface UseAiGenerationOptions {
  /** 用户提供的 API Key（可选，优先级高于环境变量） */
  apiKey?: string;
  /** 成功回调 */
  onSuccess?: (result: string) => void;
  /** 错误回调 */
  onError?: (error: string) => void;
}

export function useAiGeneration(options: UseAiGenerationOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 生成内容
   * @param prompt 提示词
   * @param model 模型名称，默认为 gemini-3-flash-preview
   */
  const generate = async (prompt: string, model: string = 'gemini-3-flash-preview'): Promise<string | null> => {
    if (!prompt || loading) return null;

    // 获取 API Key（用户提供 > 环境变量）
    const apiKey = options.apiKey || getEnvGeminiApiKey();
    if (!apiKey) {
      const errorMsg = 'AI 生成失败，请先配置 Gemini API Key。';
      setError(errorMsg);
      await dialog.alert(errorMsg);
      options.onError?.(errorMsg);
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model,
        contents: prompt
      });

      // 清理返回的内容（移除 markdown 代码块标记）
      const generatedText = response.text
        ?.replace(/```css/g, '')
        .replace(/```/g, '')
        .trim() || '';

      if (generatedText) {
        options.onSuccess?.(generatedText);
        return generatedText;
      } else {
        const errorMsg = 'AI 返回内容为空';
        setError(errorMsg);
        options.onError?.(errorMsg);
        return null;
      }
    } catch (err) {
      console.error('AI generation failed:', err);
      const errorMsg = 'AI 生成失败，请检查网络连接或 API Key 是否正确。';
      setError(errorMsg);
      await dialog.alert(errorMsg);
      options.onError?.(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    generate,
    loading,
    error,
    clearError: () => setError(null)
  };
}
