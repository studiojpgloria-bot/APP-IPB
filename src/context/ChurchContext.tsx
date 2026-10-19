import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { BibleApiService } from '../services/bibleApi';
import { CloudChurchService } from '../services/cloudDatabase';
import { ChurchStorageService, STORAGE_KEYS, UserCacheMetadata } from '../services/storage';
import {
  AppSettings,
  Banner,
  BannerPosition,
  BirthdayPerson,
  Bulletin,
  ChurchInfo,
  ChurchManagerAccount,
  ChurchRegistry,
  DeaconScheduleItem,
  ManagerApprovalStatus,
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

  // Cloud & Manager Authentication + Anti-Duplication Approval System
  isManagerAuthenticated: boolean;
  firebaseUser: User | null;
  currentManagerAccount: ChurchManagerAccount | null;
  churchRegistry: ChurchRegistry | null;
  allManagers: ChurchManagerAccount[];
  isPrimaryOwner: boolean;
  isCloudSynced: boolean;
  loginWithGoogleCloud: (churchNameIfFirst?: string) => Promise<void>;
  registerManagerWithEmailCloud: (
    name: string,
    email: string,
    pass: string,
    churchNameIfFirst?: string
  ) => Promise<void>;
  loginManagerWithEmailCloud: (email: string, pass: string) => Promise<void>;
  approveOrRevokeManager: (targetUid: string, status: ManagerApprovalStatus) => Promise<void>;
  removePendingManager: (targetUid: string) => Promise<void>;
  syncLocalDataToCloud: () => Promise<void>;
  pullLatestFromCloud: () => Promise<void>;
  importFullChurchBackup: (jsonText: string) => Promise<void>;
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
  const [isMobileAppPreview, setIsMobileAppPreviewState] = useState<boolean>(false);

  const [churchInfo, setChurchInfoState] = useState<ChurchInfo>(() => ChurchStorageService.getChurchInfo());
  const [bulletins, setBulletinsState] = useState<Bulletin[]>(() => ChurchStorageService.getBulletins());
  const [birthdays, setBirthdaysState] = useState<BirthdayPerson[]>(() => ChurchStorageService.getBirthdays());
  const [deaconSchedules, setDeaconSchedulesState] = useState<DeaconScheduleItem[]>(() =>
    ChurchStorageService.getDeaconSchedules()
  );
  const [banners, setBannersState] = useState<Banner[]>(() => ChurchStorageService.getBanners());
  const [settings, setSettingsState] = useState<AppSettings>(() => ChurchStorageService.getSettings());

  // Firebase Auth & Cloud Registry State
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [currentManagerAccount, setCurrentManagerAccount] = useState<ChurchManagerAccount | null>(null);
  const [churchRegistry, setChurchRegistry] = useState<ChurchRegistry | null>(null);
  const [allManagers, setAllManagers] = useState<ChurchManagerAccount[]>([]);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);
  const [localFallbackAuth, setLocalFallbackAuth] = useState<boolean>(false);

  const [selectedBulletinForReader, setSelectedBulletinForReader] = useState<Bulletin | null>(null);

  // Bible Local User Data
  const [notes, setNotesState] = useState<UserBibleNote[]>(() => ChurchStorageService.getUserNotes());
  const [favorites, setFavoritesState] = useState<UserFavoriteVerse[]>(() => ChurchStorageService.getUserFavorites());

  // UI Dialogs & Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  // Derived manager permissions
  const isApprovedCloudManager = Boolean(
    firebaseUser && currentManagerAccount && currentManagerAccount.status === 'approved'
  );
  const isManagerAuthenticated = isApprovedCloudManager || localFallbackAuth;
  const isPrimaryOwner = Boolean(
    (firebaseUser &&
      (currentManagerAccount?.role === 'owner' ||
        churchRegistry?.ownerUid === firebaseUser.uid ||
        firebaseUser.email === 'cantordaipb@gmail.com')) ||
      localFallbackAuth
  );

  const setIsMobileAppPreview = (val: boolean) => {
    setIsMobileAppPreviewState(val);
  };

  const refreshCacheMetadata = () => {
    setCacheMetadata(ChurchStorageService.touchCacheMeta());
  };

  // Toast handler
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  };

  const askConfirmation = (config: Omit<ConfirmDialogState, 'isOpen'>) => {
    setConfirmDialog({ ...config, isOpen: true });
  };

  const closeConfirmation = () => {
    setConfirmDialog(null);
  };

  const cloudHandlers = {
    onChurchInfo: (info: ChurchInfo) => {
      setChurchInfoState(info);
      ChurchStorageService.saveChurchInfo(info);
      setIsCloudSynced(true);
    },
    onBulletins: (list: Bulletin[]) => {
      setBulletinsState(list);
      ChurchStorageService.saveBulletins(list);
      setIsCloudSynced(true);
    },
    onBirthdays: (list: BirthdayPerson[]) => {
      setBirthdaysState(list);
      ChurchStorageService.saveBirthdays(list);
      setIsCloudSynced(true);
    },
    onDeaconSchedules: (list: DeaconScheduleItem[]) => {
      setDeaconSchedulesState(list);
      ChurchStorageService.saveDeaconSchedules(list);
      setIsCloudSynced(true);
    },
    onBanners: (list: Banner[]) => {
      setBannersState(list);
      ChurchStorageService.saveBanners(list);
      setIsCloudSynced(true);
    },
    onSettings: (cfg: AppSettings) => {
      setSettingsState(cfg);
      ChurchStorageService.saveSettings(cfg);
      setIsCloudSynced(true);
    }
  };

  // 1. Subscribe to Cloud Public Church Data & Registry on boot + immediate fetch
  useEffect(() => {
    void CloudChurchService.fetchAllPublicChurchDataFromCloud(cloudHandlers);

    const unsubRegistry = CloudChurchService.subscribeToRegistry((reg) => {
      setChurchRegistry(reg);
      setIsCloudSynced(true);
    });

    const unsubPublicData = CloudChurchService.subscribeToPublicChurchData(cloudHandlers);

    return () => {
      unsubRegistry();
      unsubPublicData();
    };
  }, []);

  // 2. Listen to Firebase Auth State & Current Manager Document
  useEffect(() => {
    let unsubManagerDoc: (() => void) | null = null;
    let unsubAllManagers: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);

      if (unsubManagerDoc) {
        unsubManagerDoc();
        unsubManagerDoc = null;
      }
      if (unsubAllManagers) {
        unsubAllManagers();
        unsubAllManagers = null;
      }

      if (!user) {
        setCurrentManagerAccount(null);
        setAllManagers([]);
        return;
      }

      // Listen in real-time to this user's church_managers/{uid} document
      unsubManagerDoc = onSnapshot(
        doc(db, 'church_managers', user.uid),
        (snap) => {
          if (snap.exists()) {
            const mgr = snap.data() as ChurchManagerAccount;
            setCurrentManagerAccount(mgr);

            // If approved, also subscribe to all managers list so Primary Owner can approve/revoke
            if (mgr.status === 'approved' && !unsubAllManagers) {
              unsubAllManagers = CloudChurchService.subscribeToManagersList((list) => {
                setAllManagers(list);
              });
            }
          }
        },
        (err) => {
          console.warn('Manager profile listener:', err);
        }
      );
    });

    return () => {
      unsubAuth();
      if (unsubManagerDoc) unsubManagerDoc();
      if (unsubAllManagers) unsubAllManagers();
    };
  }, []);

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

  // Helper to persist to Cloud if authenticated as approved manager
  const persistToCloudIfAuthorized = async (
    moduleId: 'info' | 'bulletins' | 'birthdays' | 'deacons' | 'banners' | 'settings',
    data: unknown
  ) => {
    if (auth.currentUser) {
      try {
        await CloudChurchService.saveModuleToCloud(moduleId, data);
        setIsCloudSynced(true);
      } catch (e) {
        console.warn(`Erro ao sincronizar módulo ${moduleId} na nuvem:`, e);
      }
    }
  };

  // Pull latest data directly from Firestore into current app state
  const pullLatestFromCloud = async () => {
    try {
      const count = await CloudChurchService.fetchAllPublicChurchDataFromCloud(cloudHandlers);
      const reg = await CloudChurchService.getChurchRegistry();
      if (reg) setChurchRegistry(reg);
      if (count > 0) {
        showToast('Dados atualizados com sucesso a partir do banco de dados Firebase!');
      } else {
        showToast(
          'O banco no Firebase ainda não recebeu dados. Na Vercel, clique em "Sincronizar Dados Atuais para o Firebase"!',
          'info'
        );
      }
    } catch {
      showToast('Erro ao buscar dados no Firebase.', 'error');
    }
  };

  // Sync all current local state to Firestore
  const syncLocalDataToCloud = async () => {
    if (!auth.currentUser) {
      showToast('Faça login como Gestor para sincronizar no banco de dados.', 'error');
      return;
    }
    try {
      await CloudChurchService.seedAllChurchDataToCloud({
        churchInfo,
        bulletins,
        birthdays,
        deaconSchedules,
        banners,
        settings
      });
      setIsCloudSynced(true);
      showToast('Todos os dados da igreja foram salvos no Banco de Dados em Nuvem!');
    } catch {
      showToast('Erro ao sincronizar dados com o banco na nuvem.', 'error');
    }
  };

  // Import a full JSON backup from a previous deployment and sync to Firestore
  const importFullChurchBackup = async (jsonText: string) => {
    try {
      const parsed = JSON.parse(jsonText);
      const nextInfo: ChurchInfo = parsed.churchInfo || churchInfo;
      const nextBulletins: Bulletin[] = Array.isArray(parsed.bulletins) ? parsed.bulletins : bulletins;
      const nextBirthdays: BirthdayPerson[] = Array.isArray(parsed.birthdays) ? parsed.birthdays : birthdays;
      const nextDeacons: DeaconScheduleItem[] = Array.isArray(parsed.deaconSchedules)
        ? parsed.deaconSchedules
        : deaconSchedules;
      const nextBanners: Banner[] = Array.isArray(parsed.banners) ? parsed.banners : banners;
      const nextSettings: AppSettings = parsed.settings ? { ...settings, ...parsed.settings } : settings;

      setChurchInfoState(nextInfo);
      setBulletinsState(nextBulletins);
      setBirthdaysState(nextBirthdays);
      setDeaconSchedulesState(nextDeacons);
      setBannersState(nextBanners);
      setSettingsState(nextSettings);

      ChurchStorageService.saveChurchInfo(nextInfo);
      ChurchStorageService.saveBulletins(nextBulletins);
      ChurchStorageService.saveBirthdays(nextBirthdays);
      ChurchStorageService.saveDeaconSchedules(nextDeacons);
      ChurchStorageService.saveBanners(nextBanners);
      ChurchStorageService.saveSettings(nextSettings);

      if (isApprovedCloudManager) {
        await CloudChurchService.seedAllChurchDataToCloud({
          churchInfo: nextInfo,
          bulletins: nextBulletins,
          birthdays: nextBirthdays,
          deaconSchedules: nextDeacons,
          banners: nextBanners,
          settings: nextSettings
        });
        showToast('Backup importado e gravado com sucesso no Firebase!');
      } else {
        showToast('Backup importado localmente! Faça login como Gestor para enviar ao Firebase.');
      }
    } catch {
      showToast('Arquivo de backup inválido. Selecione um JSON válido.', 'error');
    }
  };

  // Cloud Authentication Actions
  const loginWithGoogleCloud = async (churchNameIfFirst?: string) => {
    const targetChurchName = churchNameIfFirst?.trim() || churchInfo.name;
    const { manager, isFirstOwner } = await CloudChurchService.authenticateWithGoogle(targetChurchName);
    setCurrentManagerAccount(manager);

    if (isFirstOwner && manager.status === 'approved') {
      const updatedInfo =
        targetChurchName !== churchInfo.name ? { ...churchInfo, name: targetChurchName } : churchInfo;
      if (targetChurchName !== churchInfo.name) {
        setChurchInfoState(updatedInfo);
        ChurchStorageService.saveChurchInfo(updatedInfo);
      }
      await CloudChurchService.seedAllChurchDataToCloud({
        churchInfo: updatedInfo,
        bulletins,
        birthdays,
        deaconSchedules,
        banners,
        settings
      });
      showToast('Conta de 1º Gestor (Principal) criada e igreja registrada no banco de dados!');
    } else if (manager.status === 'approved') {
      showToast(`Bem-vindo(a), ${manager.name}! Acesso de Gestor liberado.`);
    } else if (manager.status === 'pending') {
      showToast(
        'Solicitação enviada! O 1º Gestor da igreja precisa aprovar seu acesso antes de você editar.',
        'info'
      );
    } else {
      showToast('Seu acesso de gestor foi revogado pelo administrador principal.', 'error');
    }
  };

  const registerManagerWithEmailCloud = async (
    name: string,
    email: string,
    pass: string,
    churchNameIfFirst?: string
  ) => {
    const targetChurchName = churchNameIfFirst?.trim() || churchInfo.name;
    const { manager, isFirstOwner } = await CloudChurchService.registerWithEmail(
      name,
      email,
      pass,
      targetChurchName
    );
    setCurrentManagerAccount(manager);

    if (isFirstOwner && manager.status === 'approved') {
      const updatedInfo =
        targetChurchName !== churchInfo.name ? { ...churchInfo, name: targetChurchName } : churchInfo;
      if (targetChurchName !== churchInfo.name) {
        setChurchInfoState(updatedInfo);
        ChurchStorageService.saveChurchInfo(updatedInfo);
      }
      await CloudChurchService.seedAllChurchDataToCloud({
        churchInfo: updatedInfo,
        bulletins,
        birthdays,
        deaconSchedules,
        banners,
        settings
      });
      showToast('Conta de 1º Gestor criada com sucesso! Igreja vinculada no banco de dados.');
    } else if (manager.status === 'pending') {
      showToast(
        'Cadastro recebido! Como esta igreja já possui um 1º Gestor, aguarde a liberação dele.',
        'info'
      );
    }
  };

  const loginManagerWithEmailCloud = async (email: string, pass: string) => {
    const { manager } = await CloudChurchService.loginWithEmail(email, pass);
    setCurrentManagerAccount(manager);

    if (manager.status === 'approved') {
      showToast(`Bem-vindo(a) ao Painel de Gestão, ${manager.name}!`);
    } else if (manager.status === 'pending') {
      showToast('Sua conta ainda aguarda liberação do 1º Gestor da igreja.', 'info');
    } else {
      showToast('Seu acesso foi revogado pelo 1º Gestor.', 'error');
    }
  };

  const approveOrRevokeManager = async (targetUid: string, status: ManagerApprovalStatus) => {
    if (!isPrimaryOwner) {
      showToast('Apenas o 1º Gestor (Administrador Principal) pode aprovar ou revogar gestores.', 'error');
      return;
    }
    await CloudChurchService.updateManagerApprovalStatus(targetUid, status);
    showToast(
      status === 'approved'
        ? 'Novo gestor liberado com sucesso para administrar esta igreja!'
        : 'Acesso do gestor revogado.'
    );
  };

  const removePendingManager = async (targetUid: string) => {
    if (!isPrimaryOwner) {
      showToast('Apenas o 1º Gestor pode excluir solicitações.', 'error');
      return;
    }
    await CloudChurchService.removeManagerAccount(targetUid);
    showToast('Solicitação de gestor removida.');
  };

  // Church Info Handlers
  const updateChurchInfo = (info: ChurchInfo) => {
    setChurchInfoState(info);
    ChurchStorageService.saveChurchInfo(info);
    void persistToCloudIfAuthorized('info', info);
    showToast('Informações da igreja salvas e sincronizadas!');
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
    void persistToCloudIfAuthorized('bulletins', updatedList);
    showToast('Novo boletim publicado e salvo no banco de dados!');
  };

  const updateBulletin = (id: string, b: Partial<Bulletin>) => {
    const updatedList = bulletins.map((item) => {
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
    void persistToCloudIfAuthorized('bulletins', updatedList);
    showToast('Boletim atualizado no banco de dados!');
  };

  const deleteBulletin = (id: string) => {
    const updatedList = bulletins.filter((item) => item.id !== id);
    setBulletinsState(updatedList);
    ChurchStorageService.saveBulletins(updatedList);
    void persistToCloudIfAuthorized('bulletins', updatedList);
    showToast('Boletim excluído!');
  };

  const setCurrentBulletin = (id: string) => {
    const updatedList = bulletins.map((item) => ({
      ...item,
      isCurrent: item.id === id
    }));
    setBulletinsState(updatedList);
    ChurchStorageService.saveBulletins(updatedList);
    void persistToCloudIfAuthorized('bulletins', updatedList);
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
    void persistToCloudIfAuthorized('birthdays', updatedList);
    showToast('Aniversariante cadastrado no banco de dados!');
  };

  const updateBirthday = (id: string, person: Partial<BirthdayPerson>) => {
    const updatedList = birthdays.map((item) => (item.id === id ? { ...item, ...person } : item));
    setBirthdaysState(updatedList);
    ChurchStorageService.saveBirthdays(updatedList);
    void persistToCloudIfAuthorized('birthdays', updatedList);
    showToast('Aniversariante atualizado!');
  };

  const deleteBirthday = (id: string) => {
    const updatedList = birthdays.filter((item) => item.id !== id);
    setBirthdaysState(updatedList);
    ChurchStorageService.saveBirthdays(updatedList);
    void persistToCloudIfAuthorized('birthdays', updatedList);
    showToast('Aniversariante removido!');
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
    void persistToCloudIfAuthorized('birthdays', merged);
    showToast(`${parsed.length} aniversariantes importados e sincronizados!`);
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
    void persistToCloudIfAuthorized('deacons', updatedList);
    showToast('Escala diaconal salva no banco de dados!');
  };

  const updateDeaconSchedule = (id: string, item: Partial<DeaconScheduleItem>) => {
    const updatedList = deaconSchedules.map((s) => (s.id === id ? { ...s, ...item } : s));
    setDeaconSchedulesState(updatedList);
    ChurchStorageService.saveDeaconSchedules(updatedList);
    void persistToCloudIfAuthorized('deacons', updatedList);
    showToast('Escala diaconal atualizada!');
  };

  const deleteDeaconSchedule = (id: string) => {
    const updatedList = deaconSchedules.filter((s) => s.id !== id);
    setDeaconSchedulesState(updatedList);
    ChurchStorageService.saveDeaconSchedules(updatedList);
    void persistToCloudIfAuthorized('deacons', updatedList);
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
    void persistToCloudIfAuthorized('banners', updatedList);
    showToast('Banner adicionado e sincronizado!');
  };

  const updateBanner = (id: string, banner: Partial<Banner>) => {
    const updatedList = banners.map((b) => (b.id === id ? { ...b, ...banner } : b));
    setBannersState(updatedList);
    ChurchStorageService.saveBanners(updatedList);
    void persistToCloudIfAuthorized('banners', updatedList);
    showToast('Banner atualizado!');
  };

  const deleteBanner = (id: string) => {
    const updatedList = banners.filter((b) => b.id !== id);
    setBannersState(updatedList);
    ChurchStorageService.saveBanners(updatedList);
    void persistToCloudIfAuthorized('banners', updatedList);
    showToast('Banner removido!');
  };

  const toggleBannerActive = (id: string) => {
    const updatedList = banners.map((b) => (b.id === id ? { ...b, isActive: !b.isActive } : b));
    setBannersState(updatedList);
    ChurchStorageService.saveBanners(updatedList);
    void persistToCloudIfAuthorized('banners', updatedList);
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
    void persistToCloudIfAuthorized('settings', updated);
    showToast('Configurações salvas!');
  };

  // Legacy/Fallback Local Manager Authentication
  const managerLogin = (email: string, pass: string): boolean => {
    if (churchRegistry) {
      showToast('Esta igreja já possui um Gestor Principal no banco de dados. Use o login oficial.', 'error');
      return false;
    }
    const validEmail =
      email.toLowerCase().trim() === settings.managerEmail.toLowerCase().trim() ||
      email.toLowerCase().trim() === 'gestor@igreja.com.br';
    const validPass = pass === 'admin123' || pass === 'igreja123';

    if (validEmail && validPass) {
      setLocalFallbackAuth(true);
      showToast('Acesso de demonstração local ativado.');
      return true;
    }
    showToast('Credenciais inválidas.', 'error');
    return false;
  };

  const managerLogout = () => {
    setLocalFallbackAuth(false);
    void CloudChurchService.logout();
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
    const updated = notes.map((n) =>
      n.id === id ? { ...n, noteText, colorTag, updatedAt: new Date().toISOString() } : n
    );
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
    const jsonStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupPayload, null, 2));
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
      const importedNotes: UserBibleNote[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.notes)
        ? parsed.notes
        : [];
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
        firebaseUser,
        currentManagerAccount,
        churchRegistry,
        allManagers,
        isPrimaryOwner,
        isCloudSynced,
        loginWithGoogleCloud,
        registerManagerWithEmailCloud,
        loginManagerWithEmailCloud,
        approveOrRevokeManager,
        removePendingManager,
        syncLocalDataToCloud,
        pullLatestFromCloud,
        importFullChurchBackup,
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
