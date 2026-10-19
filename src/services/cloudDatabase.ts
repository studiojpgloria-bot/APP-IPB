import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  User
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../config/firebase';
import {
  AppSettings,
  Banner,
  BirthdayPerson,
  Bulletin,
  ChurchInfo,
  ChurchManagerAccount,
  ChurchRegistry,
  DeaconScheduleItem,
  ManagerApprovalStatus
} from '../types';

export type CloudModuleType = 'info' | 'bulletins' | 'birthdays' | 'deacons' | 'banners' | 'settings';

export class CloudChurchService {
  /**
   * Checks if the church already has a Primary First Manager registered in `church_config/registry`.
   */
  public static async getChurchRegistry(): Promise<ChurchRegistry | null> {
    const path = 'church_config/registry';
    try {
      const snap = await getDoc(doc(db, 'church_config', 'registry'));
      if (!snap.exists()) return null;
      return snap.data() as ChurchRegistry;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  }

  /**
   * Subscribes to the singleton church registry document.
   */
  public static subscribeToRegistry(onUpdate: (registry: ChurchRegistry | null) => void): () => void {
    const path = 'church_config/registry';
    return onSnapshot(
      doc(db, 'church_config', 'registry'),
      (snap) => {
        if (snap.exists()) {
          onUpdate(snap.data() as ChurchRegistry);
        } else {
          onUpdate(null);
        }
      },
      (error) => {
        console.warn('Registry listener warning:', error);
      }
    );
  }

  /**
   * Registers or logs in via Google Popup and provisions the manager account:
   * - If no church_config/registry exists yet -> User becomes the Primary Owner (1º Gestor) and is immediately APPROVED.
   * - If church_config/registry already exists -> User is registered with status 'pending' until the 1º Gestor approves them.
   */
  public static async authenticateWithGoogle(churchNameIfFirst?: string): Promise<{
    user: User;
    manager: ChurchManagerAccount;
    isFirstOwner: boolean;
  }> {
    const cred = await signInWithPopup(auth, googleProvider);
    const result = await CloudChurchService.ensureManagerAccount(
      cred.user,
      cred.user.displayName || cred.user.email?.split('@')[0] || 'Gestor',
      churchNameIfFirst
    );
    return { user: cred.user, ...result };
  }

  /**
   * Registers a new manager account with Email & Password:
   * - If no church_config/registry exists yet -> User becomes the Primary Owner (1º Gestor) and is immediately APPROVED.
   * - If church_config/registry already exists -> User is created as 'co_manager' with status 'pending' (awaiting 1º Gestor approval).
   */
  public static async registerWithEmail(
    name: string,
    email: string,
    password: string,
    churchNameIfFirst?: string
  ): Promise<{
    user: User;
    manager: ChurchManagerAccount;
    isFirstOwner: boolean;
  }> {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (name.trim()) {
      await updateProfile(cred.user, { displayName: name.trim() });
    }
    const result = await CloudChurchService.ensureManagerAccount(
      cred.user,
      name.trim() || email.split('@')[0],
      churchNameIfFirst
    );
    return { user: cred.user, ...result };
  }

  /**
   * Signs in an existing manager with Email & Password.
   */
  public static async loginWithEmail(
    email: string,
    password: string
  ): Promise<{
    user: User;
    manager: ChurchManagerAccount;
    isFirstOwner: boolean;
  }> {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    const result = await CloudChurchService.ensureManagerAccount(
      cred.user,
      cred.user.displayName || email.split('@')[0]
    );
    return { user: cred.user, ...result };
  }

  /**
   * Ensures the authenticated Firebase User has a record in `church_managers/{uid}`.
   * Enforces the anti-duplication rule:
   * - 1st person claims `church_config/registry` and gets `role: 'owner'`, `status: 'approved'`
   * - 2nd+ person gets `role: 'co_manager'`, `status: 'pending'` until approved by the 1st manager.
   */
  public static async ensureManagerAccount(
    user: User,
    fallbackName: string,
    churchNameIfFirst = 'Igreja Presbiteriana Central'
  ): Promise<{ manager: ChurchManagerAccount; isFirstOwner: boolean }> {
    const uid = user.uid;
    const email = (user.email || 'gestor@igreja.com.br').slice(0, 200);
    const cleanName = (user.displayName || fallbackName || 'Gestor').slice(0, 150);

    // 1. Check if manager profile already exists
    const managerRef = doc(db, 'church_managers', uid);
    const existingSnap = await getDoc(managerRef);
    const registry = await CloudChurchService.getChurchRegistry();

    if (existingSnap.exists()) {
      const data = existingSnap.data() as ChurchManagerAccount;
      return {
        manager: data,
        isFirstOwner: data.role === 'owner' || registry?.ownerUid === uid
      };
    }

    // 2. If no registry exists yet, this user is the First Manager (Primary Owner) of the church!
    if (!registry) {
      const batch = writeBatch(db);
      const registryRef = doc(db, 'church_config', 'registry');

      batch.set(registryRef, {
        ownerUid: uid,
        ownerEmail: email,
        ownerName: cleanName,
        churchName: (churchNameIfFirst || 'Igreja Presbiteriana Central').slice(0, 200),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      batch.set(managerRef, {
        uid,
        email,
        name: cleanName,
        role: 'owner',
        status: 'approved',
        requestedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      try {
        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'church_config/registry');
      }

      return {
        manager: {
          uid,
          email,
          name: cleanName,
          role: 'owner',
          status: 'approved'
        },
        isFirstOwner: true
      };
    }

    // 3. Registry already exists! Another manager already registered this church.
    // Create this user as 'co_manager' with status 'pending' so the First Manager must approve them.
    const isOwner = registry.ownerUid === uid;
    const newManager: ChurchManagerAccount = {
      uid,
      email,
      name: cleanName,
      role: isOwner ? 'owner' : 'co_manager',
      status: isOwner ? 'approved' : 'pending'
    };

    try {
      await setDoc(managerRef, {
        ...newManager,
        requestedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `church_managers/${uid}`);
    }

    return {
      manager: newManager,
      isFirstOwner: isOwner
    };
  }

  /**
   * Primary Manager approves or revokes another manager's access.
   */
  public static async updateManagerApprovalStatus(
    targetUid: string,
    newStatus: ManagerApprovalStatus
  ): Promise<void> {
    const path = `church_managers/${targetUid}`;
    try {
      await updateDoc(doc(db, 'church_managers', targetUid), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  /**
   * Primary Manager removes a pending or revoked co-manager request.
   */
  public static async removeManagerAccount(targetUid: string): Promise<void> {
    const path = `church_managers/${targetUid}`;
    try {
      await deleteDoc(doc(db, 'church_managers', targetUid));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  /**
   * Subscribes to all manager accounts (only called when authenticated as an approved manager).
   */
  public static subscribeToManagersList(
    onUpdate: (managers: ChurchManagerAccount[]) => void
  ): () => void {
    const path = 'church_managers';
    return onSnapshot(
      collection(db, 'church_managers'),
      (snap) => {
        const list: ChurchManagerAccount[] = [];
        snap.forEach((d) => {
          list.push(d.data() as ChurchManagerAccount);
        });
        onUpdate(list);
      },
      (error) => {
        console.warn('Managers list subscription error:', error);
      }
    );
  }

  /**
   * Saves a church module to Firestore (`church_data/{moduleId}`).
   */
  public static async saveModuleToCloud(
    moduleId: CloudModuleType,
    data: unknown
  ): Promise<void> {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const path = `church_data/${moduleId}`;
    const docRef = doc(db, 'church_data', moduleId);

    // Strip any undefined fields recursively so Firestore accepts the map cleanly
    const sanitizedData = JSON.parse(JSON.stringify(data));

    try {
      await setDoc(docRef, {
        docType: moduleId,
        payload: { items: sanitizedData },
        updatedByUid: currentUser.uid,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  /**
   * Uploads all initial local church data to Firestore when the First Manager registers.
   */
  public static async seedAllChurchDataToCloud(params: {
    churchInfo: ChurchInfo;
    bulletins: Bulletin[];
    birthdays: BirthdayPerson[];
    deaconSchedules: DeaconScheduleItem[];
    banners: Banner[];
    settings: AppSettings;
  }): Promise<void> {
    if (!auth.currentUser) return;
    await Promise.all([
      CloudChurchService.saveModuleToCloud('info', params.churchInfo),
      CloudChurchService.saveModuleToCloud('bulletins', params.bulletins),
      CloudChurchService.saveModuleToCloud('birthdays', params.birthdays),
      CloudChurchService.saveModuleToCloud('deacons', params.deaconSchedules),
      CloudChurchService.saveModuleToCloud('banners', params.banners),
      CloudChurchService.saveModuleToCloud('settings', params.settings)
    ]);
  }

  /**
   * Subscribes in real-time to all public church modules (`church_data`).
   * Works for all visitors without requiring login!
   */
  public static subscribeToPublicChurchData(callbacks: {
    onChurchInfo: (info: ChurchInfo) => void;
    onBulletins: (bulletins: Bulletin[]) => void;
    onBirthdays: (birthdays: BirthdayPerson[]) => void;
    onDeaconSchedules: (schedules: DeaconScheduleItem[]) => void;
    onBanners: (banners: Banner[]) => void;
    onSettings: (settings: AppSettings) => void;
  }): () => void {
    const path = 'church_data';
    return onSnapshot(
      collection(db, 'church_data'),
      (snap) => {
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          const items = data?.payload?.items;
          if (!items) return;

          switch (docSnap.id as CloudModuleType) {
            case 'info':
              callbacks.onChurchInfo(items as ChurchInfo);
              break;
            case 'bulletins':
              if (Array.isArray(items)) callbacks.onBulletins(items as Bulletin[]);
              break;
            case 'birthdays':
              if (Array.isArray(items)) callbacks.onBirthdays(items as BirthdayPerson[]);
              break;
            case 'deacons':
              if (Array.isArray(items)) callbacks.onDeaconSchedules(items as DeaconScheduleItem[]);
              break;
            case 'banners':
              if (Array.isArray(items)) callbacks.onBanners(items as Banner[]);
              break;
            case 'settings':
              callbacks.onSettings(items as AppSettings);
              break;
          }
        });
      },
      (error) => {
        console.warn('Public church data listener notice:', error);
      }
    );
  }

  /**
   * Explicitly fetches all 6 public church modules directly from Firestore server/cache.
   */
  public static async fetchAllPublicChurchDataFromCloud(callbacks: {
    onChurchInfo: (info: ChurchInfo) => void;
    onBulletins: (bulletins: Bulletin[]) => void;
    onBirthdays: (birthdays: BirthdayPerson[]) => void;
    onDeaconSchedules: (schedules: DeaconScheduleItem[]) => void;
    onBanners: (banners: Banner[]) => void;
    onSettings: (settings: AppSettings) => void;
  }): Promise<number> {
    const modules: CloudModuleType[] = ['info', 'bulletins', 'birthdays', 'deacons', 'banners', 'settings'];
    let loadedCount = 0;

    await Promise.all(
      modules.map(async (mod) => {
        try {
          const snap = await getDoc(doc(db, 'church_data', mod));
          if (!snap.exists()) return;
          const items = snap.data()?.payload?.items;
          if (!items) return;
          loadedCount++;
          switch (mod) {
            case 'info':
              callbacks.onChurchInfo(items as ChurchInfo);
              break;
            case 'bulletins':
              if (Array.isArray(items)) callbacks.onBulletins(items as Bulletin[]);
              break;
            case 'birthdays':
              if (Array.isArray(items)) callbacks.onBirthdays(items as BirthdayPerson[]);
              break;
            case 'deacons':
              if (Array.isArray(items)) callbacks.onDeaconSchedules(items as DeaconScheduleItem[]);
              break;
            case 'banners':
              if (Array.isArray(items)) callbacks.onBanners(items as Banner[]);
              break;
            case 'settings':
              callbacks.onSettings(items as AppSettings);
              break;
          }
        } catch (err) {
          console.warn(`Error fetching module ${mod}:`, err);
        }
      })
    );

    return loadedCount;
  }

  public static async logout(): Promise<void> {
    await signOut(auth);
  }
}
