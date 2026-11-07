/**
 * Bible API & Offline ACF Service
 *
 * - Serve a Bíblia Sagrada completa em português — Almeida Corrigida Fiel (ACF),
 *   a partir dos arquivos estáticos do próprio app (/biblia/acf/{abbrev}.json e /biblia/acf.json).
 * - Carrega sob demanda com fetch e armazena em cache no IndexedDB e Cache API
 *   (nunca em localStorage) para funcionamento 100% offline.
 * - Limpa qualquer cache truncado antigo (ipc_bible_chapters_cache_v1) na inicialização.
 */

import { BibleBook, BibleChapterData, BibleConfig, BibleVerse } from '../types';
import {
  BIBLE_BOOKS,
  BibleSearchResult,
  normalizeBibleString,
  ParsedBibleReference,
  parseBibleReference
} from './bibleData';

export interface AcfBookPayload {
  abbrev: string;
  name?: string;
  chapters: string[][];
}

const DEFAULT_CONFIG: BibleConfig = {
  apiBaseUrl: '/biblia/acf.json',
  apiKey: '',
  versionName: 'Almeida Corrigida Fiel (ACF)',
  requestTimeoutMs: 10000
};

const IDB_NAME = 'ipc_bible_acf_db_v1';
const IDB_STORE_BOOKS = 'acf_books';
const IDB_STORE_FULL = 'acf_full';
const CACHE_API_NAME = 'ipc-biblia-acf-v1';

// In-memory caches for instant navigation
const bookMemoryCache = new Map<string, AcfBookPayload>();
let fullBibleMemoryCache: AcfBookPayload[] | null = null;
let fullBibleLoadingPromise: Promise<AcfBookPayload[]> | null = null;

// Clear legacy truncated localStorage chapter cache immediately when module loads
if (typeof window !== 'undefined') {
  try {
    window.localStorage.removeItem('ipc_bible_chapters_cache_v1');
  } catch {
    // ignore
  }
}

function openBibleIdb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE_BOOKS)) {
          db.createObjectStore(IDB_STORE_BOOKS);
        }
        if (!db.objectStoreNames.contains(IDB_STORE_FULL)) {
          db.createObjectStore(IDB_STORE_FULL);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbGet<T>(storeName: string, key: string): Promise<T | null> {
  const db = await openBibleIdb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).get(key);
      req.onsuccess = () => resolve((req.result as T) || null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbPut<T>(storeName: string, key: string, value: T): Promise<void> {
  const db = await openBibleIdb();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

async function fetchJsonWithCacheApi<T>(url: string): Promise<T> {
  // 1. Check Cache API if available
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const cache = await window.caches.open(CACHE_API_NAME);
      const cachedResponse = await cache.match(url);
      if (cachedResponse && cachedResponse.ok) {
        const rawText = await cachedResponse.text();
        const cleanText = rawText.charCodeAt(0) === 0xfeff ? rawText.slice(1) : rawText;
        return JSON.parse(cleanText) as T;
      }
    } catch {
      // Fall through to network fetch
    }
  }

  // 2. Network fetch
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Falha ao carregar ${url}: HTTP ${response.status}`);
  }

  // Clone and store in Cache API for offline use
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const cache = await window.caches.open(CACHE_API_NAME);
      await cache.put(url, response.clone());
    } catch {
      // Ignore Cache API quota errors
    }
  }

  const rawText = await response.text();
  const cleanText = rawText.charCodeAt(0) === 0xfeff ? rawText.slice(1) : rawText;
  return JSON.parse(cleanText) as T;
}

function normalizeBookAbbrev(abbrev: string): string {
  const lower = abbrev.toLowerCase().trim();
  if (lower === 'jó') return 'job';
  if (lower === 'atos') return 'at';
  return lower;
}

export class BibleApiService {
  private static config: BibleConfig = DEFAULT_CONFIG;

  public static setConfig(newConfig: Partial<BibleConfig>) {
    BibleApiService.config = {
      ...BibleApiService.config,
      ...newConfig,
      versionName: 'Almeida Corrigida Fiel (ACF)'
    };
  }

  public static getConfig(): BibleConfig {
    return {
      ...BibleApiService.config,
      versionName: 'Almeida Corrigida Fiel (ACF)'
    };
  }

  /**
   * Loads a single book's complete chapters array on demand, caching in memory + IndexedDB + Cache API.
   */
  public static async loadBook(bookAbbrev: string): Promise<AcfBookPayload> {
    const stdAbbrev = normalizeBookAbbrev(bookAbbrev);

    // 1. Check in-memory cache
    if (bookMemoryCache.has(stdAbbrev)) {
      return bookMemoryCache.get(stdAbbrev)!;
    }

    // 2. If full Bible is already in memory, grab from there
    if (fullBibleMemoryCache) {
      const found = fullBibleMemoryCache.find((b) => normalizeBookAbbrev(b.abbrev) === stdAbbrev);
      if (found) {
        bookMemoryCache.set(stdAbbrev, found);
        return found;
      }
    }

    // 3. Check IndexedDB per-book cache
    const cachedBook = await idbGet<AcfBookPayload>(IDB_STORE_BOOKS, stdAbbrev);
    if (cachedBook && Array.isArray(cachedBook.chapters) && cachedBook.chapters.length > 0) {
      bookMemoryCache.set(stdAbbrev, cachedBook);
      return cachedBook;
    }

    // 4. Fetch individual book JSON (/biblia/acf/{abbrev}.json), fallback to full /biblia/acf.json
    try {
      const bookPayload = await fetchJsonWithCacheApi<AcfBookPayload>(`/biblia/acf/${stdAbbrev}.json`);
      if (bookPayload && Array.isArray(bookPayload.chapters)) {
        bookMemoryCache.set(stdAbbrev, bookPayload);
        void idbPut(IDB_STORE_BOOKS, stdAbbrev, bookPayload);
        return bookPayload;
      }
    } catch {
      // Fallback to full acf.json
    }

    const fullBible = await BibleApiService.loadFullBible();
    const bookFromFull = fullBible.find((b) => normalizeBookAbbrev(b.abbrev) === stdAbbrev);
    if (!bookFromFull) {
      throw new Error(`Livro bíblico não encontrado: ${stdAbbrev}`);
    }
    bookMemoryCache.set(stdAbbrev, bookFromFull);
    return bookFromFull;
  }

  /**
   * Loads the entire 66-book ACF Bible from /biblia/acf.json and caches in IndexedDB + Cache API.
   */
  public static async loadFullBible(): Promise<AcfBookPayload[]> {
    if (fullBibleMemoryCache) {
      return fullBibleMemoryCache;
    }
    if (fullBibleLoadingPromise) {
      return fullBibleLoadingPromise;
    }

    fullBibleLoadingPromise = (async () => {
      try {
        // 1. Check IndexedDB full Bible store
        const cachedFull = await idbGet<AcfBookPayload[]>(IDB_STORE_FULL, 'acf_all_66');
        if (Array.isArray(cachedFull) && cachedFull.length === 66) {
          fullBibleMemoryCache = cachedFull;
          for (const b of cachedFull) {
            bookMemoryCache.set(normalizeBookAbbrev(b.abbrev), b);
          }
          return cachedFull;
        }

        // 2. Fetch /biblia/acf.json
        const data = await fetchJsonWithCacheApi<AcfBookPayload[]>('/biblia/acf.json');
        const normalized = data.map((b, idx) => {
          const meta = BIBLE_BOOKS[idx];
          const stdAbbrev = meta ? meta.abbrev : normalizeBookAbbrev(b.abbrev);
          return {
            abbrev: stdAbbrev,
            name: meta ? meta.name : b.name,
            chapters: b.chapters
          };
        });

        fullBibleMemoryCache = normalized;
        for (const b of normalized) {
          bookMemoryCache.set(b.abbrev, b);
        }
        void idbPut(IDB_STORE_FULL, 'acf_all_66', normalized);
        return normalized;
      } finally {
        fullBibleLoadingPromise = null;
      }
    })();

    return fullBibleLoadingPromise;
  }

  /**
   * Fetches all verses of a given book and chapter from the complete ACF Bible.
   */
  public static async fetchChapter(bookAbbrev: string, chapter: number): Promise<BibleChapterData> {
    // Ensure old truncated cache is cleared
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem('ipc_bible_chapters_cache_v1');
      } catch {
        // ignore
      }
    }

    const stdAbbrev = normalizeBookAbbrev(bookAbbrev);
    const bookMeta: BibleBook =
      BIBLE_BOOKS.find((b) => b.abbrev.toLowerCase() === stdAbbrev) || BIBLE_BOOKS[0];

    const bookPayload = await BibleApiService.loadBook(bookMeta.abbrev);
    const safeChapterIndex = Math.max(0, Math.min(chapter - 1, bookPayload.chapters.length - 1));
    const rawVerses = bookPayload.chapters[safeChapterIndex] || [];

    const verses: BibleVerse[] = rawVerses.map((text, idx) => ({
      number: idx + 1,
      text: text.trim()
    }));

    return {
      bookName: bookMeta.name,
      bookAbbrev: bookMeta.abbrev,
      chapter: safeChapterIndex + 1,
      verses
    };
  }

  /**
   * Searches the complete ACF Bible:
   * - Supports reference queries ("João 3", "João 3:16", "Jo 3.16", "1 Coríntios 13", "Mateus 5", with or without accents).
   * - Supports full-text search across all 66 books (31,102 verses), limited to 100 results.
   */
  public static async searchBible(query: string): Promise<{
    referenceMatch: ParsedBibleReference | null;
    results: BibleSearchResult[];
  }> {
    if (!query || query.trim().length < 2) {
      return { referenceMatch: null, results: [] };
    }

    // 1. Check if the query is a biblical reference (e.g., "João 3", "João 3:16", "Jo 3.16", "1 Coríntios 13")
    const parsedRef = parseBibleReference(query);
    if (parsedRef) {
      const chapterData = await BibleApiService.fetchChapter(parsedRef.book.abbrev, parsedRef.chapter);
      if (parsedRef.verse) {
        const targetVerse = chapterData.verses.find((v) => v.number === parsedRef.verse);
        const results: BibleSearchResult[] = targetVerse
          ? [
              {
                reference: `${parsedRef.book.name} ${parsedRef.chapter}:${targetVerse.number}`,
                bookAbbrev: parsedRef.book.abbrev,
                bookName: parsedRef.book.name,
                chapter: parsedRef.chapter,
                verse: targetVerse.number,
                text: targetVerse.text
              }
            ]
          : chapterData.verses.map((v) => ({
              reference: `${parsedRef.book.name} ${parsedRef.chapter}:${v.number}`,
              bookAbbrev: parsedRef.book.abbrev,
              bookName: parsedRef.book.name,
              chapter: parsedRef.chapter,
              verse: v.number,
              text: v.text
            }));
        return { referenceMatch: parsedRef, results };
      }

      const results: BibleSearchResult[] = chapterData.verses.map((v) => ({
        reference: `${parsedRef.book.name} ${parsedRef.chapter}:${v.number}`,
        bookAbbrev: parsedRef.book.abbrev,
        bookName: parsedRef.book.name,
        chapter: parsedRef.chapter,
        verse: v.number,
        text: v.text
      }));
      return { referenceMatch: parsedRef, results };
    }

    // 2. Full-Bible keyword/phrase search across all 66 books (limit 100 results)
    const fullBible = await BibleApiService.loadFullBible();
    const normQuery = normalizeBibleString(query);
    const queryWords = normQuery.split(/\s+/).filter(Boolean);
    const results: BibleSearchResult[] = [];

    for (let bIdx = 0; bIdx < fullBible.length; bIdx++) {
      const bookPayload = fullBible[bIdx];
      const bookMeta = BIBLE_BOOKS[bIdx] || BIBLE_BOOKS.find((b) => b.abbrev === bookPayload.abbrev);
      const bookAbbrev = bookMeta ? bookMeta.abbrev : bookPayload.abbrev;
      const bookName = bookMeta ? bookMeta.name : bookPayload.name || bookPayload.abbrev;

      for (let cIdx = 0; cIdx < bookPayload.chapters.length; cIdx++) {
        const chapterVerses = bookPayload.chapters[cIdx];
        const chapterNum = cIdx + 1;

        for (let vIdx = 0; vIdx < chapterVerses.length; vIdx++) {
          const verseText = chapterVerses[vIdx];
          const normVerse = normalizeBibleString(verseText);

          const isMatch =
            normVerse.includes(normQuery) ||
            (queryWords.length > 1 && queryWords.every((w) => normVerse.includes(w)));

          if (isMatch) {
            results.push({
              reference: `${bookName} ${chapterNum}:${vIdx + 1}`,
              bookAbbrev,
              bookName,
              chapter: chapterNum,
              verse: vIdx + 1,
              text: verseText
            });

            if (results.length >= 100) {
              return { referenceMatch: null, results };
            }
          }
        }
      }
    }

    return { referenceMatch: null, results };
  }
}
