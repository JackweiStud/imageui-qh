/**
 * 历史记录服务 - IndexedDB 实现
 * 前端本地存储，无需后端
 */

import { HistoryItem } from './types';

const DB_NAME = 'StyleMorphDB';
const STORE_NAME = 'history';
const DB_VERSION = 1;
const MAX_HISTORY_COUNT = 500;

/**
 * 打开数据库连接
 */
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB open failed:', (event.target as IDBOpenDBRequest).error);
      reject('IndexedDB open failed');
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
};

/**
 * 获取所有历史记录
 */
export const getHistory = async (): Promise<HistoryItem[]> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const items = request.result as HistoryItem[];
        items.sort((a, b) => b.timestamp - a.timestamp);
        resolve(items);
      };

      request.onerror = () => {
        console.error('Failed to get history:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Failed to load history from IDB:', error);
    return [];
  }
};

/**
 * 保存新的历史记录项
 */
export const saveHistory = async (item: Omit<HistoryItem, 'id' | 'timestamp'>): Promise<HistoryItem | null> => {
  try {
    const newItem: HistoryItem = {
      ...item,
      id: generateId(),
      timestamp: Date.now(),
    };

    const db = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const addRequest = store.add(newItem);

      addRequest.onerror = () => {
        console.error('Failed to add item:', addRequest.error);
      };

      const index = store.index('timestamp');
      const countRequest = store.count();

      countRequest.onsuccess = () => {
        if (countRequest.result > MAX_HISTORY_COUNT) {
          const deleteCount = countRequest.result - MAX_HISTORY_COUNT;
          let deleted = 0;

          const cursorRequest = index.openCursor();

          cursorRequest.onsuccess = (e) => {
            const cursor = (e.target as IDBRequest).result as IDBCursor;
            if (cursor && deleted < deleteCount) {
              cursor.delete();
              deleted++;
              cursor.continue();
            }
          };
        }
      };

      transaction.oncomplete = () => resolve(newItem);
      transaction.onerror = () => {
        console.error('Transaction failed:', transaction.error);
        reject(transaction.error);
      };
    });
  } catch (error) {
    console.error('Failed to save history to IDB:', error);
    return null;
  }
};

/**
 * 删除单条历史记录
 */
export const deleteHistoryItem = async (id: string): Promise<boolean> => {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.delete(id);

      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => {
        console.error('Failed to delete item');
        resolve(false);
      };
    });
  } catch (error) {
    console.error('Failed to delete history item:', error);
    return false;
  }
};

/**
 * 清空所有历史记录
 */
export const clearHistory = async (): Promise<boolean> => {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.clear();

      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => {
        console.error('Failed to clear history');
        resolve(false);
      };
    });
  } catch (error) {
    console.error('Failed to clear history:', error);
    return false;
  }
};

/**
 * 生成唯一ID
 */
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 下载图片
 * 支持跨域 URL 和 Data URL
 */
export const downloadImage = async (url: string, filename?: string): Promise<void> => {
  try {
    // 使用 fetch 获取 Blob，解决跨域/浏览器直接打开链接的问题
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename || `stylemorph-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 释放内存
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Download failed, falling back to direct link:', error);
    // 降级策略：如果 fetch 失败（如严重的 CORS 问题），尝试直接打开链接
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `stylemorph-${Date.now()}.png`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

/**
 * 从云端同步生成记录
 * 用于跨设备/清缓存后恢复历史
 */
export const syncFromCloud = async (): Promise<{ added: number; total: number }> => {
  try {
    // 1. 获取云端记录
    const response = await fetch('/api/generations?limit=50');
    if (!response.ok) {
      throw new Error('Failed to fetch cloud generations');
    }
    const { data: cloudRecords } = await response.json();

    if (!cloudRecords || cloudRecords.length === 0) {
      return { added: 0, total: 0 };
    }

    // 2. 获取本地记录
    const localItems = await getHistory();
    const localUrls = new Set(localItems.map(item => item.resultImage));

    // 3. 找出需要添加的记录（去重）
    let addedCount = 0;
    for (const record of cloudRecords) {
      if (!localUrls.has(record.result_image_url)) {
        // 转换云端格式为本地格式
        const historyItem: Omit<HistoryItem, 'id' | 'timestamp'> = {
          originalImage: record.original_image_url || null,
          resultImage: record.result_image_url,
          appMode: mapAppModeFromAction(record.app_mode),
          customPrompt: record.generation_params?.customPrompt,
          imageConfig: record.generation_params?.imageConfig,
        };

        await saveHistory(historyItem);
        addedCount++;
      }
    }

    console.log(`[Cloud Sync] Added ${addedCount} new records from cloud`);
    return { added: addedCount, total: cloudRecords.length };
  } catch (error) {
    console.error('Cloud sync failed:', error);
    throw error;
  }
};

// 映射 action 到 AppMode
import { AppMode } from './types';

const mapAppModeFromAction = (action: string): AppMode => {
  const mapping: Record<string, AppMode> = {
    'styleTransform': AppMode.STYLE_MODE,
    'referenceTransform': AppMode.REFERENCE_MODE,
    'freeStyle': AppMode.FREE_MODE,
    'customSwap': AppMode.CUSTOM_REF_MODE,
    'inpainting': AppMode.INPAINTING_MODE,
    'virtualTryOn': AppMode.VIRTUAL_TRY_ON,
  };
  return mapping[action] || AppMode.FREE_MODE;
};

