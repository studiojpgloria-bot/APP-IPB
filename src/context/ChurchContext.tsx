import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { BibleApiService } from '../services/bibleApi';
import {
  CloudChurchService,
  isPlatformOwnerEmail,
  slugifyChurchName
} from '../services/cloudDatabase';
import {
  ChurchStorageService,
  INITIAL_CHURCH_INFO,
  STORAGE_KEYS,
  UserCacheMetadata
} from '../services/storage';
import {
  AppSettings,
  Banner,
  BannerPosition,
  BirthdayPerson,
  Bulletin,
  ChurchInfo,
  ChurchManagerAccount,
  ChurchRegistry,
  ChurchStatus,
  ChurchTenant,
  DeaconScheduleItem,
  LeaderMember,
  ManagerApprovalStatus,
  PlatformSettings,
  PlatformUser,
  ScheduleItem,
  TeamRole,
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
  // Navigation & Multi-Church Routing
  currentView: ViewMode;
  setCurrentView: (view: ViewMode) => void;
  isChurchLoading: boolean;
  activeChurch: ChurchTenant | null;
  activeChurches: ChurchTenant[];
  managedChurches: ChurchTenant[];
  allChurchesForOwner: ChurchTenant[];
  allPlatformUsers: PlatformUser[];
  platformSettings: PlatformSettings;
  updatePlatformSettings: (settings: PlatformSettings) => Promise<void>;
  selectChurchBySlug: (slug: string, targetView?: ViewMode) => Promise<boolean>;
  switchChurch: () => void;
  openManagerPortalFromDirectory: () => void;

  // Multi-Church Manager Onboarding & Team Roles
  needsChurchOnboarding: boolean;
  isCreatingAdditionalChurch: boolean;
  setIsCreatingAdditionalChurch: (val: boolean) => void;
  currentUserTeamRole: TeamRole | null;
  isChurchAdmin: boolean;
  createNewChurchInCloud: (wizardData: {
    name: string;
    slug: string;
    logoUrl?: string;
    themeColor?: string;
    city: string;
    state: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    primaryPhone?: string;
    whatsappNumber?: string;
    email?: string;
    instagramUrl?: string;
    youtubeUrl?: string;
    facebookUrl?: string;
    tagline?: string;
    schedules?: ScheduleItem[];
  }) => Promise<ChurchTenant>;
  updateChurchSlugAndMeta: (extra: {
    slug?: string;
    city?: string;
    state?: string;
    themeColor?: string;
    latitude?: number;
    longitude?: number;
  }) => Promise<void>;
  inviteTeamMemberByEmail: (email: string, role: TeamRole) => Promise<void>;
  updateTeamMemberRoleByEmail: (email: string, role: TeamRole) => Promise<void>;
  inviteCoManagerByEmail: (email: string) => Promise<void>;
  removeCoManagerEmail: (email: string) => Promise<void>;

  // Owner /admin Actions
  isPlatformOwner: boolean;
  setChurchStatusByOwner: (churchId: string, status: ChurchStatus) => Promise<void>;
  deleteChurchByOwner: (churchId: string) => Promise<void>;
  wipeAllPlatformDataByOwner: () => Promise<void>;

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

  // Cloud & Manager Authentication
  isManagerAuthenticated: boolean;
  isEmailVerified: boolean;
  firebaseUser: User | null;
  platformUser: PlatformUser | null;
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
  resendEmailVerification: () => Promise<void>;
  checkEmailVerificationNow: () => Promise<boolean>;
  approveOrRevokeManager: (targetUid: string, status: ManagerApprovalStatus) => Promise<void>;
  removePendingManager: (targetUid: string) => Promise<void>;
  syncLocalDataToCloud: () => Promise<void>;
  pullLatestFromCloud: () => Promise<void>;
  resetAllChurchContentToBlank: () => Promise<void>;
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

function parseUrlRoute(pathname: string): {
  mode: 'directory' | 'admin' | 'church' | 'manager';
  slug?: string;
} {
  const clean = pathname.replace(/^\/+|\/+$/g, '');
  if (!clean) {
    return { mode: 'directory' };
  }
  if (clean === 'admin') {
    return { mode: 'admin' };
  }
  if (clean === 'gestor') {
    return { mode: 'manager' };
  }
  const segments = clean.split('/');
  const slug = segments[0].toLowerCase();
  if (segments[1] === 'gestor') {
    return { mode: 'manager', slug };
  }
  return { mode: 'church', slug };
}

export const ChurchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cacheMetadata, setCacheMetadata] = useState<UserCacheMetadata>(() =>
    ChurchStorageService.initializeUserCacheOnBoot()
  );

  const initialRoute = parseUrlRoute(
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );
  const savedSlugOnBoot = ChurchStorageService.getSelectedChurchSlug();
  const targetSlugOnBoot =
    initialRoute.mode === 'church' || (initialRoute.mode === 'manager' && initialRoute.slug)
      ? initialRoute.slug || ''
      : initialRoute.mode === 'directory' && savedSlugOnBoot
      ? savedSlugOnBoot
      : '';
  const cachedBrandOnBoot = targetSlugOnBoot
    ? ChurchStorageService.getCachedChurchBrand(targetSlugOnBoot)
    : null;

  const [currentView, setCurrentViewState] = useState<ViewMode>(() => {
    if (initialRoute.mode === 'admin') return 'admin';
    if (initialRoute.mode === 'manager') return 'manager';
    if (initialRoute.mode === 'church') return 'home';
    if (savedSlugOnBoot) return 'home';
    return 'directory';
  });

  const [isChurchLoading, setIsChurchLoading] = useState<boolean>(() =>
    Boolean(targetSlugOnBoot && !cachedBrandOnBoot)
  );

  const [isMobileAppPreview, setIsMobileAppPreviewState] = useState<boolean>(false);

  // Multi-Church State
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>({
    appName: 'Minha Igreja',
    tagline: 'Conectando você à sua comunidade de fé'
  });
  const [activeChurches, setActiveChurches] = useState<ChurchTenant[]>([]);
  const [managedChurchesState, setManagedChurchesState] = useState<ChurchTenant[]>([]);
  const [activeChurch, setActiveChurch] = useState<ChurchTenant | null>(() => {
    if (!cachedBrandOnBoot) return null;
    const savedInfo = ChurchStorageService.getChurchInfo();
    const isSameChurch =
      savedInfo.name &&
      savedInfo.name.trim().toLowerCase() === cachedBrandOnBoot.name.trim().toLowerCase();
    const baseInfo = isSameChurch ? savedInfo : INITIAL_CHURCH_INFO;
    return {
      ...baseInfo,
      id: cachedBrandOnBoot.id,
      slug: cachedBrandOnBoot.slug,
      name: cachedBrandOnBoot.name,
      logoUrl: cachedBrandOnBoot.logoUrl || baseInfo.logoUrl || '',
      themeColor: cachedBrandOnBoot.themeColor || '#344E41',
      city: cachedBrandOnBoot.city || '',
      state: cachedBrandOnBoot.state || '',
      tagline: cachedBrandOnBoot.tagline || baseInfo.tagline || '',
      status: 'ativa',
      ownerUid: '',
      ownerEmail: '',
      managerUids: [],
      managerEmails: []
    };
  });
  const [allChurchesForOwner, setAllChurchesForOwner] = useState<ChurchTenant[]>([]);
  const [allPlatformUsers, setAllPlatformUsers] = useState<PlatformUser[]>([]);
  const [isCreatingAdditionalChurch, setIsCreatingAdditionalChurch] = useState<boolean>(false);

  // Current Church Data State (instant from local cache when reopening same church, otherwise empty)
  const [churchInfo, setChurchInfoState] = useState<ChurchInfo>(() => {
    if (!cachedBrandOnBoot) return INITIAL_CHURCH_INFO;
    const savedInfo = ChurchStorageService.getChurchInfo();
    if (
      savedInfo.name &&
      savedInfo.name.trim().toLowerCase() === cachedBrandOnBoot.name.trim().toLowerCase()
    ) {
      return {
        ...savedInfo,
        name: cachedBrandOnBoot.name,
        logoUrl: cachedBrandOnBoot.logoUrl || savedInfo.logoUrl,
        tagline: cachedBrandOnBoot.tagline || savedInfo.tagline
      };
    }
    return {
      ...INITIAL_CHURCH_INFO,
      name: cachedBrandOnBoot.name,
      logoUrl: cachedBrandOnBoot.logoUrl || '',
      tagline: cachedBrandOnBoot.tagline || '',
      cityStateZip: `${cachedBrandOnBoot.city || ''}${
        cachedBrandOnBoot.state ? ` - ${cachedBrandOnBoot.state}` : ''
      }`
    };
  });
  const [bulletins, setBulletinsState] = useState<Bulletin[]>([]);
  const [birthdays, setBirthdaysState] = useState<BirthdayPerson[]>([]);
  const [deaconSchedules, setDeaconSchedulesState] = useState<DeaconScheduleItem[]>([]);
  const [banners, setBannersState] = useState<Banner[]>([]);
  const [settings, setSettingsState] = useState<AppSettings>(() =>
    ChurchStorageService.getSettings()
  );

  // Firebase Auth & Platform User State
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [platformUser, setPlatformUser] = useState<PlatformUser | null>(null);
  const [currentManagerAccount, setCurrentManagerAccount] = useState<ChurchManagerAccount | null>(
    null
  );
  const [churchRegistry, setChurchRegistry] = useState<ChurchRegistry | null>(null);
  const [allManagers, setAllManagers] = useState<ChurchManagerAccount[]>([]);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);

  const [selectedBulletinForReader, setSelectedBulletinForReader] = useState<Bulletin | null>(null);

  // Bible Local User Data
  const [notes, setNotesState] = useState<UserBibleNote[]>(() =>
    ChurchStorageService.getUserNotes()
  );
  const [favorites, setFavoritesState] = useState<UserFavoriteVerse[]>(() =>
    ChurchStorageService.getUserFavorites()
  );

  // UI Dialogs & Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  const [emailVerifiedFlag, setEmailVerifiedFlag] = useState<boolean>(false);
  const isEmailVerified = Boolean(firebaseUser && (firebaseUser.emailVerified || emailVerifiedFlag));

  // Permissions verified strictly from Firestore (`users/{uid}` and `churches/{churchId}`)
  // SECURITY: Only PLATFORM_OWNER_EMAIL (studiojpgloria@gmail.com) with verified email is owner
  const isPlatformOwner = Boolean(
    firebaseUser &&
      isEmailVerified &&
      isPlatformOwnerEmail(firebaseUser.email, true)
  );

  // Determine the logged-in user's team role on the activeChurch ('admin' | 'editor' | null)
  // SECURITY: Team invites and email-based permissions require a verified email (isEmailVerified)
  const currentUserTeamRole: TeamRole | null = React.useMemo(() => {
    if (!firebaseUser || !isEmailVerified) return null;
    if (isPlatformOwner) return 'admin';
    if (!activeChurch) return null;

    const emailLower = (firebaseUser.email || '').toLowerCase().trim();
    if (
      activeChurch.ownerUid === firebaseUser.uid ||
      (emailLower && activeChurch.ownerEmail?.toLowerCase().trim() === emailLower)
    ) {
      return 'admin';
    }

    if (
      activeChurch.adminUids?.includes(firebaseUser.uid) ||
      (emailLower && activeChurch.adminEmails?.includes(emailLower))
    ) {
      return 'admin';
    }

    const memberEntry = activeChurch.teamMembers?.find((m) => m.email === emailLower);
    if (memberEntry) {
      return memberEntry.role;
    }

    if (
      activeChurch.editorUids?.includes(firebaseUser.uid) ||
      (emailLower && activeChurch.editorEmails?.includes(emailLower))
    ) {
      return 'editor';
    }

    if (
      activeChurch.managerUids?.includes(firebaseUser.uid) ||
      (emailLower && activeChurch.managerEmails?.includes(emailLower))
    ) {
      return 'admin';
    }

    return null;
  }, [firebaseUser, isEmailVerified, isPlatformOwner, activeChurch]);

  const isChurchAdmin = currentUserTeamRole === 'admin';
  const canManageActiveChurch = Boolean(
    firebaseUser &&
      isEmailVerified &&
      platformUser?.status !== 'revoked' &&
      (currentUserTeamRole === 'admin' || currentUserTeamRole === 'editor')
  );

  const isManagerAuthenticated = canManageActiveChurch;
  const isPrimaryOwner = isChurchAdmin;

  // All churches this user can manage (for the multi-church selector in ManagerView)
  const managedChurches = React.useMemo(() => {
    if (!isEmailVerified) return [];
    if (isPlatformOwner) {
      return allChurchesForOwner;
    }
    return managedChurchesState;
  }, [isEmailVerified, isPlatformOwner, allChurchesForOwner, managedChurchesState]);

  const needsChurchOnboarding = Boolean(
    firebaseUser &&
      isEmailVerified &&
      (isCreatingAdditionalChurch ||
        (!activeChurch && managedChurches.length === 0))
  );

  // Helper to stamp author/editor audit fields on publications
  const getAuditActor = () => {
    const email = (firebaseUser?.email || platformUser?.email || '').toLowerCase().trim();
    const name =
      platformUser?.name ||
      firebaseUser?.displayName ||
      (email ? email.split('@')[0] : 'Gestor');
    return { name, email, nowIso: new Date().toISOString() };
  };

  const setIsMobileAppPreview = (val: boolean) => {
    setIsMobileAppPreviewState(val);
  };

  const refreshCacheMetadata = () => {
    setCacheMetadata(ChurchStorageService.touchCacheMeta());
  };

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

  // Update URL when view changes
  const setCurrentView = (view: ViewMode) => {
    setCurrentViewState(view);
    if (typeof window === 'undefined') return;
    const slug = activeChurch?.slug;
    let targetPath = window.location.pathname;
    if (view === 'directory') {
      targetPath = '/';
    } else if (view === 'admin') {
      targetPath = '/admin';
    } else if (view === 'manager') {
      targetPath = slug ? `/${slug}/gestor` : '/gestor';
    } else if (slug) {
      targetPath = `/${slug}`;
    } else {
      targetPath = '/';
    }
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  };

  // Requirement 1: Dynamic church theme color & exact document.title per screen
  useEffect(() => {
    const isPlatformScreen =
      currentView === 'directory' || currentView === 'admin' || currentView === 'manager' || !activeChurch;
    const color = isPlatformScreen ? '#344E41' : activeChurch?.themeColor || '#344E41';
    const rawPlatformName = (platformSettings.appName || 'Minha Igreja').trim();
    const isSameAsChurch =
      Boolean(activeChurch?.name) &&
      rawPlatformName.toLowerCase() === activeChurch!.name.trim().toLowerCase();
    const platformBrand = !rawPlatformName || isSameAsChurch ? 'Minha Igreja' : rawPlatformName;

    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--church-theme', color);

      if (currentView === 'directory') {
        document.title = platformBrand;
      } else if (currentView === 'admin') {
        document.title = `Administração — ${platformBrand}`;
      } else if (currentView === 'manager') {
        document.title = `Portal do Gestor — ${platformBrand}`;
      } else if (activeChurch?.name || churchInfo.name) {
        const chName = (activeChurch?.name || churchInfo.name).trim();
        document.title = `${chName} — ${platformBrand}`;
      } else {
        document.title = platformBrand;
      }
    }
  }, [activeChurch, churchInfo.name, currentView, platformSettings.appName]);

  // 1. Subscribe to Platform Settings & Active Churches Directory (no demo fallback!)
  useEffect(() => {
    const unsubPlatform = CloudChurchService.subscribeToPlatformSettings((cfg) => {
      setPlatformSettings(cfg);
    });

    const unsubDirectory = CloudChurchService.subscribeToActiveChurches((list) => {
      setActiveChurches(list);
      setIsCloudSynced(true);
    });

    return () => {
      unsubPlatform();
      unsubDirectory();
    };
  }, []);

  // 2. Resolve Initial Route or Saved Church Slug on Boot & Popstate
  useEffect(() => {
    const resolveRoute = async () => {
      const route = parseUrlRoute(window.location.pathname);
      if (route.mode === 'admin') {
        setIsChurchLoading(false);
        setCurrentViewState('admin');
        return;
      }

      if (route.mode === 'manager' && !route.slug) {
        setIsChurchLoading(false);
        setCurrentViewState('manager');
        return;
      }

      const targetSlug = route.slug || ChurchStorageService.getSelectedChurchSlug();
      if (!targetSlug) {
        setIsChurchLoading(false);
        setActiveChurch(null);
        setChurchInfoState(INITIAL_CHURCH_INFO);
        setCurrentViewState('directory');
        return;
      }

      const cached = ChurchStorageService.getCachedChurchBrand(targetSlug);
      if (!cached && (!activeChurch || activeChurch.slug !== targetSlug.toLowerCase())) {
        setIsChurchLoading(true);
      }

      const found =
        activeChurches.find((c) => c.slug === targetSlug || c.id === targetSlug) ||
        (await CloudChurchService.getChurchBySlug(targetSlug));

      if (found) {
        if (found.status === 'bloqueada' && !isPlatformOwner) {
          showToast('Esta igreja está temporariamente indisponível na plataforma.', 'error');
          ChurchStorageService.saveSelectedChurchSlug('');
          setIsChurchLoading(false);
          setActiveChurch(null);
          setChurchInfoState(INITIAL_CHURCH_INFO);
          setCurrentViewState('directory');
          window.history.replaceState({}, '', '/');
          return;
        }
        setActiveChurch(found);
        ChurchStorageService.saveSelectedChurchSlug(found.slug);
        ChurchStorageService.saveCachedChurchBrand(found);
        setIsChurchLoading(false);
        if (route.mode === 'manager') {
          setCurrentViewState('manager');
        } else if (route.mode === 'directory' && window.location.pathname === '/') {
          window.history.replaceState({}, '', `/${found.slug}`);
          setCurrentViewState('home');
        }
      } else {
        // Saved slug or route slug does not exist in Firestore -> clean up and go to directory
        ChurchStorageService.saveSelectedChurchSlug('');
        setIsChurchLoading(false);
        setActiveChurch(null);
        setChurchInfoState(INITIAL_CHURCH_INFO);
        if (route.mode === 'manager') {
          setCurrentViewState('manager');
          window.history.replaceState({}, '', '/gestor');
        } else {
          setCurrentViewState('directory');
          window.history.replaceState({}, '', '/');
        }
      }
    };

    void resolveRoute();

    const handlePopState = () => {
      const r = parseUrlRoute(window.location.pathname);
      if (r.mode === 'admin') {
        setIsChurchLoading(false);
        setCurrentViewState('admin');
      } else if (r.mode === 'directory') {
        setIsChurchLoading(false);
        setActiveChurch(null);
        setChurchInfoState(INITIAL_CHURCH_INFO);
        setCurrentViewState('directory');
      } else if (r.mode === 'manager') {
        if (r.slug) void selectChurchBySlug(r.slug, 'manager');
        else {
          setIsChurchLoading(false);
          setActiveChurch(null);
          setChurchInfoState(INITIAL_CHURCH_INFO);
          setCurrentViewState('manager');
        }
      } else if (r.slug) {
        void selectChurchBySlug(r.slug, 'home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeChurches.length, isPlatformOwner]);

  // 3. Subscribe in real-time to Active Church and its Subcollections
  useEffect(() => {
    if (!activeChurch?.id) {
      setChurchInfoState(INITIAL_CHURCH_INFO);
      setBulletinsState([]);
      setBirthdaysState([]);
      setDeaconSchedulesState([]);
      setBannersState([]);
      return;
    }

    const unsub = CloudChurchService.subscribeToChurchAndSubcollections(activeChurch.id, {
      onTenant: (tenant) => {
        if (!tenant) {
          setActiveChurch(null);
          setChurchInfoState(INITIAL_CHURCH_INFO);
          return;
        }
        setActiveChurch(tenant);
        ChurchStorageService.saveCachedChurchBrand(tenant);
        setIsChurchLoading(false);
        const nextInfo: ChurchInfo = {
          name: tenant.name || '',
          tagline: tenant.tagline || '',
          aboutHistory: tenant.aboutHistory || '',
          missionVision: tenant.missionVision || '',
          address: tenant.address || '',
          cityStateZip:
            tenant.cityStateZip ||
            `${tenant.city || ''}${tenant.state ? ` - ${tenant.state}` : ''}`,
          googleMapsUrl: tenant.googleMapsUrl || '',
          primaryPhone: tenant.primaryPhone || '',
          secondaryPhone: tenant.secondaryPhone || '',
          whatsappNumber: tenant.whatsappNumber || '',
          whatsappDefaultMessage: tenant.whatsappDefaultMessage || '',
          email: tenant.email || '',
          instagramUrl: tenant.instagramUrl || '',
          youtubeUrl: tenant.youtubeUrl || '',
          facebookUrl: tenant.facebookUrl || '',
          logoUrl: tenant.logoUrl || '',
          schedules: tenant.schedules || [],
          leadership: tenant.leadership || []
        };
        setChurchInfoState(nextInfo);
        ChurchStorageService.saveChurchInfo(nextInfo);
        setChurchRegistry({
          churchId: tenant.id,
          churchName: tenant.name,
          ownerUid: tenant.ownerUid,
          ownerEmail: tenant.ownerEmail,
          ownerName: tenant.ownerName || tenant.ownerEmail,
          createdAt: tenant.createdAt
        });
        setIsCloudSynced(true);
      },
      onBulletins: (list) => {
        setBulletinsState(list);
        ChurchStorageService.saveBulletins(list);
        setIsCloudSynced(true);
      },
      onBirthdays: (list) => {
        setBirthdaysState(list);
        ChurchStorageService.saveBirthdays(list);
        setIsCloudSynced(true);
      },
      onDeaconSchedules: (list) => {
        setDeaconSchedulesState(list);
        ChurchStorageService.saveDeaconSchedules(list);
        setIsCloudSynced(true);
      },
      onBanners: (list) => {
        setBannersState(list);
        ChurchStorageService.saveBanners(list);
        setIsCloudSynced(true);
      },
      onLeadership: (list) => {
        if (list.length > 0) {
          setChurchInfoState((prev) => {
            const updated = { ...prev, leadership: list };
            ChurchStorageService.saveChurchInfo(updated);
            return updated;
          });
        }
      },
      onSchedules: (list) => {
        if (list.length > 0) {
          setChurchInfoState((prev) => {
            const updated = { ...prev, schedules: list };
            ChurchStorageService.saveChurchInfo(updated);
            return updated;
          });
        }
      }
    });

    return () => unsub();
  }, [activeChurch?.id]);

  // 4. Listen to Firebase Auth State, `users/{uid}`, and `managedChurches`
  useEffect(() => {
    let unsubUserDoc: (() => void) | null = null;
    let unsubManagedChurches: (() => void) | null = null;
    let unsubOwnerChurches: (() => void) | null = null;
    let unsubOwnerUsers: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      setEmailVerifiedFlag(Boolean(user?.emailVerified));

      if (unsubUserDoc) {
        unsubUserDoc();
        unsubUserDoc = null;
      }
      if (unsubManagedChurches) {
        unsubManagedChurches();
        unsubManagedChurches = null;
      }
      if (unsubOwnerChurches) {
        unsubOwnerChurches();
        unsubOwnerChurches = null;
      }
      if (unsubOwnerUsers) {
        unsubOwnerUsers();
        unsubOwnerUsers = null;
      }

      if (!user) {
        setPlatformUser(null);
        setCurrentManagerAccount(null);
        setAllManagers([]);
        setManagedChurchesState([]);
        setAllChurchesForOwner([]);
        setAllPlatformUsers([]);
        return;
      }

      try {
        const resolved = await CloudChurchService.resolveOrCreatePlatformUser(user);
        setPlatformUser(resolved);
      } catch (e) {
        console.warn('Error resolving platform user:', e);
      }

      if (user.email && user.emailVerified) {
        unsubManagedChurches = CloudChurchService.subscribeToManagedChurches(
          user.uid,
          user.email,
          (chList) => {
            setManagedChurchesState(chList);
          }
        );
      }

      unsubUserDoc = onSnapshot(
        doc(db, 'users', user.uid),
        (snap) => {
          if (snap.exists()) {
            const pUser = { ...(snap.data() as PlatformUser), uid: snap.id };
            setPlatformUser(pUser);
            setCurrentManagerAccount({
              uid: pUser.uid,
              email: pUser.email,
              name: pUser.name,
              role: isPlatformOwnerEmail(user.email, Boolean(user.emailVerified)) ? 'owner' : 'gestor',
              status: pUser.status || 'approved',
              churchId: pUser.churchId,
              churchSlug: pUser.churchSlug,
              requestedAt: pUser.createdAt
            });

            if (isPlatformOwnerEmail(user.email, Boolean(user.emailVerified))) {
              if (!unsubOwnerChurches) {
                unsubOwnerChurches = CloudChurchService.subscribeToAllChurchesForOwner((chList) => {
                  setAllChurchesForOwner(chList);
                });
              }
              if (!unsubOwnerUsers) {
                unsubOwnerUsers = CloudChurchService.subscribeToAllUsersForOwner((uList) => {
                  setAllPlatformUsers(uList);
                });
              }
            }
          }
        },
        (err) => console.warn('User profile listener:', err)
      );
    });

    return () => {
      unsubAuth();
      if (unsubUserDoc) unsubUserDoc();
      if (unsubManagedChurches) unsubManagedChurches();
      if (unsubOwnerChurches) unsubOwnerChurches();
      if (unsubOwnerUsers) unsubOwnerUsers();
    };
  }, []);

  // Auto-select a managed church when inside the Manager Portal if none is currently selected
  useEffect(() => {
    if (
      currentView === 'manager' &&
      firebaseUser &&
      !activeChurch &&
      !isCreatingAdditionalChurch &&
      managedChurches.length > 0
    ) {
      const preferredSlug =
        platformUser?.churchSlug &&
        managedChurches.some((c) => c.slug === platformUser.churchSlug)
          ? platformUser.churchSlug
          : managedChurches[0].slug;
      void selectChurchBySlug(preferredSlug, 'manager');
    }
  }, [
    currentView,
    firebaseUser,
    activeChurch,
    isCreatingAdditionalChurch,
    managedChurches,
    platformUser?.churchSlug
  ]);

  // Sync Bible API config
  useEffect(() => {
    if (settings.bibleConfig) {
      BibleApiService.setConfig(settings.bibleConfig);
    }
  }, [settings.bibleConfig]);

  // Listen for cross-tab localStorage updates on personal Bible notes
  useEffect(() => {
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
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Multi-Church Navigation Actions
  const selectChurchBySlug = async (
    slug: string,
    targetView: ViewMode = 'home'
  ): Promise<boolean> => {
    const clean = slug.trim().toLowerCase();
    const localMatch =
      activeChurches.find((c) => c.slug === clean || c.id === clean) ||
      managedChurches.find((c) => c.slug === clean || c.id === clean) ||
      allChurchesForOwner.find((c) => c.slug === clean || c.id === clean);

    if (!localMatch) {
      const cached = ChurchStorageService.getCachedChurchBrand(clean);
      if (cached) {
        setActiveChurch((prev) =>
          prev?.slug === clean
            ? prev
            : {
                ...INITIAL_CHURCH_INFO,
                id: cached.id,
                slug: cached.slug,
                name: cached.name,
                logoUrl: cached.logoUrl,
                themeColor: cached.themeColor,
                city: cached.city,
                state: cached.state,
                tagline: cached.tagline,
                status: 'ativa',
                ownerUid: '',
                ownerEmail: '',
                managerUids: [],
                managerEmails: []
              }
        );
      } else {
        setIsChurchLoading(true);
      }
    }

    const tenant = localMatch || (await CloudChurchService.getChurchBySlug(clean));

    if (!tenant) {
      setIsChurchLoading(false);
      showToast('Igreja não encontrada.', 'error');
      return false;
    }

    if (tenant.status === 'bloqueada' && !isPlatformOwner) {
      setIsChurchLoading(false);
      showToast(
        'Esta igreja está temporariamente bloqueada pelo administrador da plataforma.',
        'error'
      );
      return false;
    }

    setIsCreatingAdditionalChurch(false);
    setActiveChurch(tenant);
    ChurchStorageService.saveSelectedChurchSlug(tenant.slug);
    ChurchStorageService.saveCachedChurchBrand(tenant);
    setIsChurchLoading(false);
    setCurrentViewState(targetView);

    if (typeof window !== 'undefined') {
      const nextPath = targetView === 'manager' ? `/${tenant.slug}/gestor` : `/${tenant.slug}`;
      if (window.location.pathname !== nextPath) {
        window.history.pushState({}, '', nextPath);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    return true;
  };

  const switchChurch = () => {
    setIsCreatingAdditionalChurch(false);
    setIsChurchLoading(false);
    ChurchStorageService.saveSelectedChurchSlug('');
    setActiveChurch(null);
    setChurchInfoState(INITIAL_CHURCH_INFO);
    setBulletinsState([]);
    setBirthdaysState([]);
    setDeaconSchedulesState([]);
    setBannersState([]);
    setCurrentViewState('directory');
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Requirement 2: Clicking "Sou gestor" from the initial screen opens the Platform Manager Portal cleanly without last visited church's header/menu
  const openManagerPortalFromDirectory = () => {
    setIsCreatingAdditionalChurch(false);
    if (firebaseUser && managedChurches.length > 0) {
      const targetSlug =
        platformUser?.churchSlug &&
        managedChurches.some((c) => c.slug === platformUser.churchSlug)
          ? platformUser.churchSlug
          : managedChurches[0].slug;
      void selectChurchBySlug(targetSlug, 'manager');
    } else {
      setActiveChurch(null);
      setChurchInfoState(INITIAL_CHURCH_INFO);
      setCurrentViewState('manager');
      if (typeof window !== 'undefined') {
        window.history.pushState({}, '', '/gestor');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  // Onboarding Wizard & Church Creation
  const createNewChurchInCloud = async (wizardData: {
    name: string;
    slug: string;
    logoUrl?: string;
    themeColor?: string;
    city: string;
    state: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    primaryPhone?: string;
    whatsappNumber?: string;
    email?: string;
    instagramUrl?: string;
    youtubeUrl?: string;
    facebookUrl?: string;
    tagline?: string;
    schedules?: ScheduleItem[];
  }): Promise<ChurchTenant> => {
    if (!auth.currentUser) {
      throw new Error('Faça login para cadastrar sua igreja.');
    }
    const created = await CloudChurchService.createChurchForManager(auth.currentUser, wizardData);
    setIsCreatingAdditionalChurch(false);
    setActiveChurch(created);
    ChurchStorageService.saveSelectedChurchSlug(created.slug);
    ChurchStorageService.saveCachedChurchBrand(created);
    setIsChurchLoading(false);
    setBulletinsState([]);
    setBirthdaysState([]);
    setDeaconSchedulesState([]);
    setBannersState([]);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', `/${created.slug}/gestor`);
    }
    showToast(`Igreja "${created.name}" criada com sucesso! Link: /${created.slug}`);
    return created;
  };

  const updateChurchSlugAndMeta = async (extra: {
    slug?: string;
    city?: string;
    state?: string;
    themeColor?: string;
    latitude?: number;
    longitude?: number;
  }) => {
    if (!activeChurch || !isChurchAdmin) {
      showToast('Apenas Administradores podem alterar os dados da igreja.', 'error');
      return;
    }
    if (extra.slug) {
      const clean = slugifyChurchName(extra.slug);
      const ok = await CloudChurchService.isSlugAvailable(clean, activeChurch.id);
      if (!ok) {
        showToast('Este link (slug) já está sendo usado por outra igreja.', 'error');
        return;
      }
      extra.slug = clean;
    }
    await CloudChurchService.saveChurchTenantInfo(activeChurch.id, churchInfo, extra);
    if (extra.slug) {
      ChurchStorageService.saveSelectedChurchSlug(extra.slug);
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', `/${extra.slug}/gestor`);
      }
    }
    showToast('Configurações de identificação e localização da igreja atualizadas!');
  };

  // Team Management (Administrador vs Editor)
  const inviteTeamMemberByEmail = async (email: string, role: TeamRole) => {
    if (!activeChurch || !isChurchAdmin) {
      showToast('Apenas Administradores podem gerenciar a equipe.', 'error');
      return;
    }
    const actor = getAuditActor();
    await CloudChurchService.inviteTeamMember(activeChurch.id, email, role, actor.email);
    showToast(
      `Convite enviado para ${email.toLowerCase().trim()} como ${
        role === 'admin' ? 'Administrador' : 'Editor'
      }!`
    );
  };

  const updateTeamMemberRoleByEmail = async (email: string, role: TeamRole) => {
    if (!activeChurch || !isChurchAdmin) {
      showToast('Apenas Administradores podem alterar níveis da equipe.', 'error');
      return;
    }
    try {
      await CloudChurchService.updateTeamMemberRole(activeChurch.id, email, role);
      showToast(
        `Nível de ${email} alterado para ${role === 'admin' ? 'Administrador' : 'Editor'}.`
      );
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Erro ao alterar nível.', 'error');
    }
  };

  const inviteCoManagerByEmail = async (email: string) => {
    await inviteTeamMemberByEmail(email, 'admin');
  };

  const removeCoManagerEmail = async (email: string) => {
    if (!activeChurch || !isChurchAdmin) {
      showToast('Apenas Administradores podem remover membros da equipe.', 'error');
      return;
    }
    try {
      await CloudChurchService.removeManagerEmailFromChurch(activeChurch.id, email);
      showToast(`Membro ${email} removido da equipe.`, 'info');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Erro ao remover membro.', 'error');
    }
  };

  // Owner /admin Actions
  const updatePlatformSettings = async (cfg: PlatformSettings) => {
    if (!isPlatformOwner) {
      showToast('Apenas o proprietário da plataforma pode alterar a marca global.', 'error');
      return;
    }
    await CloudChurchService.savePlatformSettings(cfg);
    showToast('Nome e slogan da plataforma atualizados!');
  };

  const setChurchStatusByOwner = async (churchId: string, status: ChurchStatus) => {
    if (!isPlatformOwner) return;
    await CloudChurchService.updateChurchStatusByOwner(churchId, status);
    showToast(`Status da igreja atualizado para "${status.toUpperCase()}".`);
  };

  const deleteChurchByOwner = async (churchId: string) => {
    if (!isPlatformOwner) return;
    await CloudChurchService.deleteChurchByOwner(churchId);
    if (activeChurch?.id === churchId) {
      switchChurch();
    }
    showToast('Igreja e todas as suas subcoleções foram excluídas.');
  };

  const wipeAllPlatformDataByOwner = async () => {
    if (!isPlatformOwner) {
      showToast('Apenas o owner da plataforma pode executar esta ação.', 'error');
      return;
    }
    await CloudChurchService.wipeAllPlatformDataByOwner();
    ChurchStorageService.clearAllChurchCacheFromDevice();
    setActiveChurch(null);
    setActiveChurches([]);
    setManagedChurchesState([]);
    setAllChurchesForOwner([]);
    setChurchInfoState(INITIAL_CHURCH_INFO);
    setBulletinsState([]);
    setBirthdaysState([]);
    setDeaconSchedulesState([]);
    setBannersState([]);
    showToast('Todos os dados de igrejas e subcoleções foram apagados da plataforma!');
  };

  // Pull & Sync Actions
  const pullLatestFromCloud = async () => {
    if (!activeChurch) {
      showToast('Selecione uma igreja primeiro.', 'info');
      return;
    }
    const fresh = await CloudChurchService.getChurchBySlug(activeChurch.slug);
    if (fresh) {
      setActiveChurch(fresh);
      showToast('Dados atualizados com sucesso a partir do Firebase!');
    }
  };

  const resetAllChurchContentToBlank = async () => {
    if (!isChurchAdmin) {
      showToast('Apenas Administradores podem zerar o conteúdo da igreja.', 'error');
      return;
    }
    const blankInfo: ChurchInfo = {
      ...INITIAL_CHURCH_INFO,
      name: activeChurch?.name || '',
      schedules: [],
      leadership: []
    };
    const blankSettings: AppSettings = {
      ...settings,
      appName: 'Minha Igreja',
      managerEmail: '',
      lastUpdated: new Date().toISOString()
    };

    setChurchInfoState(blankInfo);
    setBulletinsState([]);
    setBirthdaysState([]);
    setDeaconSchedulesState([]);
    setBannersState([]);
    setSettingsState(blankSettings);

    ChurchStorageService.saveChurchInfo(blankInfo);
    ChurchStorageService.saveBulletins([]);
    ChurchStorageService.saveBirthdays([]);
    ChurchStorageService.saveDeaconSchedules([]);
    ChurchStorageService.saveBanners([]);
    ChurchStorageService.saveSettings(blankSettings);

    if (auth.currentUser && activeChurch) {
      try {
        await CloudChurchService.seedAllChurchDataToCloud(activeChurch.id, {
          churchInfo: blankInfo,
          bulletins: [],
          birthdays: [],
          deaconSchedules: [],
          banners: [],
          settings: blankSettings
        });
        setIsCloudSynced(true);
        showToast('Conteúdo desta igreja zerado no Firebase!');
      } catch {
        showToast('Conteúdo local zerado, mas houve erro ao limpar o Firebase.', 'error');
      }
    } else {
      showToast('Conteúdo local zerado!');
    }
  };

  const syncLocalDataToCloud = async () => {
    if (!auth.currentUser || !activeChurch) {
      showToast('Faça login como Gestor de uma igreja para sincronizar.', 'error');
      return;
    }
    try {
      if (isChurchAdmin) {
        await CloudChurchService.seedAllChurchDataToCloud(activeChurch.id, {
          churchInfo,
          bulletins,
          birthdays,
          deaconSchedules,
          banners,
          settings
        });
      } else {
        await CloudChurchService.replaceSubcollectionItems(activeChurch.id, 'boletins', bulletins);
        await CloudChurchService.replaceSubcollectionItems(
          activeChurch.id,
          'aniversariantes',
          birthdays
        );
        await CloudChurchService.replaceSubcollectionItems(
          activeChurch.id,
          'escalas',
          deaconSchedules
        );
        await CloudChurchService.replaceSubcollectionItems(activeChurch.id, 'banners', banners);
      }
      setIsCloudSynced(true);
      showToast('Dados sincronizados com sucesso no Firebase!');
    } catch {
      showToast('Erro ao sincronizar dados com o banco na nuvem.', 'error');
    }
  };

  const importFullChurchBackup = async (jsonText: string) => {
    if (!isChurchAdmin) {
      showToast('Apenas Administradores podem importar backups completos.', 'error');
      return;
    }
    try {
      const parsed = JSON.parse(jsonText);
      const nextInfo: ChurchInfo = parsed.churchInfo || churchInfo;
      const nextBulletins: Bulletin[] = Array.isArray(parsed.bulletins)
        ? parsed.bulletins
        : bulletins;
      const nextBirthdays: BirthdayPerson[] = Array.isArray(parsed.birthdays)
        ? parsed.birthdays
        : birthdays;
      const nextDeacons: DeaconScheduleItem[] = Array.isArray(parsed.deaconSchedules)
        ? parsed.deaconSchedules
        : deaconSchedules;
      const nextBanners: Banner[] = Array.isArray(parsed.banners) ? parsed.banners : banners;
      const nextSettings: AppSettings = parsed.settings
        ? { ...settings, ...parsed.settings }
        : settings;

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

      if (isManagerAuthenticated && activeChurch) {
        await CloudChurchService.seedAllChurchDataToCloud(activeChurch.id, {
          churchInfo: nextInfo,
          bulletins: nextBulletins,
          birthdays: nextBirthdays,
          deaconSchedules: nextDeacons,
          banners: nextBanners,
          settings: nextSettings
        });
        showToast('Backup importado e gravado com sucesso no Firebase!');
      } else {
        showToast('Backup importado localmente!');
      }
    } catch {
      showToast('Arquivo de backup inválido. Selecione um JSON válido.', 'error');
    }
  };

  // Cloud Authentication Actions
  const loginWithGoogleCloud = async (churchNameIfFirst?: string) => {
    const { user, manager } = await CloudChurchService.authenticateWithGoogle(churchNameIfFirst);
    setPlatformUser(user);
    setCurrentManagerAccount(manager);

    if (user.churchSlug) {
      await selectChurchBySlug(user.churchSlug, 'manager');
      showToast(`Bem-vindo(a), ${user.name}! Painel de Gestão liberado.`);
    } else {
      setCurrentViewState('manager');
      showToast('Conta conectada! Preencha os dados abaixo para cadastrar sua igreja.');
    }
  };

  const registerManagerWithEmailCloud = async (
    name: string,
    email: string,
    pass: string,
    churchNameIfFirst?: string
  ) => {
    const { user, manager } = await CloudChurchService.registerWithEmail(
      name,
      email,
      pass,
      churchNameIfFirst
    );
    setPlatformUser(user);
    setCurrentManagerAccount(manager);
    setEmailVerifiedFlag(Boolean(auth.currentUser?.emailVerified));
    setCurrentViewState('manager');
    showToast(
      'Conta criada! Enviamos um link de confirmação para o seu e-mail. Confirme seu e-mail para liberar o acesso.',
      'info'
    );
  };

  const loginManagerWithEmailCloud = async (email: string, pass: string) => {
    const { user, manager } = await CloudChurchService.loginWithEmail(email, pass);
    setPlatformUser(user);
    setCurrentManagerAccount(manager);
    const verified = Boolean(auth.currentUser?.emailVerified);
    setEmailVerifiedFlag(verified);

    if (!verified) {
      setCurrentViewState('manager');
      showToast('Confirme seu e-mail para liberar o acesso ao painel.', 'info');
      return;
    }

    if (user.churchSlug) {
      await selectChurchBySlug(user.churchSlug, 'manager');
      showToast(`Bem-vindo(a) ao Painel de Gestão, ${user.name}!`);
    } else {
      setCurrentViewState('manager');
      showToast(`Bem-vindo(a), ${user.name}! Cadastre sua igreja para começar.`);
    }
  };

  const resendEmailVerification = async () => {
    try {
      await CloudChurchService.resendVerificationEmail();
      showToast('Novo e-mail de verificação enviado! Verifique sua caixa de entrada e spam.');
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : 'Aguarde alguns instantes antes de reenviar o e-mail.',
        'error'
      );
    }
  };

  const checkEmailVerificationNow = async (): Promise<boolean> => {
    try {
      const { verified, platformUser: refreshedUser } =
        await CloudChurchService.reloadAndCheckEmailVerified();
      setEmailVerifiedFlag(verified);
      if (auth.currentUser) {
        setFirebaseUser(auth.currentUser);
      }
      if (verified && refreshedUser) {
        setPlatformUser(refreshedUser);
        if (auth.currentUser?.email) {
          CloudChurchService.subscribeToManagedChurches(
            auth.currentUser.uid,
            auth.currentUser.email,
            (chList) => {
              setManagedChurchesState(chList);
            }
          );
        }
        if (refreshedUser.churchSlug) {
          await selectChurchBySlug(refreshedUser.churchSlug, 'manager');
        }
        showToast('E-mail confirmado com sucesso! Acesso liberado.');
        return true;
      } else {
        showToast(
          'Seu e-mail ainda consta como não verificado. Clique no link enviado para sua caixa de entrada.',
          'info'
        );
        return false;
      }
    } catch {
      showToast('Não foi possível verificar o status do e-mail agora.', 'error');
      return false;
    }
  };

  const approveOrRevokeManager = async (targetUid: string, status: ManagerApprovalStatus) => {
    if (!isPrimaryOwner) {
      showToast('Sem permissão para alterar gestores.', 'error');
      return;
    }
    await CloudChurchService.updateManagerApprovalStatus(targetUid, status);
    showToast(status === 'approved' ? 'Gestor aprovado!' : 'Acesso revogado.');
  };

  const removePendingManager = async (targetUid: string) => {
    if (!isPrimaryOwner) return;
    await CloudChurchService.removeManagerAccount(targetUid);
    showToast('Registro de gestor removido.');
  };

  // Church Info Handlers (Administrador only)
  const updateChurchInfo = (info: ChurchInfo) => {
    if (!isChurchAdmin) {
      showToast('Apenas Administradores podem alterar os dados da igreja.', 'error');
      return;
    }
    setChurchInfoState(info);
    ChurchStorageService.saveChurchInfo(info);
    if (activeChurch) {
      ChurchStorageService.saveCachedChurchBrand({
        id: activeChurch.id,
        slug: activeChurch.slug,
        name: info.name || activeChurch.name,
        logoUrl: info.logoUrl || activeChurch.logoUrl,
        themeColor: activeChurch.themeColor,
        city: activeChurch.city,
        state: activeChurch.state,
        tagline: info.tagline
      });
    }
    if (activeChurch && isManagerAuthenticated) {
      void CloudChurchService.saveChurchTenantInfo(activeChurch.id, info);
    }
    showToast('Informações da igreja salvas e sincronizadas!');
  };

  // Requirement 10 & Draft/Published filter: "Último boletim" uses current date, ignores past items, and ignores drafts
  const todayIso = new Date().toISOString().split('T')[0];
  const nonExpiredBulletins = bulletins.filter(
    (b) => b.status !== 'draft' && b.editionDate >= todayIso
  );
  const currentBulletin =
    nonExpiredBulletins.find((b) => b.isCurrent) || nonExpiredBulletins[0];

  // Bulletins Handlers (with Audit Trail & Draft/Published Status)
  const addBulletin = (b: Omit<Bulletin, 'id' | 'createdAt'>) => {
    const actor = getAuditActor();
    const status = b.status || 'published';
    const newBulletin: Bulletin = {
      ...b,
      status,
      isCurrent: status === 'draft' ? false : Boolean(b.isCurrent),
      id: `bol-${Date.now()}`,
      createdAt: actor.nowIso,
      createdByName: actor.name,
      createdByEmail: actor.email,
      updatedByName: actor.name,
      updatedByEmail: actor.email,
      updatedAt: actor.nowIso
    };

    let updatedList = [...bulletins];
    if (newBulletin.isCurrent) {
      updatedList = updatedList.map((item) => ({ ...item, isCurrent: false }));
    }
    updatedList = [newBulletin, ...updatedList];

    setBulletinsState(updatedList);
    ChurchStorageService.saveBulletins(updatedList);
    if (activeChurch && isManagerAuthenticated) {
      if (newBulletin.isCurrent) {
        void CloudChurchService.replaceSubcollectionItems(activeChurch.id, 'boletins', updatedList);
      } else {
        void CloudChurchService.saveSubcollectionItem(activeChurch.id, 'boletins', newBulletin);
      }
    }
    showToast(
      status === 'draft'
        ? 'Rascunho do boletim salvo!'
        : 'Boletim publicado e salvo no banco de dados!'
    );
  };

  const updateBulletin = (id: string, b: Partial<Bulletin>) => {
    const actor = getAuditActor();
    const updatedList = bulletins.map((item) => {
      if (item.id === id) {
        const nextStatus = b.status || item.status || 'published';
        return {
          ...item,
          ...b,
          status: nextStatus,
          isCurrent: nextStatus === 'draft' ? false : Boolean(b.isCurrent ?? item.isCurrent),
          updatedByName: actor.name,
          updatedByEmail: actor.email,
          updatedAt: actor.nowIso
        };
      }
      if (b.isCurrent && b.status !== 'draft') {
        return { ...item, isCurrent: false };
      }
      return item;
    });

    setBulletinsState(updatedList);
    ChurchStorageService.saveBulletins(updatedList);
    if (activeChurch && isManagerAuthenticated) {
      void CloudChurchService.replaceSubcollectionItems(activeChurch.id, 'boletins', updatedList);
    }
    showToast(
      b.status === 'draft' ? 'Boletim salvo como rascunho!' : 'Boletim atualizado e publicado!'
    );
  };

  const deleteBulletin = (id: string) => {
    const updatedList = bulletins.filter((item) => item.id !== id);
    setBulletinsState(updatedList);
    ChurchStorageService.saveBulletins(updatedList);
    if (activeChurch && isManagerAuthenticated) {
      void CloudChurchService.deleteSubcollectionItem(activeChurch.id, 'boletins', id);
    }
    showToast('Boletim excluído!');
  };

  const setCurrentBulletin = (id: string) => {
    const actor = getAuditActor();
    const updatedList = bulletins.map((item) => ({
      ...item,
      isCurrent: item.id === id,
      ...(item.id === id
        ? {
            status: 'published' as const,
            updatedByName: actor.name,
            updatedByEmail: actor.email,
            updatedAt: actor.nowIso
          }
        : {})
    }));
    setBulletinsState(updatedList);
    ChurchStorageService.saveBulletins(updatedList);
    if (activeChurch && isManagerAuthenticated) {
      void CloudChurchService.replaceSubcollectionItems(activeChurch.id, 'boletins', updatedList);
    }
    showToast('Boletim definido como atual!');
  };

  // Birthdays Handlers (with Audit Trail)
  const addBirthday = (person: Omit<BirthdayPerson, 'id'>) => {
    const actor = getAuditActor();
    const newPerson: BirthdayPerson = {
      ...person,
      id: `bday-${Date.now()}`,
      createdByName: actor.name,
      createdByEmail: actor.email,
      updatedByName: actor.name,
      updatedByEmail: actor.email,
      updatedAt: actor.nowIso
    };
    const updatedList = [...birthdays, newPerson];
    setBirthdaysState(updatedList);
    ChurchStorageService.saveBirthdays(updatedList);
    if (activeChurch && isManagerAuthenticated) {
      void CloudChurchService.saveSubcollectionItem(activeChurch.id, 'aniversariantes', newPerson);
    }
    showToast('Aniversariante cadastrado no banco de dados!');
  };

  const updateBirthday = (id: string, person: Partial<BirthdayPerson>) => {
    const actor = getAuditActor();
    let targetItem: BirthdayPerson | undefined;
    const updatedList = birthdays.map((item) => {
      if (item.id === id) {
        targetItem = {
          ...item,
          ...person,
          updatedByName: actor.name,
          updatedByEmail: actor.email,
          updatedAt: actor.nowIso
        };
        return targetItem;
      }
      return item;
    });
    setBirthdaysState(updatedList);
    ChurchStorageService.saveBirthdays(updatedList);
    if (activeChurch && isManagerAuthenticated && targetItem) {
      void CloudChurchService.saveSubcollectionItem(activeChurch.id, 'aniversariantes', targetItem);
    }
    showToast('Aniversariante atualizado!');
  };

  const deleteBirthday = (id: string) => {
    const updatedList = birthdays.filter((item) => item.id !== id);
    setBirthdaysState(updatedList);
    ChurchStorageService.saveBirthdays(updatedList);
    if (activeChurch && isManagerAuthenticated) {
      void CloudChurchService.deleteSubcollectionItem(activeChurch.id, 'aniversariantes', id);
    }
    showToast('Aniversariante removido!');
  };

  const importBirthdaysCSV = (csvText: string): number => {
    const actor = getAuditActor();
    const parsed = ChurchStorageService.parseBirthdayCSV(csvText).map((p) => ({
      ...p,
      createdByName: actor.name,
      createdByEmail: actor.email,
      updatedByName: actor.name,
      updatedByEmail: actor.email,
      updatedAt: actor.nowIso
    }));
    if (parsed.length === 0) {
      showToast('Nenhum registro válido encontrado no CSV.', 'error');
      return 0;
    }
    const merged = [...birthdays, ...parsed];
    setBirthdaysState(merged);
    ChurchStorageService.saveBirthdays(merged);
    if (activeChurch && isManagerAuthenticated) {
      void CloudChurchService.replaceSubcollectionItems(
        activeChurch.id,
        'aniversariantes',
        merged
      );
    }
    showToast(`${parsed.length} aniversariantes importados e sincronizados!`);
    return parsed.length;
  };

  // Deacon Schedules Handlers (with Audit Trail & Draft/Published Status)
  const addDeaconSchedule = (item: Omit<DeaconScheduleItem, 'id'>) => {
    const actor = getAuditActor();
    const status = item.status || 'published';
    const newItem: DeaconScheduleItem = {
      ...item,
      status,
      id: `deac-${Date.now()}`,
      createdByName: actor.name,
      createdByEmail: actor.email,
      updatedByName: actor.name,
      updatedByEmail: actor.email,
      updatedAt: actor.nowIso
    };
    const updatedList = [...deaconSchedules, newItem];
    setDeaconSchedulesState(updatedList);
    ChurchStorageService.saveDeaconSchedules(updatedList);
    if (activeChurch && isManagerAuthenticated) {
      void CloudChurchService.saveSubcollectionItem(activeChurch.id, 'escalas', newItem);
    }
    showToast(
      status === 'draft'
        ? 'Rascunho da escala salvo!'
        : 'Escala diaconal publicada no banco de dados!'
    );
  };

  const updateDeaconSchedule = (id: string, item: Partial<DeaconScheduleItem>) => {
    const actor = getAuditActor();
    let updatedTarget: DeaconScheduleItem | undefined;
    const updatedList = deaconSchedules.map((s) => {
      if (s.id === id) {
        updatedTarget = {
          ...s,
          ...item,
          status: item.status || s.status || 'published',
          updatedByName: actor.name,
          updatedByEmail: actor.email,
          updatedAt: actor.nowIso
        };
        return updatedTarget;
      }
      return s;
    });
    setDeaconSchedulesState(updatedList);
    ChurchStorageService.saveDeaconSchedules(updatedList);
    if (activeChurch && isManagerAuthenticated && updatedTarget) {
      void CloudChurchService.saveSubcollectionItem(activeChurch.id, 'escalas', updatedTarget);
    }
    showToast(
      item.status === 'draft' ? 'Escala salva como rascunho!' : 'Escala diaconal atualizada!'
    );
  };

  const deleteDeaconSchedule = (id: string) => {
    const updatedList = deaconSchedules.filter((s) => s.id !== id);
    setDeaconSchedulesState(updatedList);
    ChurchStorageService.saveDeaconSchedules(updatedList);
    if (activeChurch && isManagerAuthenticated) {
      void CloudChurchService.deleteSubcollectionItem(activeChurch.id, 'escalas', id);
    }
    showToast('Escala diaconal excluída!');
  };

  // Banners Handlers (with Audit Trail & Draft/Published Status)
  const getBannersByPosition = (pos: BannerPosition): Banner[] => {
    const now = new Date().toISOString().split('T')[0];
    return banners
      .filter((b) => {
        if (!b.isActive) return false;
        if (b.status === 'draft') return false;
        if (b.position !== pos) return false;
        if (b.startDate && b.startDate > now) return false;
        if (b.endDate && b.endDate < now) return false;
        return true;
      })
      .sort((a, b) => a.order - b.order);
  };

  const addBanner = (banner: Omit<Banner, 'id'>) => {
    const actor = getAuditActor();
    const status = banner.status || 'published';
    const newBanner: Banner = {
      ...banner,
      status,
      isActive: status === 'draft' ? false : banner.isActive,
      id: `ban-${Date.now()}`,
      createdByName: actor.name,
      createdByEmail: actor.email,
      updatedByName: actor.name,
      updatedByEmail: actor.email,
      updatedAt: actor.nowIso
    };
    const updatedList = [...banners, newBanner];
    setBannersState(updatedList);
    ChurchStorageService.saveBanners(updatedList);
    if (activeChurch && isManagerAuthenticated) {
      void CloudChurchService.saveSubcollectionItem(activeChurch.id, 'banners', newBanner);
    }
    showToast(
      status === 'draft' ? 'Banner salvo como rascunho!' : 'Banner publicado e sincronizado!'
    );
  };

  const updateBanner = (id: string, banner: Partial<Banner>) => {
    const actor = getAuditActor();
    let targetBanner: Banner | undefined;
    const updatedList = banners.map((b) => {
      if (b.id === id) {
        const nextStatus = banner.status || b.status || 'published';
        targetBanner = {
          ...b,
          ...banner,
          status: nextStatus,
          isActive: nextStatus === 'draft' ? false : Boolean(banner.isActive ?? b.isActive),
          updatedByName: actor.name,
          updatedByEmail: actor.email,
          updatedAt: actor.nowIso
        };
        return targetBanner;
      }
      return b;
    });
    setBannersState(updatedList);
    ChurchStorageService.saveBanners(updatedList);
    if (activeChurch && isManagerAuthenticated && targetBanner) {
      void CloudChurchService.saveSubcollectionItem(activeChurch.id, 'banners', targetBanner);
    }
    showToast(banner.status === 'draft' ? 'Banner salvo como rascunho!' : 'Banner atualizado!');
  };

  const deleteBanner = (id: string) => {
    const updatedList = banners.filter((b) => b.id !== id);
    setBannersState(updatedList);
    ChurchStorageService.saveBanners(updatedList);
    if (activeChurch && isManagerAuthenticated) {
      void CloudChurchService.deleteSubcollectionItem(activeChurch.id, 'banners', id);
    }
    showToast('Banner removido!');
  };

  const toggleBannerActive = (id: string) => {
    const actor = getAuditActor();
    let targetBanner: Banner | undefined;
    const updatedList = banners.map((b) => {
      if (b.id === id) {
        targetBanner = {
          ...b,
          isActive: !b.isActive,
          updatedByName: actor.name,
          updatedByEmail: actor.email,
          updatedAt: actor.nowIso
        };
        return targetBanner;
      }
      return b;
    });
    setBannersState(updatedList);
    ChurchStorageService.saveBanners(updatedList);
    if (activeChurch && isManagerAuthenticated && targetBanner) {
      void CloudChurchService.saveSubcollectionItem(activeChurch.id, 'banners', targetBanner);
    }
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

  const managerLogin = (): boolean => {
    showToast('Autentique-se com sua conta no Firebase.', 'info');
    return false;
  };

  const managerLogout = () => {
    setIsCreatingAdditionalChurch(false);
    void CloudChurchService.logout();
    if (activeChurch) {
      setCurrentView('home');
    } else {
      setCurrentView('directory');
    }
    showToast('Você saiu do Portal do Gestor.', 'info');
  };

  // Bible Personal Notes (local to member's device)
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
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(backupPayload, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', jsonStr);
    a.setAttribute(
      'download',
      `minhas_anotacoes_biblia_${new Date().toISOString().split('T')[0]}.json`
    );
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
      const importedFavs: UserFavoriteVerse[] = Array.isArray(parsed.favorites)
        ? parsed.favorites
        : [];

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
        const mergedFavs = [
          ...favorites,
          ...importedFavs.filter((f) => !existingFavIds.has(f.id))
        ];
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
      (f) =>
        f.bookAbbrev === verse.bookAbbrev &&
        f.chapter === verse.chapter &&
        f.verse === verse.verse
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
      (f) =>
        f.bookAbbrev.toLowerCase() === bookAbbrev.toLowerCase() &&
        f.chapter === chapter &&
        f.verse === verse
    );
  };

  return (
    <ChurchContext.Provider
      value={{
        currentView,
        setCurrentView,
        isChurchLoading,
        activeChurch,
        activeChurches,
        managedChurches,
        allChurchesForOwner,
        allPlatformUsers,
        platformSettings,
        updatePlatformSettings,
        selectChurchBySlug,
        switchChurch,
        openManagerPortalFromDirectory,
        needsChurchOnboarding,
        isCreatingAdditionalChurch,
        setIsCreatingAdditionalChurch,
        currentUserTeamRole,
        isChurchAdmin,
        createNewChurchInCloud,
        updateChurchSlugAndMeta,
        inviteTeamMemberByEmail,
        updateTeamMemberRoleByEmail,
        inviteCoManagerByEmail,
        removeCoManagerEmail,
        isPlatformOwner,
        setChurchStatusByOwner,
        deleteChurchByOwner,
        wipeAllPlatformDataByOwner,
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
        isEmailVerified,
        firebaseUser,
        platformUser,
        currentManagerAccount,
        churchRegistry,
        allManagers,
        isPrimaryOwner,
        isCloudSynced,
        loginWithGoogleCloud,
        registerManagerWithEmailCloud,
        loginManagerWithEmailCloud,
        resendEmailVerification,
        checkEmailVerificationNow,
        approveOrRevokeManager,
        removePendingManager,
        syncLocalDataToCloud,
        pullLatestFromCloud,
        resetAllChurchContentToBlank,
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
