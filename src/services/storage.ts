import {
  AppSettings,
  Banner,
  BirthdayPerson,
  Bulletin,
  ChurchInfo,
  DeaconScheduleItem,
  UserBibleNote,
  UserFavoriteVerse
} from '../types';

export const STORAGE_KEYS = {
  SELECTED_CHURCH_SLUG: 'minha_igreja_selected_slug_v1',
  CHURCH_INFO: 'minha_igreja_church_info_v1',
  BULLETINS: 'minha_igreja_bulletins_v1',
  BIRTHDAYS: 'minha_igreja_birthdays_v1',
  DEACON_SCHEDULES: 'minha_igreja_deacon_schedules_v1',
  BANNERS: 'minha_igreja_banners_v1',
  SETTINGS: 'minha_igreja_settings_v1',
  USER_NOTES: 'minha_igreja_user_bible_notes_v1',
  USER_FAVORITES: 'minha_igreja_user_bible_favorites_v1',
  USER_NOTE_DRAFT: 'minha_igreja_user_note_draft_v1',
  USER_READING_STATE: 'minha_igreja_user_reading_state_v1',
  USER_CACHE_META: 'minha_igreja_user_cache_meta_v1',
  LEGACY_CLEANED_FLAG: 'minha_igreja_legacy_ipc_cleaned_v1'
};

export interface UserCacheMetadata {
  deviceId: string;
  initializedAt: string;
  lastSyncedAt: string;
  notesCount: number;
  favoritesCount: number;
  cachedChaptersCount: number;
}

export interface UserReadingState {
  bookAbbrev: string;
  chapter: number;
  fontSize: number;
  theme: 'light' | 'sepia' | 'dark';
}

export const INITIAL_CHURCH_INFO: ChurchInfo = {
  name: '',
  tagline: '',
  aboutHistory: '',
  missionVision: '',
  address: '',
  cityStateZip: '',
  googleMapsUrl: '',
  primaryPhone: '',
  secondaryPhone: '',
  whatsappNumber: '',
  whatsappDefaultMessage: '',
  email: '',
  instagramUrl: '',
  youtubeUrl: '',
  facebookUrl: '',
  logoUrl: '',
  schedules: [],
  leadership: []
};

export const INITIAL_BULLETINS: Bulletin[] = [];
export const INITIAL_BIRTHDAYS: BirthdayPerson[] = [];
export const INITIAL_DEACON_SCHEDULES: DeaconScheduleItem[] = [];
export const INITIAL_BANNERS: Banner[] = [];

export const INITIAL_SETTINGS: AppSettings = {
  appName: 'Minha Igreja',
  themeColor: '#344E41',
  bibleConfig: {
    apiBaseUrl: '/biblia/acf.json',
    apiKey: '',
    versionName: 'Almeida Corrigida Fiel (ACF)',
    requestTimeoutMs: 6000
  },
  managerEmail: '',
  lastUpdated: new Date().toISOString()
};

export class ChurchStorageService {
  // Clean all legacy `ipc_*` keys from localStorage and legacy IndexedDB
  public static purgeLegacyIpcStorageOnBoot(): void {
    if (typeof window === 'undefined') return;
    try {
      const keysToDelete: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith('ipc_')) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach((k) => window.localStorage.removeItem(k));

      // Also clear any old ip-gloria-se slug if it was auto-saved from previous demo
      if (!window.localStorage.getItem(STORAGE_KEYS.LEGACY_CLEANED_FLAG)) {
        const savedSlug = window.localStorage.getItem(STORAGE_KEYS.SELECTED_CHURCH_SLUG);
        if (savedSlug === 'ip-gloria-se') {
          window.localStorage.removeItem(STORAGE_KEYS.SELECTED_CHURCH_SLUG);
        }
        window.localStorage.setItem(STORAGE_KEYS.LEGACY_CLEANED_FLAG, 'true');
      }

      if ('indexedDB' in window) {
        try {
          window.indexedDB.deleteDatabase('ipc_offline_cache_db');
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    }
  }

  // Selected Church Slug (Multi-Church Platform)
  public static getSelectedChurchSlug(): string {
    try {
      return localStorage.getItem(STORAGE_KEYS.SELECTED_CHURCH_SLUG) || '';
    } catch {
      return '';
    }
  }

  public static saveSelectedChurchSlug(slug: string): void {
    try {
      if (!slug) {
        localStorage.removeItem(STORAGE_KEYS.SELECTED_CHURCH_SLUG);
      } else {
        localStorage.setItem(STORAGE_KEYS.SELECTED_CHURCH_SLUG, slug);
      }
    } catch {
      // ignore
    }
  }

  // Church Info
  public static getChurchInfo(): ChurchInfo {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CHURCH_INFO);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Erro ao ler churchInfo do storage:', e);
    }
    return INITIAL_CHURCH_INFO;
  }

  public static saveChurchInfo(info: ChurchInfo): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CHURCH_INFO, JSON.stringify(info));
    } catch (e) {
      console.error('Erro ao salvar churchInfo:', e);
    }
  }

  // Bulletins
  public static getBulletins(): Bulletin[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BULLETINS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Erro ao ler boletins:', e);
    }
    return INITIAL_BULLETINS;
  }

  public static saveBulletins(bulletins: Bulletin[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.BULLETINS, JSON.stringify(bulletins));
    } catch (e) {
      console.error('Erro ao salvar boletins:', e);
    }
  }

  // Birthdays
  public static getBirthdays(): BirthdayPerson[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BIRTHDAYS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Erro ao ler aniversariantes:', e);
    }
    return INITIAL_BIRTHDAYS;
  }

  public static saveBirthdays(birthdays: BirthdayPerson[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.BIRTHDAYS, JSON.stringify(birthdays));
    } catch (e) {
      console.error('Erro ao salvar aniversariantes:', e);
    }
  }

  // Deacon Schedules
  public static getDeaconSchedules(): DeaconScheduleItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DEACON_SCHEDULES);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Erro ao ler escala de diáconos:', e);
    }
    return INITIAL_DEACON_SCHEDULES;
  }

  public static saveDeaconSchedules(schedules: DeaconScheduleItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.DEACON_SCHEDULES, JSON.stringify(schedules));
    } catch (e) {
      console.error('Erro ao salvar escala de diáconos:', e);
    }
  }

  // Banners
  public static getBanners(): Banner[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BANNERS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Erro ao ler banners:', e);
    }
    return INITIAL_BANNERS;
  }

  public static saveBanners(banners: Banner[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.BANNERS, JSON.stringify(banners));
    } catch (e) {
      console.error('Erro ao salvar banners:', e);
    }
  }

  // Settings
  public static getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Erro ao ler configurações:', e);
    }
    return INITIAL_SETTINGS;
  }

  public static saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Erro ao salvar configurações:', e);
    }
  }

  // Bible Personal Notes (starts 100% empty on user's device)
  public static getInitialNotes(): UserBibleNote[] {
    return [];
  }

  public static getInitialFavorites(): UserFavoriteVerse[] {
    return [];
  }

  public static getUserNotes(): UserBibleNote[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER_NOTES);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Erro ao ler notas bíblicas:', e);
    }
    return [];
  }

  public static saveUserNotes(notes: UserBibleNote[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_NOTES, JSON.stringify(notes));
      ChurchStorageService.touchCacheMeta();
    } catch (e) {
      console.error('Erro ao salvar notas bíblicas:', e);
    }
  }

  // Bible Favorites (starts 100% empty on user's device)
  public static getUserFavorites(): UserFavoriteVerse[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER_FAVORITES);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Erro ao ler favoritos:', e);
    }
    return [];
  }

  public static saveUserFavorites(favs: UserFavoriteVerse[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_FAVORITES, JSON.stringify(favs));
      ChurchStorageService.touchCacheMeta();
    } catch (e) {
      console.error('Erro ao salvar favoritos:', e);
    }
  }

  // Reading State Cache (Book, Chapter, Font Size, Theme)
  public static getReadingState(): UserReadingState {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.USER_READING_STATE);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    const initialState: UserReadingState = {
      bookAbbrev: 'gn',
      chapter: 1,
      fontSize: 18,
      theme: 'light'
    };
    ChurchStorageService.saveReadingState(initialState);
    return initialState;
  }

  public static saveReadingState(state: Partial<UserReadingState>): void {
    try {
      const currentRaw = localStorage.getItem(STORAGE_KEYS.USER_READING_STATE);
      const current: UserReadingState = currentRaw
        ? JSON.parse(currentRaw)
        : { bookAbbrev: 'gn', chapter: 1, fontSize: 18, theme: 'light' };
      const updated = { ...current, ...state };
      localStorage.setItem(STORAGE_KEYS.USER_READING_STATE, JSON.stringify(updated));
    } catch (e) {
      console.warn('Erro ao salvar estado de leitura:', e);
    }
  }

  // Unsaved Note Draft Cache
  public static getNoteDraft(): { bookAbbrev: string; chapter: number; verse: number; text: string } | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.USER_NOTE_DRAFT);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return null;
  }

  public static saveNoteDraft(draft: { bookAbbrev: string; chapter: number; verse: number; text: string } | null): void {
    try {
      if (!draft || !draft.text.trim()) {
        localStorage.removeItem(STORAGE_KEYS.USER_NOTE_DRAFT);
      } else {
        localStorage.setItem(STORAGE_KEYS.USER_NOTE_DRAFT, JSON.stringify(draft));
      }
    } catch {
      // ignore
    }
  }

  // Immediate Boot Cache Initializer
  public static initializeUserCacheOnBoot(): UserCacheMetadata {
    // 1. Always purge legacy ipc_* keys first
    ChurchStorageService.purgeLegacyIpcStorageOnBoot();

    const notes = ChurchStorageService.getUserNotes();
    const favorites = ChurchStorageService.getUserFavorites();
    const totalBibleChaptersCount = 1189;
    const now = new Date().toISOString();

    let meta: UserCacheMetadata;
    try {
      const rawMeta = localStorage.getItem(STORAGE_KEYS.USER_CACHE_META);
      if (rawMeta) {
        const parsed = JSON.parse(rawMeta) as UserCacheMetadata;
        meta = {
          ...parsed,
          lastSyncedAt: now,
          notesCount: notes.length,
          favoritesCount: favorites.length,
          cachedChaptersCount: totalBibleChaptersCount
        };
      } else {
        meta = {
          deviceId: `mi-dev-${Math.random().toString(36).substring(2, 10)}`,
          initializedAt: now,
          lastSyncedAt: now,
          notesCount: notes.length,
          favoritesCount: favorites.length,
          cachedChaptersCount: totalBibleChaptersCount
        };
      }
      localStorage.setItem(STORAGE_KEYS.USER_CACHE_META, JSON.stringify(meta));
    } catch {
      meta = {
        deviceId: 'mi-local',
        initializedAt: now,
        lastSyncedAt: now,
        notesCount: notes.length,
        favoritesCount: favorites.length,
        cachedChaptersCount: totalBibleChaptersCount
      };
    }

    return meta;
  }

  public static touchCacheMeta(): UserCacheMetadata {
    const now = new Date().toISOString();
    try {
      const rawMeta = localStorage.getItem(STORAGE_KEYS.USER_CACHE_META);
      const notesRaw = localStorage.getItem(STORAGE_KEYS.USER_NOTES);
      const favsRaw = localStorage.getItem(STORAGE_KEYS.USER_FAVORITES);

      const notesCount = notesRaw ? JSON.parse(notesRaw).length : 0;
      const favoritesCount = favsRaw ? JSON.parse(favsRaw).length : 0;
      const cachedChaptersCount = 1189;

      const parsed: UserCacheMetadata = rawMeta
        ? JSON.parse(rawMeta)
        : {
            deviceId: `mi-dev-${Math.random().toString(36).substring(2, 10)}`,
            initializedAt: now,
            lastSyncedAt: now,
            notesCount,
            favoritesCount,
            cachedChaptersCount
          };

      const updated: UserCacheMetadata = {
        ...parsed,
        lastSyncedAt: now,
        notesCount,
        favoritesCount,
        cachedChaptersCount
      };
      localStorage.setItem(STORAGE_KEYS.USER_CACHE_META, JSON.stringify(updated));
      return updated;
    } catch {
      return {
        deviceId: 'mi-local',
        initializedAt: now,
        lastSyncedAt: now,
        notesCount: 0,
        favoritesCount: 0,
        cachedChaptersCount: 1189
      };
    }
  }

  public static clearAllChurchCacheFromDevice(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.SELECTED_CHURCH_SLUG);
      localStorage.removeItem(STORAGE_KEYS.CHURCH_INFO);
      localStorage.removeItem(STORAGE_KEYS.BULLETINS);
      localStorage.removeItem(STORAGE_KEYS.BIRTHDAYS);
      localStorage.removeItem(STORAGE_KEYS.DEACON_SCHEDULES);
      localStorage.removeItem(STORAGE_KEYS.BANNERS);
    } catch {
      // ignore
    }
  }

  // Image compressor using Canvas
  public static async compressImageFile(file: File, maxWidth = 800, quality = 0.8): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          if (height > maxWidth) {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(readerEvent.target?.result as string);
            return;
          }

          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error('Falha ao processar imagem'));
        img.src = readerEvent.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Falha ao ler arquivo'));
      reader.readAsDataURL(file);
    });
  }

  // CSV Birthday parser
  public static parseBirthdayCSV(csvText: string): BirthdayPerson[] {
    const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) return [];

    const header = lines[0].toLowerCase();
    const delimiter = header.includes(';') ? ';' : ',';

    const parsed: BirthdayPerson[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ''));
      if (cols.length < 2) continue;

      const name = cols[0];
      if (!name) continue;

      let day = 1;
      let month = 1;
      let year: number | undefined = undefined;

      if (cols[1].includes('/') || cols[1].includes('-')) {
        const parts = cols[1].split(/[/-]/).map((p) => parseInt(p, 10));
        if (parts.length >= 2) {
          day = parts[0] || 1;
          month = parts[1] || 1;
          if (parts[2]) year = parts[2];
        }
      } else {
        day = parseInt(cols[1], 10) || 1;
        if (cols[2] && !isNaN(parseInt(cols[2], 10))) {
          month = parseInt(cols[2], 10);
        }
      }

      const phone = cols[3] || (cols[2] && isNaN(parseInt(cols[2], 10)) ? cols[2] : '');
      const ministry = cols[4] || '';

      parsed.push({
        id: `csv-${Date.now()}-${i}`,
        name,
        birthDay: Math.min(Math.max(day, 1), 31),
        birthMonth: Math.min(Math.max(month, 1), 12),
        birthYear: year,
        phone: phone || undefined,
        ministry: ministry || undefined
      });
    }

    return parsed;
  }
}
