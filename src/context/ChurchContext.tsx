import React, { createContext, useContext, useEffect, useState } from 'react';
import { BibleApiService } from '../services/bibleApi';
import { ChurchStorageService, STORAGE_KEYS, UserCacheMetadata } from '../services/storage';
import {
  AppSettings,
  Banner,
  BannerPosition,
  BirthdayPerson,
  Bulletin,
  ChurchInfo,
  DeaconScheduleItem,
  UserBibleNote,
  UserFavoriteVerse,
  ViewMode
} from '../types';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
}

interface ChurchContextType {
  // Navigation
  currentView: ViewMode;
  setCurrentView: (view: ViewMode) => void;

  // Church Info
  churchInfo: ChurchInfo;
  updateChurchInfo: (info: ChurchInfo) => void;

  // Bulletins
  bulletins: Bulletin[];
  currentBulletin: Bulletin | undefined;
  addBulletin: (b: Omit<Bulletin, 'id' | 'createdAt'>) => void;
  updateBulletin: (id: string, b: Partial<Bulletin>) => void;
  deleteBulletin: (id: string) => void;
  setCurrentBulletin: (id: string) => void;
  selectedBulletinForReader: Bulletin | null;
  setSelectedBulletinForReader: (b: Bulletin | null) => void;

  // Birthdays
  birthdays: BirthdayPerson[];
  addBirthday: (person: Omit<BirthdayPerson, 'id'>) => void;
  updateBirthday: (id: string, person: Partial<BirthdayPerson>) => void;
  deleteBirthday: (id: string) => void;
  importBirthdaysCSV: (csvText: string) => number;

  // Deacon Schedules
  deaconSchedules: DeaconScheduleItem[];
  addDeaconSchedule: (item: Omit<DeaconScheduleItem, 'id'>) => void;
  updateDeaconSchedule: (id: string, item: Partial<DeaconScheduleItem>) => void;
  deleteDeaconSchedule: (id: string) => void;

  // Banners
  banners: Banner[];
  getBannersByPosition: (pos: BannerPosition) => Banner[];
  addBanner: (banner: Omit<Banner, 'id'>) => void;
  updateBanner: (id: string, banner: Partial<Banner>) => void;
  deleteBanner: (id: string) => void;
  toggleBannerActive: (id: string) => void;

  // Settings
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;

  // Manager Authentication
  isManagerAuthenticated: boolean;
  managerLogin: (email: string, password: string) => boolean;
  managerLogout: () => void;

  // Bible Personal Notes & Favorites (local to user)
  notes: UserBibleNote[];
  addNote: (note: Omit<UserBibleNote, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNote: (id: string, noteText: string, colorTag?: string) => void;
  deleteNote: (id: string) => void;
  exportUserNotesBackup: () => void;
  importUserNotesBackup: (jsonText: string) => void;

  favorites: UserFavoriteVerse[];
  toggleFavorite: (verse: Omit<UserFavoriteVerse, 'id' | 'savedAt'>) => void;
  isFavorite: (bookAbbrev: string, chapter: number, verse: number) => boolean;

  // Local Cache & Mobile App Mode
  cacheMetadata: UserCacheMetadata;
  refreshCacheMetadata: () => void;
  isMobileAppPreview: boolean;
  setIsMobileAppPreview: (val: boolean) => void;

  // System Feedback
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  confirmDialog: ConfirmDialogState | null;
  askConfirmation: (config: Omit<ConfirmDialogState, 'isOpen'>) => void;
  closeConfirmation: () => void;
}

const ChurchContext = createContext<ChurchContextType | undefined>(undefined);

export const ChurchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Immediately initialize user cache on boot so data is never empty on reopen
  const [cacheMetadata, setCacheMetadata] = useState<UserCacheMetadata>(() =>
    ChurchStorageService.initializeUserCacheOnBoot()
  );

  const [currentView, setCurrentView] = useState<ViewMode>('home');
  const [isMobileAppPreview, setIsMobileAppPreviewState] = useState<boolean>(() => {
    return localStorage.getItem('ipc_mobile_app_preview_v1') === 'true';
  });

  const [churchInfo, setChurchInfoState] = useState<ChurchInfo>(() => ChurchStorageService.getChurchInfo());
  const [bulletins, setBulletinsState] = useState<Bulletin[]>(() => ChurchStorageService.getBulletins());
  const [birthdays, setBirthdaysState] = useState<BirthdayPerson[]>(() => ChurchStorageService.getBirthdays());
  const [deaconSchedules, setDeaconSchedulesState] = useState<DeaconScheduleItem[]>(() =>
    ChurchStorageService.getDeaconSchedules()
  );
  const [banners, setBannersState] = useState<Banner[]>(() => ChurchStorageService.getBanners());
  const [settings, setSettingsState] = useState<AppSettings>(() => ChurchStorageService.getSettings());
  const [isManagerAuthenticated, setIsManagerAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('ipc_manager_auth_v1') === 'true';
  });

  const [selectedBulletinForReader, setSelectedBulletinForReader] = useState<Bulletin | null>(null);

  // Bible Local User Data
  const [notes, setNotesState] = useState<UserBibleNote[]>(() => ChurchStorageService.getUserNotes());
  const [favorites, setFavoritesState] = useState<UserFavoriteVerse[]>(() => ChurchStorageService.getUserFavorites());

  // UI Dialogs & Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  const setIsMobileAppPreview = (val: boolean) => {
    setIsMobileAppPreviewState(val);
    localStorage.setItem('ipc_mobile_app_preview_v1', String(val));
  };

  const refreshCacheMetadata = () => {
    setCacheMetadata(ChurchStorageService.touchCacheMeta());
  };

  // Sync Bible API config whenever settings change
  useEffect(() => {
    if (settings.bibleConfig) {
      BibleApiService.setConfig(settings.bibleConfig);
    }
  }, [settings.bibleConfig]);

  // Listen for IndexedDB recovery or cross-tab localStorage updates
  useEffect(() => {
    const timer = setTimeout(() => {
      const latestNotes = ChurchStorageService.getUserNotes();
      if (latestNotes.length !== notes.length) {
        setNotesState(latestNotes);
      }
      refreshCacheMetadata();
    }, 400);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.USER_NOTES) {
        setNotesState(ChurchStorageService.getUserNotes());
        refreshCacheMetadata();
      } else if (e.key === STORAGE_KEYS.USER_FAVORITES) {
        setFavoritesState(ChurchStorageService.getUserFavorites());
        refreshCacheMetadata();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Toast handler
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  };

  const askConfirmation = (config: Omit<ConfirmDialogState, 'isOpen'>) => {
    setConfirmDialog({ ...config, isOpen: true });
  };

  const closeConfirmation = () => {
    setConfirmDialog(null);
  };

  // Church Info Handlers
  const updateChurchInfo = (info: ChurchInfo) => {
    setChurchInfoState(info);
    ChurchStorageService.saveChurchInfo(info);
    showToast('Informações da igreja atualizadas com sucesso!');
  };

  // Bulletins Handlers
  const currentBulletin = bulletins.find((b) => b.isCurrent) || bulletins[0];

  const addBulletin = (b: Omit<Bulletin, 'id' | 'createdAt'>) => {
    const newBulletin: Bulletin = {
      ...b,
      id: `bol-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    let updatedList = [...bulletins];
    if (newBulletin.isCurrent) {
      updatedList = updatedList.map((item) => ({ ...item, isCurrent: false }));
    }
    updatedList = [newBulletin, ...updatedList];

    setBulletinsState(updatedList);
    ChurchStorageService.saveBulletins(updatedList);
    showToast('Novo boletim adicionado com sucesso!');
  };

  const updateBulletin = (id: string, b: Partial<Bulletin>) => {
    let updatedList = bulletins.map((item) => {
      if (item.id === id) {
        return { ...item, ...b };
      }
      if (b.isCurrent) {
        return { ...item, isCurrent: false };
      }
      return item;
    });

    setBulletinsState(updatedList);
    ChurchStorageService.saveBulletins(updatedList);
    showToast('Boletim atualizado com sucesso!');
  };

  const deleteBulletin = (id: string) => {
    const updatedList = bulletins.filter((item) => item.id !== id);
    setBulletinsState(updatedList);
    ChurchStorageService.saveBulletins(updatedList);
    showToast('Boletim excluído com sucesso!');
  };

  const setCurrentBulletin = (id: string) => {
    const updatedList = bulletins.map((item) => ({
      ...item,
      isCurrent: item.id === id
    }));
    setBulletinsState(updatedList);
    ChurchStorageService.saveBulletins(updatedList);
    showToast('Boletim definido como atual!');
  };

  // Birthdays Handlers
  const addBirthday = (person: Omit<BirthdayPerson, 'id'>) => {
    const newPerson: BirthdayPerson = {
      ...person,
      id: `bday-${Date.now()}`
    };
    const updatedList = [...birthdays, newPerson];
    setBirthdaysState(updatedList);
    ChurchStorageService.saveBirthdays(updatedList);
    showToast('Aniversariante cadastrado com sucesso!');
  };

  const updateBirthday = (id: string, person: Partial<BirthdayPerson>) => {
    const updatedList = birthdays.map((item) => (item.id === id ? { ...item, ...person } : item));
    setBirthdaysState(updatedList);
    ChurchStorageService.saveBirthdays(updatedList);
    showToast('Aniversariante atualizado com sucesso!');
  };

  const deleteBirthday = (id: string) => {
    const updatedList = birthdays.filter((item) => item.id !== id);
    setBirthdaysState(updatedList);
    ChurchStorageService.saveBirthdays(updatedList);
    showToast('Aniversariante removido com sucesso!');
  };

  const importBirthdaysCSV = (csvText: string): number => {
    const parsed = ChurchStorageService.parseBirthdayCSV(csvText);
    if (parsed.length === 0) {
      showToast('Nenhum registro válido encontrado no CSV.', 'error');
      return 0;
    }
    const merged = [...birthdays, ...parsed];
    setBirthdaysState(merged);
    ChurchStorageService.saveBirthdays(merged);
    showToast(`${parsed.length} aniversariantes importados com sucesso!`);
    return parsed.length;
  };

  // Deacon Schedules Handlers
  const addDeaconSchedule = (item: Omit<DeaconScheduleItem, 'id'>) => {
    const newItem: DeaconScheduleItem = {
      ...item,
      id: `deac-${Date.now()}`
    };
    const updatedList = [...deaconSchedules, newItem];
    setDeaconSchedulesState(updatedList);
    ChurchStorageService.saveDeaconSchedules(updatedList);
    showToast('Escala diaconal adicionada com sucesso!');
  };

  const updateDeaconSchedule = (id: string, item: Partial<DeaconScheduleItem>) => {
    const updatedList = deaconSchedules.map((s) => (s.id === id ? { ...s, ...item } : s));
    setDeaconSchedulesState(updatedList);
    ChurchStorageService.saveDeaconSchedules(updatedList);
    showToast('Escala diaconal atualizada!');
  };

  const deleteDeaconSchedule = (id: string) => {
    const updatedList = deaconSchedules.filter((s) => s.id !== id);
    setDeaconSchedulesState(updatedList);
    ChurchStorageService.saveDeaconSchedules(updatedList);
    showToast('Escala diaconal excluída!');
  };

  // Banners Handlers
  const getBannersByPosition = (pos: BannerPosition): Banner[] => {
    const now = new Date().toISOString().split('T')[0];
    return banners
      .filter((b) => {
        if (!b.isActive) return false;
        if (b.position !== pos) return false;
        if (b.startDate && b.startDate > now) return false;
        if (b.endDate && b.endDate < now) return false;
        return true;
      })
      .sort((a, b) => a.order - b.order);
  };

  const addBanner = (banner: Omit<Banner, 'id'>) => {
    const newBanner: Banner = {
      ...banner,
      id: `ban-${Date.now()}`
    };
    const updatedList = [...banners, newBanner];
    setBannersState(updatedList);
    ChurchStorageService.saveBanners(updatedList);
    showToast('Banner adicionado com sucesso!');
  };

  const updateBanner = (id: string, banner: Partial<Banner>) => {
    const updatedList = banners.map((b) => (b.id === id ? { ...b, ...banner } : b));
    setBannersState(updatedList);
    ChurchStorageService.saveBanners(updatedList);
    showToast('Banner atualizado!');
  };

  const deleteBanner = (id: string) => {
    const updatedList = banners.filter((b) => b.id !== id);
    setBannersState(updatedList);
    ChurchStorageService.saveBanners(updatedList);
    showToast('Banner removido!');
  };

  const toggleBannerActive = (id: string) => {
    const updatedList = banners.map((b) => (b.id === id ? { ...b, isActive: !b.isActive } : b));
    setBannersState(updatedList);
    ChurchStorageService.saveBanners(updatedList);
  };

  // Settings Handlers
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    const updated: AppSettings = {
      ...settings,
      ...newSettings,
      lastUpdated: new Date().toISOString()
    };
    setSettingsState(updated);
    ChurchStorageService.saveSettings(updated);
    showToast('Configurações salvas!');
  };

  // Manager Authentication
  const managerLogin = (email: string, pass: string): boolean => {
    // Accepts demo admin credentials or the configured manager email with password "admin123"
    const validEmail = email.toLowerCase().trim() === settings.managerEmail.toLowerCase().trim() || email.toLowerCase().trim() === 'gestor@igreja.com.br';
    const validPass = pass === 'admin123' || pass === 'igreja123';

    if (validEmail && validPass) {
      setIsManagerAuthenticated(true);
      localStorage.setItem('ipc_manager_auth_v1', 'true');
      showToast('Bem-vindo à Área de Gestão!');
      return true;
    }
    showToast('Credenciais inválidas. Use gestor@igreja.com.br e senha admin123', 'error');
    return false;
  };

  const managerLogout = () => {
    setIsManagerAuthenticated(false);
    localStorage.removeItem('ipc_manager_auth_v1');
    setCurrentView('home');
    showToast('Você saiu da Área do Gestor.', 'info');
  };

  // Bible Personal Notes
  const addNote = (note: Omit<UserBibleNote, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newNote: UserBibleNote = {
      ...note,
      id: `note-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const updated = [newNote, ...notes];
    setNotesState(updated);
    ChurchStorageService.saveUserNotes(updated);
    ChurchStorageService.saveNoteDraft(null);
    refreshCacheMetadata();
    showToast('Anotação salva no cache do seu aparelho!');
  };

  const updateNote = (id: string, noteText: string, colorTag = '#4A6B5D') => {
    const updated = notes.map((n) => (n.id === id ? { ...n, noteText, colorTag, updatedAt: new Date().toISOString() } : n));
    setNotesState(updated);
    ChurchStorageService.saveUserNotes(updated);
    ChurchStorageService.saveNoteDraft(null);
    refreshCacheMetadata();
    showToast('Anotação atualizada no cache local!');
  };

  const deleteNote = (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    setNotesState(updated);
    ChurchStorageService.saveUserNotes(updated);
    refreshCacheMetadata();
    showToast('Anotação excluída!');
  };

  const exportUserNotesBackup = () => {
    const backupPayload = {
      deviceId: cacheMetadata.deviceId,
      exportedAt: new Date().toISOString(),
      notes,
      favorites
    };
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupPayload, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', jsonStr);
    a.setAttribute('download', `minhas_anotacoes_ipc_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast('Suas anotações e favoritos foram exportados!');
  };

  const importUserNotesBackup = (jsonText: string) => {
    try {
      const parsed = JSON.parse(jsonText);
      const importedNotes: UserBibleNote[] = Array.isArray(parsed) ? parsed : Array.isArray(parsed.notes) ? parsed.notes : [];
      const importedFavs: UserFavoriteVerse[] = Array.isArray(parsed.favorites) ? parsed.favorites : [];

      if (importedNotes.length === 0 && importedFavs.length === 0) {
        showToast('Nenhuma anotação válida encontrada no arquivo.', 'error');
        return;
      }

      if (importedNotes.length > 0) {
        const existingIds = new Set(notes.map((n) => n.id));
        const mergedNotes = [...notes, ...importedNotes.filter((n) => !existingIds.has(n.id))];
        setNotesState(mergedNotes);
        ChurchStorageService.saveUserNotes(mergedNotes);
      }

      if (importedFavs.length > 0) {
        const existingFavIds = new Set(favorites.map((f) => f.id));
        const mergedFavs = [...favorites, ...importedFavs.filter((f) => !existingFavIds.has(f.id))];
        setFavoritesState(mergedFavs);
        ChurchStorageService.saveUserFavorites(mergedFavs);
      }

      refreshCacheMetadata();
      showToast('Suas anotações foram restauradas no cache local!');
    } catch {
      showToast('Arquivo de backup inválido.', 'error');
    }
  };

  // Bible Favorites
  const toggleFavorite = (verse: Omit<UserFavoriteVerse, 'id' | 'savedAt'>) => {
    const existing = favorites.find(
      (f) => f.bookAbbrev === verse.bookAbbrev && f.chapter === verse.chapter && f.verse === verse.verse
    );
    if (existing) {
      const updated = favorites.filter((f) => f.id !== existing.id);
      setFavoritesState(updated);
      ChurchStorageService.saveUserFavorites(updated);
      refreshCacheMetadata();
      showToast('Versículo removido dos favoritos.', 'info');
    } else {
      const newFav: UserFavoriteVerse = {
        ...verse,
        id: `fav-${Date.now()}`,
        savedAt: new Date().toISOString()
      };
      const updated = [newFav, ...favorites];
      setFavoritesState(updated);
      ChurchStorageService.saveUserFavorites(updated);
      refreshCacheMetadata();
      showToast('Versículo salvo nos favoritos do seu aparelho!');
    }
  };

  const isFavorite = (bookAbbrev: string, chapter: number, verse: number): boolean => {
    return favorites.some(
      (f) => f.bookAbbrev.toLowerCase() === bookAbbrev.toLowerCase() && f.chapter === chapter && f.verse === verse
    );
  };

  return (
    <ChurchContext.Provider
      value={{
        currentView,
        setCurrentView,
        churchInfo,
        updateChurchInfo,
        bulletins,
        currentBulletin,
        addBulletin,
        updateBulletin,
        deleteBulletin,
        setCurrentBulletin,
        selectedBulletinForReader,
        setSelectedBulletinForReader,
        birthdays,
        addBirthday,
        updateBirthday,
        deleteBirthday,
        importBirthdaysCSV,
        deaconSchedules,
        addDeaconSchedule,
        updateDeaconSchedule,
        deleteDeaconSchedule,
        banners,
        getBannersByPosition,
        addBanner,
        updateBanner,
        deleteBanner,
        toggleBannerActive,
        settings,
        updateSettings,
        isManagerAuthenticated,
        managerLogin,
        managerLogout,
        notes,
        addNote,
        updateNote,
        deleteNote,
        exportUserNotesBackup,
        importUserNotesBackup,
        favorites,
        toggleFavorite,
        isFavorite,
        cacheMetadata,
        refreshCacheMetadata,
        isMobileAppPreview,
        setIsMobileAppPreview,
        toasts,
        showToast,
        confirmDialog,
        askConfirmation,
        closeConfirmation
      }}
    >
      {children}
    </ChurchContext.Provider>
  );
};

export const useChurch = () => {
  const context = useContext(ChurchContext);
  if (!context) {
    throw new Error('useChurch must be used within a ChurchProvider');
  }
  return context;
};
