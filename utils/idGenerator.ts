/**
 * 统一的 ID 生成器
 * 使用时间戳 + 随机字符串确保唯一性
 */

/**
 * 生成唯一 ID
 * 格式: {timestamp}_{random}
 * 例如: 1710334567890_k3j2h9x
 */
export const generateUniqueId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${timestamp}_${random}`;
};

/**
 * 生成指定前缀的唯一 ID
 * @param prefix 前缀，如 'chapter', 'image'
 */
export const generateId = (prefix?: string): string => {
  const id = generateUniqueId();
  return prefix ? `${prefix}_${id}` : id;
};

/**
 * 验证 ID 格式是否有效
 * @param id 待验证的 ID
 */
export const isValidId = (id: string): boolean => {
  if (!id || typeof id !== 'string') return false;
  // 基本格式检查：不能为空，长度合理
  return id.length > 5 && id.length < 100;
};

/**
 * 批量生成唯一 ID
 * @param count 数量
 */
export const generateBatchIds = (count: number): string[] => {
  const ids = new Set<string>();
  while (ids.size < count) {
    ids.add(generateUniqueId());
  }
  return Array.from(ids);
};
