import { Language } from './types';

const LANGUAGE_STORAGE_KEY = 'stylemorph_language';

/**
 * Save user's language preference to localStorage
 */
export const saveLanguage = (language: Language): void => {
    try {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch (error) {
        console.warn('Failed to save language preference:', error);
    }
};

/**
 * Load user's language preference from localStorage
 * Returns null if no preference is saved or if localStorage is unavailable
 */
export const loadLanguage = (): Language | null => {
    if (typeof window === 'undefined') return null;
    try {
        const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
        return (saved === 'en' || saved === 'zh') ? saved : null;
    } catch (error) {
        console.warn('Failed to load language preference:', error);
        return null;
    }
};
