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
 */
export const downloadImage = (dataUrl: string, filename?: string): void => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename || `stylemorph-${Date.now()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

