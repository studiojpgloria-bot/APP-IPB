/**
 * Bible API Service
 * 
 * NOTA DE CONFIGURAÇÃO:
 * - A URL base e a Chave de API da Bíblia podem ser alteradas tanto nas variáveis de ambiente
 *   (VITE_BIBLE_API_URL / VITE_BIBLE_API_KEY) quanto no Painel do Gestor -> Configurações.
 * - Suporta APIs populares como:
 *     1. A Bíblia Digital (https://www.abibliadigital.com.br/api/verses/{version}/{abbrev}/{chapter})
 *     2. Bible API (https://bible-api.com/{book}+{chapter}?translation=almeida)
 *     3. Qualquer API REST customizada
 */

import { BibleChapterData, BibleConfig, BibleVerse } from '../types';
import { BIBLE_BOOKS, getFallbackChapterVerses } from './bibleData';
import { ChurchStorageService, STORAGE_KEYS } from './storage';

const DEFAULT_CONFIG: BibleConfig = {
  apiBaseUrl: import.meta.env.VITE_BIBLE_API_URL || 'https://bible-api.com',
  apiKey: import.meta.env.VITE_BIBLE_API_KEY || '',
  versionName: 'almeida',
  requestTimeoutMs: 6000
};

// In-memory chapter cache for ultra-fast reading transitions
const chapterCache = new Map<string, BibleVerse[]>();

export class BibleApiService {
  private static config: BibleConfig = DEFAULT_CONFIG;

  public static setConfig(newConfig: Partial<BibleConfig>) {
    BibleApiService.config = { ...BibleApiService.config, ...newConfig };
  }

  public static getConfig(): BibleConfig {
    return { ...BibleApiService.config };
  }

  private static saveChapterToPersistentCache(key: string, verses: BibleVerse[]) {
    try {
      const existingRaw = localStorage.getItem(STORAGE_KEYS.BIBLE_CHAPTERS_CACHE);
      const map: Record<string, BibleVerse[]> = existingRaw ? JSON.parse(existingRaw) : {};
      map[key] = verses;
      localStorage.setItem(STORAGE_KEYS.BIBLE_CHAPTERS_CACHE, JSON.stringify(map));
      ChurchStorageService.touchCacheMeta();
    } catch {
      // Ignore quota errors
    }
  }

  private static getChapterFromPersistentCache(key: string): BibleVerse[] | null {
    try {
      const existingRaw = localStorage.getItem(STORAGE_KEYS.BIBLE_CHAPTERS_CACHE);
      if (!existingRaw) return null;
      const map = JSON.parse(existingRaw);
      if (Array.isArray(map[key]) && map[key].length > 0) {
        return map[key];
      }
    } catch {
      // Ignore
    }
    return null;
  }

  /**
   * Fetches the verses of a given book and chapter.
   * Checks in-memory and localStorage cache first, attempts configured external API,
   * and falls back to our curated offline dataset seamlessly if API is offline or returns error.
   */
  public static async fetchChapter(bookAbbrev: string, chapter: number): Promise<BibleChapterData> {
    const book = BIBLE_BOOKS.find(b => b.abbrev.toLowerCase() === bookAbbrev.toLowerCase()) || {
      id: bookAbbrev,
      abbrev: bookAbbrev,
      name: bookAbbrev.toUpperCase(),
      testament: 'VT' as const,
      chaptersCount: 50,
      group: 'Geral'
    };

    const cacheKey = `${bookAbbrev.toLowerCase()}-${chapter}-${BibleApiService.config.versionName}`;
    const shortKey = `${bookAbbrev.toLowerCase()}-${chapter}`;

    if (chapterCache.has(cacheKey)) {
      return {
        bookName: book.name,
        bookAbbrev: book.abbrev,
        chapter,
        verses: chapterCache.get(cacheKey)!
      };
    }

    // Try fetching from configured external API if valid URL and online
    if (
      typeof navigator !== 'undefined' &&
      navigator.onLine &&
      BibleApiService.config.apiBaseUrl &&
      BibleApiService.config.apiBaseUrl.startsWith('http')
    ) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), BibleApiService.config.requestTimeoutMs || 5000);

        let url = '';
        const baseUrl = BibleApiService.config.apiBaseUrl.replace(/\/+$/, '');

        if (baseUrl.includes('bible-api.com')) {
          url = `${baseUrl}/${encodeURIComponent(book.name)}+${chapter}?translation=${BibleApiService.config.versionName || 'almeida'}`;
        } else if (baseUrl.includes('abibliadigital.com.br')) {
          url = `${baseUrl}/verses/${BibleApiService.config.versionName || 'ra'}/${book.abbrev}/${chapter}`;
        } else {
          url = `${baseUrl}/verses?book=${book.abbrev}&chapter=${chapter}`;
        }

        const headers: Record<string, string> = {
          'Accept': 'application/json'
        };
        if (BibleApiService.config.apiKey) {
          headers['Authorization'] = `Bearer ${BibleApiService.config.apiKey}`;
        }

        const response = await fetch(url, {
          signal: controller.signal,
          headers
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          let verses: BibleVerse[] = [];

          if (Array.isArray(data.verses)) {
            verses = data.verses.map((v: any) => ({
              number: v.verse || v.number || 1,
              text: v.text ? v.text.trim() : ''
            }));
          } else if (Array.isArray(data.chapter)) {
            verses = data.chapter.map((v: any, idx: number) => ({
              number: v.number || idx + 1,
              text: v.text || String(v)
            }));
          }

          if (verses.length > 0) {
            chapterCache.set(cacheKey, verses);
            BibleApiService.saveChapterToPersistentCache(shortKey, verses);
            return {
              bookName: book.name,
              bookAbbrev: book.abbrev,
              chapter,
              verses
            };
          }
        }
      } catch (err) {
        console.warn(`[BibleApiService] API externa indisponível para ${book.name} ${chapter}. Usando cache local.`, err);
      }
    }

    // Check persistent localStorage chapter cache
    const cachedPersisted = BibleApiService.getChapterFromPersistentCache(shortKey);
    if (cachedPersisted) {
      chapterCache.set(cacheKey, cachedPersisted);
      return {
        bookName: book.name,
        bookAbbrev: book.abbrev,
        chapter,
        verses: cachedPersisted
      };
    }

    // Offline & curated fallback
    const fallbackVerses = getFallbackChapterVerses(bookAbbrev, chapter);
    chapterCache.set(cacheKey, fallbackVerses);
    BibleApiService.saveChapterToPersistentCache(shortKey, fallbackVerses);

    return {
      bookName: book.name,
      bookAbbrev: book.abbrev,
      chapter,
      verses: fallbackVerses
    };
  }
}
