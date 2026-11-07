import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  reload,
  sendEmailVerification,
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
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import {
  AppSettings,
  Banner,
  BirthdayPerson,
  Bulletin,
  ChurchInfo,
  ChurchManagerAccount,
  ChurchStatus,
  ChurchTeamMember,
  ChurchTenant,
  DeaconScheduleItem,
  LeaderMember,
  ManagerApprovalStatus,
  PlatformSettings,
  PlatformUser,
  ScheduleItem,
  TeamRole
} from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write'
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): void {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous
    },
    operationType,
    path
  };
  console.error('Firestore Operation Error:', JSON.stringify(errInfo));
}

export const PLATFORM_OWNER_EMAIL = 'studiojpgloria@gmail.com';

export function isPlatformOwnerEmail(
  email?: string | null,
  emailVerified = false
): boolean {
  if (!email || !emailVerified) return false;
  return email.toLowerCase().trim() === PLATFORM_OWNER_EMAIL;
}

export function slugifyChurchName(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

export function extractCityAndState(cityStateZip: string): { city: string; state: string } {
  if (!cityStateZip) return { city: '', state: '' };
  const cleaned = cityStateZip.split('•')[0].split('CEP')[0].trim();
  const dashParts = cleaned.split(/[-/]/).map((s) => s.trim()).filter(Boolean);
  if (dashParts.length >= 2) {
    const last = dashParts[dashParts.length - 1].toUpperCase().slice(0, 2);
    const city = dashParts.slice(0, -1).join(' - ');
    return { city, state: last };
  }
  return { city: cleaned, state: '' };
}

/**
 * Helper to normalize team arrays on a ChurchTenant from its teamMembers list
 */
export function buildNormalizedTeamArrays(
  ownerUid: string,
  ownerEmail: string,
  ownerName: string | undefined,
  existingMembers?: ChurchTeamMember[],
  fallbackManagerEmails?: string[],
  fallbackManagerUids?: string[]
): {
  teamMembers: ChurchTeamMember[];
  adminEmails: string[];
  adminUids: string[];
  editorEmails: string[];
  editorUids: string[];
  managerEmails: string[];
  managerUids: string[];
} {
  const cleanOwnerEmail = (ownerEmail || '').toLowerCase().trim();
  const mapByEmail = new Map<string, ChurchTeamMember>();

  if (Array.isArray(existingMembers)) {
    for (const m of existingMembers) {
      if (!m?.email) continue;
      const em = m.email.toLowerCase().trim();
      mapByEmail.set(em, {
        ...m,
        email: em,
        role: m.role === 'editor' ? 'editor' : 'admin',
        status: m.status === 'active' || Boolean(m.uid) ? 'active' : 'pending'
      });
    }
  }

  // Ensure legacy managerEmails are represented if not in teamMembers yet
  if (Array.isArray(fallbackManagerEmails)) {
    for (const rawEm of fallbackManagerEmails) {
      const em = (rawEm || '').toLowerCase().trim();
      if (em && !mapByEmail.has(em)) {
        mapByEmail.set(em, {
          email: em,
          role: 'admin',
          status: em === cleanOwnerEmail ? 'active' : 'pending',
          invitedAt: new Date().toISOString()
        });
      }
    }
  }

  // Always guarantee owner is an active admin
  if (cleanOwnerEmail) {
    const prevOwner = mapByEmail.get(cleanOwnerEmail);
    mapByEmail.set(cleanOwnerEmail, {
      email: cleanOwnerEmail,
      name: prevOwner?.name || ownerName || cleanOwnerEmail.split('@')[0],
      uid: ownerUid || prevOwner?.uid,
      role: 'admin',
      status: 'active',
      invitedAt: prevOwner?.invitedAt || new Date().toISOString(),
      invitedBy: prevOwner?.invitedBy
    });
  }

  const teamMembers = Array.from(mapByEmail.values());
  const adminEmails = Array.from(
    new Set(teamMembers.filter((m) => m.role === 'admin').map((m) => m.email))
  );
  const editorEmails = Array.from(
    new Set(teamMembers.filter((m) => m.role === 'editor').map((m) => m.email))
  );
  const adminUids = Array.from(
    new Set(
      [
        ownerUid,
        ...teamMembers.filter((m) => m.role === 'admin' && m.uid).map((m) => m.uid!)
      ].filter(Boolean)
    )
  );
  const editorUids = Array.from(
    new Set(teamMembers.filter((m) => m.role === 'editor' && m.uid).map((m) => m.uid!))
  );
  const managerEmails = Array.from(new Set([...adminEmails, ...editorEmails]));
  const managerUids = Array.from(
    new Set([...adminUids, ...editorUids, ...(fallbackManagerUids || [])].filter(Boolean))
  );

  return {
    teamMembers,
    adminEmails,
    adminUids,
    editorEmails,
    editorUids,
    managerEmails,
    managerUids
  };
}

export class CloudChurchService {
  // ============================================================================
  // 1. CONFIGURAÇÃO GLOBAL DA PLATAFORMA (platform_config/main)
  // ============================================================================
  public static subscribeToPlatformSettings(
    onUpdate: (settings: PlatformSettings) => void
  ): () => void {
    const ref = doc(db, 'platform_config', 'main');
    return onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as PlatformSettings;
          onUpdate({
            appName: data.appName || 'Minha Igreja',
            tagline: data.tagline || 'Conectando você à sua comunidade de fé'
          });
        } else {
          onUpdate({
            appName: 'Minha Igreja',
            tagline: 'Conectando você à sua comunidade de fé'
          });
        }
      },
      () => {
        onUpdate({
          appName: 'Minha Igreja',
          tagline: 'Conectando você à sua comunidade de fé'
        });
      }
    );
  }

  public static async savePlatformSettings(settings: PlatformSettings): Promise<void> {
    const ref = doc(db, 'platform_config', 'main');
    try {
      await setDoc(
        ref,
        {
          appName: settings.appName.trim() || 'Minha Igreja',
          tagline: settings.tagline.trim() || 'Conectando você à sua comunidade de fé',
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'platform_config/main');
      throw e;
    }
  }

  // ============================================================================
  // 2. DIRETÓRIO PÚBLICO DE IGREJAS ATIVAS E BUSCA POR SLUG
  // ============================================================================
  public static subscribeToActiveChurches(
    onUpdate: (churches: ChurchTenant[]) => void
  ): () => void {
    const q = query(collection(db, 'churches'), where('status', '==', 'ativa'));
    return onSnapshot(
      q,
      (snap) => {
        const list: ChurchTenant[] = [];
        snap.forEach((docSnap) => {
          list.push({ ...(docSnap.data() as ChurchTenant), id: docSnap.id });
        });
        list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        onUpdate(list);
      },
      (err) => {
        console.warn('Active churches listener warning:', err);
        onUpdate([]);
      }
    );
  }

  public static subscribeToManagedChurches(
    userUid: string,
    userEmail: string,
    onUpdate: (churches: ChurchTenant[]) => void
  ): () => void {
    const cleanEmail = (userEmail || '').toLowerCase().trim();
    if (!cleanEmail && !userUid) {
      onUpdate([]);
      return () => {};
    }

    const q = query(collection(db, 'churches'), where('managerEmails', 'array-contains', cleanEmail));
    return onSnapshot(
      q,
      (snap) => {
        const list: ChurchTenant[] = [];
        snap.forEach((docSnap) => {
          list.push({ ...(docSnap.data() as ChurchTenant), id: docSnap.id });
        });
        list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        onUpdate(list);
      },
      (err) => {
        console.warn('Managed churches listener warning:', err);
      }
    );
  }

  public static async getChurchBySlug(slug: string): Promise<ChurchTenant | null> {
    const normalized = slug.trim().toLowerCase();
    if (!normalized || normalized === 'admin' || normalized === 'gestor') return null;
    try {
      const directSnap = await getDoc(doc(db, 'churches', normalized));
      if (directSnap.exists()) {
        return { ...(directSnap.data() as ChurchTenant), id: directSnap.id };
      }
      const q = query(collection(db, 'churches'), where('slug', '==', normalized));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const first = snap.docs[0];
        return { ...(first.data() as ChurchTenant), id: first.id };
      }
      return null;
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, `churches/${normalized}`);
      return null;
    }
  }

  public static async isSlugAvailable(slug: string, excludeChurchId?: string): Promise<boolean> {
    const normalized = slugifyChurchName(slug);
    if (!normalized || normalized === 'admin' || normalized === 'gestor') return false;
    try {
      const directSnap = await getDoc(doc(db, 'churches', normalized));
      if (directSnap.exists() && directSnap.id !== excludeChurchId) {
        return false;
      }
      const q = query(collection(db, 'churches'), where('slug', '==', normalized));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        if (d.id !== excludeChurchId) return false;
      }
      return true;
    } catch {
      return true;
    }
  }

  public static async generateUniqueSlug(baseName: string, city?: string): Promise<string> {
    let candidate = slugifyChurchName(city ? `${baseName}-${city}` : baseName);
    if (!candidate || candidate === 'admin' || candidate === 'gestor') {
      candidate = `igreja-${Date.now().toString(36)}`;
    }
    const available = await this.isSlugAvailable(candidate);
    if (available) return candidate;
    return `${candidate}-${Math.random().toString(36).substring(2, 6)}`;
  }

  // ============================================================================
  // 3. ASSINATURA EM TEMPO REAL DE UMA IGREJA E SUAS SUBCOLEÇÕES
  // ============================================================================
  public static subscribeToChurchAndSubcollections(
    churchId: string,
    handlers: {
      onTenant: (tenant: ChurchTenant | null) => void;
      onBulletins: (list: Bulletin[]) => void;
      onBirthdays: (list: BirthdayPerson[]) => void;
      onDeaconSchedules: (list: DeaconScheduleItem[]) => void;
      onBanners: (list: Banner[]) => void;
      onLeadership: (list: LeaderMember[]) => void;
      onSchedules: (list: ScheduleItem[]) => void;
    }
  ): () => void {
    const unsubs: (() => void)[] = [];

    // 1. Church main document
    unsubs.push(
      onSnapshot(
        doc(db, 'churches', churchId),
        (snap) => {
          if (snap.exists()) {
            const raw = snap.data() as ChurchTenant;
            const norm = buildNormalizedTeamArrays(
              raw.ownerUid,
              raw.ownerEmail,
              raw.ownerName,
              raw.teamMembers,
              raw.managerEmails,
              raw.managerUids
            );
            const data: ChurchTenant = {
              ...raw,
              ...norm,
              id: snap.id
            };
            handlers.onTenant(data);
          } else {
            handlers.onTenant(null);
          }
        },
        (err) => console.warn(`Church ${churchId} doc listener:`, err)
      )
    );

    // 2. boletins subcollection
    unsubs.push(
      onSnapshot(
        collection(db, 'churches', churchId, 'boletins'),
        (snap) => {
          const items: Bulletin[] = [];
          snap.forEach((d) => items.push({ ...(d.data() as Bulletin), id: d.id }));
          items.sort((a, b) => (b.editionDate || '').localeCompare(a.editionDate || ''));
          handlers.onBulletins(items);
        },
        (err) => console.warn('boletins listener:', err)
      )
    );

    // 3. escalas subcollection
    unsubs.push(
      onSnapshot(
        collection(db, 'churches', churchId, 'escalas'),
        (snap) => {
          const items: DeaconScheduleItem[] = [];
          snap.forEach((d) => items.push({ ...(d.data() as DeaconScheduleItem), id: d.id }));
          items.sort(
            (a, b) =>
              (a.date || '').localeCompare(b.date || '') ||
              (a.time || '').localeCompare(b.time || '')
          );
          handlers.onDeaconSchedules(items);
        },
        (err) => console.warn('escalas listener:', err)
      )
    );

    // 4. aniversariantes subcollection
    unsubs.push(
      onSnapshot(
        collection(db, 'churches', churchId, 'aniversariantes'),
        (snap) => {
          const items: BirthdayPerson[] = [];
          snap.forEach((d) => items.push({ ...(d.data() as BirthdayPerson), id: d.id }));
          items.sort((a, b) => a.birthMonth - b.birthMonth || a.birthDay - b.birthDay);
          handlers.onBirthdays(items);
        },
        (err) => console.warn('aniversariantes listener:', err)
      )
    );

    // 5. banners subcollection
    unsubs.push(
      onSnapshot(
        collection(db, 'churches', churchId, 'banners'),
        (snap) => {
          const items: Banner[] = [];
          snap.forEach((d) => items.push({ ...(d.data() as Banner), id: d.id }));
          items.sort((a, b) => (a.order || 0) - (b.order || 0));
          handlers.onBanners(items);
        },
        (err) => console.warn('banners listener:', err)
      )
    );

    // 6. lideranca subcollection
    unsubs.push(
      onSnapshot(
        collection(db, 'churches', churchId, 'lideranca'),
        (snap) => {
          const items: LeaderMember[] = [];
          snap.forEach((d) => items.push({ ...(d.data() as LeaderMember), id: d.id }));
          handlers.onLeadership(items);
        },
        (err) => console.warn('lideranca listener:', err)
      )
    );

    // 7. cultos subcollection
    unsubs.push(
      onSnapshot(
        collection(db, 'churches', churchId, 'cultos'),
        (snap) => {
          const items: ScheduleItem[] = [];
          snap.forEach((d) => items.push({ ...(d.data() as ScheduleItem), id: d.id }));
          handlers.onSchedules(items);
        },
        (err) => console.warn('cultos listener:', err)
      )
    );

    return () => {
      unsubs.forEach((u) => u());
    };
  }

  // ============================================================================
  // 4. OPERAÇÕES CRUD NA IGREJA E SUBCOLEÇÕES
  // ============================================================================
  public static async saveChurchTenantInfo(
    churchId: string,
    info: ChurchInfo,
    extra?: Partial<
      Pick<ChurchTenant, 'slug' | 'city' | 'state' | 'themeColor' | 'latitude' | 'longitude'>
    >
  ): Promise<void> {
    const ref = doc(db, 'churches', churchId);
    const parsedLoc = extractCityAndState(info.cityStateZip || '');
    const city = extra?.city !== undefined ? extra.city : parsedLoc.city;
    const state = extra?.state !== undefined ? extra.state : parsedLoc.state;

    try {
      const payload: Record<string, unknown> = {
        ...info,
        city,
        state,
        updatedAt: serverTimestamp()
      };
      if (extra?.slug) payload.slug = slugifyChurchName(extra.slug);
      if (extra?.themeColor) payload.themeColor = extra.themeColor;
      if (extra?.latitude !== undefined) payload.latitude = extra.latitude;
      if (extra?.longitude !== undefined) payload.longitude = extra.longitude;

      await setDoc(ref, payload, { merge: true });

      // Sync cultos & lideranca subcollections (requires Admin level)
      await this.replaceSubcollectionItems(churchId, 'cultos', info.schedules || []);
      await this.replaceSubcollectionItems(churchId, 'lideranca', info.leadership || []);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `churches/${churchId}`);
      throw e;
    }
  }

  public static async saveSubcollectionItem<T extends { id: string }>(
    churchId: string,
    subcollectionName:
      | 'boletins'
      | 'escalas'
      | 'aniversariantes'
      | 'banners'
      | 'lideranca'
      | 'cultos',
    item: T
  ): Promise<void> {
    const path = `churches/${churchId}/${subcollectionName}/${item.id}`;
    try {
      const cleanItem = JSON.parse(JSON.stringify(item));
      await setDoc(doc(db, 'churches', churchId, subcollectionName, item.id), cleanItem, {
        merge: true
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
      throw e;
    }
  }

  public static async deleteSubcollectionItem(
    churchId: string,
    subcollectionName:
      | 'boletins'
      | 'escalas'
      | 'aniversariantes'
      | 'banners'
      | 'lideranca'
      | 'cultos',
    itemId: string
  ): Promise<void> {
    const path = `churches/${churchId}/${subcollectionName}/${itemId}`;
    try {
      await deleteDoc(doc(db, 'churches', churchId, subcollectionName, itemId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
      throw e;
    }
  }

  public static async replaceSubcollectionItems<T extends { id: string }>(
    churchId: string,
    subcollectionName:
      | 'boletins'
      | 'escalas'
      | 'aniversariantes'
      | 'banners'
      | 'lideranca'
      | 'cultos',
    items: T[]
  ): Promise<void> {
    try {
      const colRef = collection(db, 'churches', churchId, subcollectionName);
      const existingSnap = await getDocs(colRef);
      const newIds = new Set(items.map((i) => i.id));
      const batch = writeBatch(db);

      existingSnap.forEach((docSnap) => {
        if (!newIds.has(docSnap.id)) {
          batch.delete(docSnap.ref);
        }
      });

      for (const item of items) {
        const cleanItem = JSON.parse(JSON.stringify(item));
        batch.set(doc(db, 'churches', churchId, subcollectionName, item.id), cleanItem);
      }

      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `churches/${churchId}/${subcollectionName}`);
      throw e;
    }
  }

  // ============================================================================
  // 5. AUTENTICAÇÃO, PERFIS DE USUÁRIO (users/{uid}) E EQUIPE MULTI-IGREJA
  // ============================================================================
  public static async resolveOrCreatePlatformUser(
    user: User,
    preferredName?: string
  ): Promise<PlatformUser> {
    const userRef = doc(db, 'users', user.uid);
    const emailLower = (user.email || '').toLowerCase().trim();
    const isVerified = Boolean(user.emailVerified);
    const isOwner = isPlatformOwnerEmail(emailLower, isVerified);
    const resolvedName =
      preferredName?.trim() || user.displayName || emailLower.split('@')[0] || 'Gestor';

    try {
      // Find any churches where this email is in managerEmails (invited or owner)
      // SECURITY: Team invites by email can ONLY be accepted if user.emailVerified === true
      const matchedChurchIds: string[] = [];
      let primaryChurchId: string | undefined;
      let primaryChurchSlug: string | undefined;

      if (emailLower && isVerified) {
        try {
          const qInvited = query(
            collection(db, 'churches'),
            where('managerEmails', 'array-contains', emailLower)
          );
          const invitedSnap = await getDocs(qInvited);
          for (const chDoc of invitedSnap.docs) {
            matchedChurchIds.push(chDoc.id);
            const chData = chDoc.data() as ChurchTenant;
            if (!primaryChurchId) {
              primaryChurchId = chDoc.id;
              primaryChurchSlug = chData.slug || chDoc.id;
            }

            // Activate pending team invite on this church with the verified user's UID and Name
            const norm = buildNormalizedTeamArrays(
              chData.ownerUid,
              chData.ownerEmail,
              chData.ownerName,
              chData.teamMembers,
              chData.managerEmails,
              chData.managerUids
            );

            let changed = false;
            const updatedMembers = norm.teamMembers.map((m) => {
              if (m.email === emailLower && (m.status !== 'active' || m.uid !== user.uid)) {
                changed = true;
                return {
                  ...m,
                  uid: user.uid,
                  name: m.name || resolvedName,
                  status: 'active' as const
                };
              }
              return m;
            });

            if (changed || !norm.managerUids.includes(user.uid)) {
              const recomputed = buildNormalizedTeamArrays(
                chData.ownerUid,
                chData.ownerEmail,
                chData.ownerName,
                updatedMembers,
                norm.managerEmails,
                [...norm.managerUids, user.uid]
              );
              await setDoc(
                doc(db, 'churches', chDoc.id),
                {
                  teamMembers: recomputed.teamMembers,
                  adminEmails: recomputed.adminEmails,
                  adminUids: recomputed.adminUids,
                  editorEmails: recomputed.editorEmails,
                  editorUids: recomputed.editorUids,
                  managerEmails: recomputed.managerEmails,
                  managerUids: recomputed.managerUids
                },
                { merge: true }
              );
            }
          }
        } catch {
          // ignore query errors if no churches exist yet
        }
      }

      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const existing = snap.data() as PlatformUser;
        const mergedManagedIds = isVerified
          ? Array.from(
              new Set([...(existing.managedChurchIds || []), ...matchedChurchIds].filter(Boolean))
            )
          : existing.managedChurchIds || [];
        const nextChurchId = existing.churchId || (isVerified ? primaryChurchId : undefined);
        const nextChurchSlug = existing.churchSlug || (isVerified ? primaryChurchSlug : undefined);
        const targetRole: 'owner' | 'gestor' = isOwner ? 'owner' : 'gestor';

        if (
          targetRole !== existing.role ||
          mergedManagedIds.length !== (existing.managedChurchIds || []).length ||
          nextChurchId !== existing.churchId
        ) {
          const updated: PlatformUser = {
            ...existing,
            name: existing.name || resolvedName,
            role: targetRole,
            ...(nextChurchId ? { churchId: nextChurchId, churchSlug: nextChurchSlug } : {}),
            managedChurchIds: mergedManagedIds,
            status: 'approved',
            updatedAt: serverTimestamp()
          };
          await setDoc(userRef, updated, { merge: true });
          return updated;
        }
        return {
          ...existing,
          role: targetRole
        };
      }

      const newUser: PlatformUser = {
        uid: user.uid,
        email: emailLower,
        name: resolvedName,
        role: isOwner ? 'owner' : 'gestor',
        status: 'approved',
        ...(isVerified && primaryChurchId
          ? { churchId: primaryChurchId, churchSlug: primaryChurchSlug }
          : {}),
        managedChurchIds: isVerified ? matchedChurchIds : [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(userRef, newUser);
      return newUser;
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}`);
      throw e;
    }
  }

  public static async createChurchForManager(
    user: User,
    wizardData: {
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
    }
  ): Promise<ChurchTenant> {
    const cleanSlug = slugifyChurchName(
      wizardData.slug || `${wizardData.name}-${wizardData.city}`
    );
    const available = await this.isSlugAvailable(cleanSlug);
    const finalSlug = available
      ? cleanSlug
      : `${cleanSlug}-${Math.random().toString(36).substring(2, 6)}`;
    const churchId = finalSlug;

    const emailLower = (user.email || '').toLowerCase().trim();
    const ownerName = user.displayName || emailLower.split('@')[0] || 'Gestor';
    const schedules = wizardData.schedules || [];

    const initialTeamMember: ChurchTeamMember = {
      email: emailLower,
      name: ownerName,
      uid: user.uid,
      role: 'admin',
      status: 'active',
      invitedAt: new Date().toISOString()
    };

    const newTenant: ChurchTenant = {
      id: churchId,
      slug: finalSlug,
      name: wizardData.name.trim(),
      tagline: wizardData.tagline?.trim() || '',
      aboutHistory: '',
      missionVision: '',
      address: wizardData.address?.trim() || '',
      city: wizardData.city.trim(),
      state: wizardData.state.trim().toUpperCase(),
      cityStateZip: `${wizardData.city.trim()} - ${wizardData.state.trim().toUpperCase()}`,
      status: 'ativa',
      themeColor: wizardData.themeColor || '#344E41',
      ...(wizardData.latitude !== undefined ? { latitude: wizardData.latitude } : {}),
      ...(wizardData.longitude !== undefined ? { longitude: wizardData.longitude } : {}),
      googleMapsUrl: '',
      primaryPhone: wizardData.primaryPhone?.trim() || '',
      secondaryPhone: '',
      whatsappNumber: wizardData.whatsappNumber?.trim() || '',
      whatsappDefaultMessage: `Olá! Gostaria de mais informações sobre a ${wizardData.name.trim()}.`,
      email: wizardData.email?.trim() || emailLower,
      instagramUrl: wizardData.instagramUrl?.trim() || '',
      youtubeUrl: wizardData.youtubeUrl?.trim() || '',
      facebookUrl: wizardData.facebookUrl?.trim() || '',
      logoUrl: wizardData.logoUrl || '',
      schedules,
      leadership: [],
      ownerUid: user.uid,
      ownerEmail: emailLower,
      ownerName,
      adminUids: [user.uid],
      adminEmails: [emailLower],
      editorUids: [],
      editorEmails: [],
      managerUids: [user.uid],
      managerEmails: [emailLower],
      teamMembers: [initialTeamMember],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    try {
      await setDoc(doc(db, 'churches', churchId), newTenant);

      if (schedules.length > 0) {
        await this.replaceSubcollectionItems(churchId, 'cultos', schedules);
      }

      const isOwner = isPlatformOwnerEmail(emailLower, Boolean(user.emailVerified));
      const userSnap = await getDoc(doc(db, 'users', user.uid));
      const existingManaged = userSnap.exists()
        ? (userSnap.data() as PlatformUser).managedChurchIds || []
        : [];

      await setDoc(
        doc(db, 'users', user.uid),
        {
          uid: user.uid,
          email: emailLower,
          name: ownerName,
          role: isOwner ? 'owner' : 'gestor',
          churchId,
          churchSlug: finalSlug,
          managedChurchIds: Array.from(new Set([...existingManaged, churchId])),
          status: 'approved',
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );

      return newTenant;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `churches/${churchId}`);
      throw e;
    }
  }

  // ============================================================================
  // 6. GESTÃO DE EQUIPE DA IGREJA (Administrador vs Editor)
  // ============================================================================
  public static async inviteTeamMember(
    churchId: string,
    inviteEmail: string,
    role: TeamRole = 'editor',
    invitedByEmail?: string
  ): Promise<void> {
    const cleanEmail = inviteEmail.toLowerCase().trim();
    if (!cleanEmail) return;
    const churchRef = doc(db, 'churches', churchId);

    try {
      const snap = await getDoc(churchRef);
      if (!snap.exists()) return;
      const data = snap.data() as ChurchTenant;

      const norm = buildNormalizedTeamArrays(
        data.ownerUid,
        data.ownerEmail,
        data.ownerName,
        data.teamMembers,
        data.managerEmails,
        data.managerUids
      );

      // Keep invite as 'pending' (unless already active with verified UID in this church)
      // It will automatically become 'active' when the invited user logs in with a verified email
      const existingMember = norm.teamMembers.find((m) => m.email === cleanEmail);
      const filteredMembers = norm.teamMembers.filter((m) => m.email !== cleanEmail);
      const isAlreadyVerifiedActive =
        existingMember?.status === 'active' && Boolean(existingMember?.uid);

      const newMember: ChurchTeamMember = {
        email: cleanEmail,
        ...(existingMember?.name ? { name: existingMember.name } : {}),
        ...(isAlreadyVerifiedActive && existingMember?.uid ? { uid: existingMember.uid } : {}),
        role: cleanEmail === data.ownerEmail?.toLowerCase() ? 'admin' : role,
        status: isAlreadyVerifiedActive ? 'active' : 'pending',
        invitedAt: existingMember?.invitedAt || new Date().toISOString(),
        ...(invitedByEmail ? { invitedBy: invitedByEmail } : {})
      };

      const recomputed = buildNormalizedTeamArrays(
        data.ownerUid,
        data.ownerEmail,
        data.ownerName,
        [...filteredMembers, newMember],
        norm.managerEmails,
        norm.managerUids
      );

      await setDoc(
        churchRef,
        {
          teamMembers: recomputed.teamMembers,
          adminEmails: recomputed.adminEmails,
          adminUids: recomputed.adminUids,
          editorEmails: recomputed.editorEmails,
          editorUids: recomputed.editorUids,
          managerEmails: recomputed.managerEmails,
          managerUids: recomputed.managerUids,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `churches/${churchId}`);
      throw e;
    }
  }

  public static async updateTeamMemberRole(
    churchId: string,
    memberEmail: string,
    newRole: TeamRole
  ): Promise<void> {
    const cleanEmail = memberEmail.toLowerCase().trim();
    const churchRef = doc(db, 'churches', churchId);

    try {
      const snap = await getDoc(churchRef);
      if (!snap.exists()) return;
      const data = snap.data() as ChurchTenant;

      if (data.ownerEmail?.toLowerCase().trim() === cleanEmail) {
        throw new Error('O gestor titular da igreja é sempre Administrador.');
      }

      const norm = buildNormalizedTeamArrays(
        data.ownerUid,
        data.ownerEmail,
        data.ownerName,
        data.teamMembers,
        data.managerEmails,
        data.managerUids
      );

      const updatedMembers = norm.teamMembers.map((m) =>
        m.email === cleanEmail ? { ...m, role: newRole } : m
      );

      const recomputed = buildNormalizedTeamArrays(
        data.ownerUid,
        data.ownerEmail,
        data.ownerName,
        updatedMembers,
        norm.managerEmails,
        norm.managerUids
      );

      await setDoc(
        churchRef,
        {
          teamMembers: recomputed.teamMembers,
          adminEmails: recomputed.adminEmails,
          adminUids: recomputed.adminUids,
          editorEmails: recomputed.editorEmails,
          editorUids: recomputed.editorUids,
          managerEmails: recomputed.managerEmails,
          managerUids: recomputed.managerUids,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `churches/${churchId}`);
      throw e;
    }
  }

  public static async removeManagerEmailFromChurch(
    churchId: string,
    emailToRemove: string
  ): Promise<void> {
    const cleanEmail = emailToRemove.toLowerCase().trim();
    const churchRef = doc(db, 'churches', churchId);
    try {
      const snap = await getDoc(churchRef);
      if (!snap.exists()) return;
      const data = snap.data() as ChurchTenant;
      if (data.ownerEmail?.toLowerCase().trim() === cleanEmail) {
        throw new Error('Não é possível remover o gestor titular da igreja.');
      }

      const norm = buildNormalizedTeamArrays(
        data.ownerUid,
        data.ownerEmail,
        data.ownerName,
        data.teamMembers,
        data.managerEmails,
        data.managerUids
      );

      const removedMember = norm.teamMembers.find((m) => m.email === cleanEmail);
      const remainingMembers = norm.teamMembers.filter((m) => m.email !== cleanEmail);
      const remainingEmails = norm.managerEmails.filter((e) => e !== cleanEmail);
      const remainingUids = removedMember?.uid
        ? norm.managerUids.filter((u) => u !== removedMember.uid)
        : norm.managerUids;

      const recomputed = buildNormalizedTeamArrays(
        data.ownerUid,
        data.ownerEmail,
        data.ownerName,
        remainingMembers,
        remainingEmails,
        remainingUids
      );

      await setDoc(
        churchRef,
        {
          teamMembers: recomputed.teamMembers,
          adminEmails: recomputed.adminEmails,
          adminUids: recomputed.adminUids,
          editorEmails: recomputed.editorEmails,
          editorUids: recomputed.editorUids,
          managerEmails: recomputed.managerEmails,
          managerUids: recomputed.managerUids,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `churches/${churchId}`);
      throw e;
    }
  }

  // ============================================================================
  // 7. PAINEL DO OWNER DA PLATAFORMA (/admin) & RESET TOTAL
  // ============================================================================
  public static subscribeToAllChurchesForOwner(
    onUpdate: (churches: ChurchTenant[]) => void
  ): () => void {
    return onSnapshot(
      collection(db, 'churches'),
      (snap) => {
        const list: ChurchTenant[] = [];
        snap.forEach((d) => list.push({ ...(d.data() as ChurchTenant), id: d.id }));
        list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        onUpdate(list);
      },
      (err) => console.warn('Owner all churches listener:', err)
    );
  }

  public static subscribeToAllUsersForOwner(
    onUpdate: (users: PlatformUser[]) => void
  ): () => void {
    return onSnapshot(
      collection(db, 'users'),
      (snap) => {
        const list: PlatformUser[] = [];
        snap.forEach((d) => list.push({ ...(d.data() as PlatformUser), uid: d.id }));
        onUpdate(list);
      },
      (err) => console.warn('Owner all users listener:', err)
    );
  }

  public static async updateChurchStatusByOwner(
    churchId: string,
    status: ChurchStatus
  ): Promise<void> {
    try {
      await setDoc(
        doc(db, 'churches', churchId),
        {
          status,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `churches/${churchId}`);
      throw e;
    }
  }

  public static async deleteChurchByOwner(churchId: string): Promise<void> {
    try {
      const subcollections = [
        'boletins',
        'escalas',
        'aniversariantes',
        'banners',
        'lideranca',
        'cultos'
      ] as const;
      for (const sub of subcollections) {
        const snap = await getDocs(collection(db, 'churches', churchId, sub));
        if (!snap.empty) {
          const batch = writeBatch(db);
          snap.forEach((d) => batch.delete(d.ref));
          await batch.commit();
        }
      }
      await deleteDoc(doc(db, 'churches', churchId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `churches/${churchId}`);
      throw e;
    }
  }

  /**
   * Requirement 4: "Apagar todos os dados da plataforma" (Owner only)
   * Deletes all churches and subcollections (and legacy collections) from Firestore without deleting Auth accounts.
   */
  public static async wipeAllPlatformDataByOwner(): Promise<void> {
    try {
      // 1. Delete all churches and their subcollections
      const churchesSnap = await getDocs(collection(db, 'churches'));
      for (const chDoc of churchesSnap.docs) {
        await this.deleteChurchByOwner(chDoc.id);
      }

      // 2. Delete legacy single-church collections if any exist
      const legacyCollections = ['church_data', 'church_registry', 'church_managers'] as const;
      for (const colName of legacyCollections) {
        try {
          const snap = await getDocs(collection(db, colName));
          if (!snap.empty) {
            const batch = writeBatch(db);
            snap.forEach((d) => batch.delete(d.ref));
            await batch.commit();
          }
        } catch {
          // ignore if empty or restricted
        }
      }

      // 3. Unlink churchId / churchSlug / managedChurchIds from all user documents in `users` (preserving Auth & user docs)
      const usersSnap = await getDocs(collection(db, 'users'));
      if (!usersSnap.empty) {
        const batch = writeBatch(db);
        usersSnap.forEach((uDoc) => {
          const uData = uDoc.data() as PlatformUser;
          batch.set(
            uDoc.ref,
            {
              uid: uData.uid || uDoc.id,
              email: uData.email || '',
              name: uData.name || 'Gestor',
              role: isPlatformOwnerEmail(uData.email, true) ? 'owner' : 'gestor',
              churchId: '',
              churchSlug: '',
              managedChurchIds: [],
              status: 'approved',
              updatedAt: serverTimestamp()
            },
            { merge: false }
          );
        });
        await batch.commit();
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, 'churches/*');
      throw e;
    }
  }

  // ============================================================================
  // 8. MÉTODOS DE LOGIN E COMPATIBILIDADE
  // ============================================================================
  public static async authenticateWithGoogle(
    preferredChurchName?: string
  ): Promise<{ user: PlatformUser; manager: ChurchManagerAccount; isFirstOwner: boolean }> {
    const provider = new GoogleAuthProvider();
    const credential = await signInWithPopup(auth, provider);
    const pUser = await this.resolveOrCreatePlatformUser(credential.user);

    const manager: ChurchManagerAccount = {
      uid: pUser.uid,
      email: pUser.email,
      name: pUser.name,
      role: pUser.role === 'owner' ? 'owner' : 'gestor',
      status: pUser.status || 'approved',
      churchId: pUser.churchId,
      churchSlug: pUser.churchSlug,
      requestedAt: new Date().toISOString()
    };

    void preferredChurchName;
    return {
      user: pUser,
      manager,
      isFirstOwner: !pUser.churchId
    };
  }

  public static async registerWithEmail(
    name: string,
    email: string,
    pass: string,
    preferredChurchName?: string
  ): Promise<{ user: PlatformUser; manager: ChurchManagerAccount; isFirstOwner: boolean }> {
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    if (name.trim()) {
      await updateProfile(credential.user, { displayName: name.trim() });
    }
    try {
      await sendEmailVerification(credential.user);
    } catch (err) {
      console.warn('Could not send verification email immediately:', err);
    }
    const pUser = await this.resolveOrCreatePlatformUser(credential.user, name.trim());

    const manager: ChurchManagerAccount = {
      uid: pUser.uid,
      email: pUser.email,
      name: pUser.name,
      role: pUser.role === 'owner' ? 'owner' : 'gestor',
      status: pUser.status || 'approved',
      churchId: pUser.churchId,
      churchSlug: pUser.churchSlug,
      requestedAt: new Date().toISOString()
    };

    void preferredChurchName;
    return {
      user: pUser,
      manager,
      isFirstOwner: !pUser.churchId
    };
  }

  public static async resendVerificationEmail(): Promise<void> {
    if (!auth.currentUser) {
      throw new Error('Nenhum usuário conectado.');
    }
    await sendEmailVerification(auth.currentUser);
  }

  public static async reloadAndCheckEmailVerified(): Promise<{
    verified: boolean;
    platformUser: PlatformUser | null;
  }> {
    if (!auth.currentUser) {
      return { verified: false, platformUser: null };
    }
    await reload(auth.currentUser);
    if (auth.currentUser.emailVerified) {
      await auth.currentUser.getIdToken(true);
      const pUser = await this.resolveOrCreatePlatformUser(auth.currentUser);
      return { verified: true, platformUser: pUser };
    }
    return { verified: false, platformUser: null };
  }

  public static async loginWithEmail(
    email: string,
    pass: string
  ): Promise<{ user: PlatformUser; manager: ChurchManagerAccount }> {
    const credential = await signInWithEmailAndPassword(auth, email.trim(), pass);
    const pUser = await this.resolveOrCreatePlatformUser(credential.user);

    const manager: ChurchManagerAccount = {
      uid: pUser.uid,
      email: pUser.email,
      name: pUser.name,
      role: pUser.role === 'owner' ? 'owner' : 'gestor',
      status: pUser.status || 'approved',
      churchId: pUser.churchId,
      churchSlug: pUser.churchSlug,
      requestedAt: new Date().toISOString()
    };

    return { user: pUser, manager };
  }

  public static async logout(): Promise<void> {
    await signOut(auth);
  }

  public static async seedAllChurchDataToCloud(
    churchId: string,
    data: {
      churchInfo: ChurchInfo;
      bulletins: Bulletin[];
      birthdays: BirthdayPerson[];
      deaconSchedules: DeaconScheduleItem[];
      banners: Banner[];
      settings?: AppSettings;
    }
  ): Promise<void> {
    await this.saveChurchTenantInfo(churchId, data.churchInfo);
    await this.replaceSubcollectionItems(churchId, 'boletins', data.bulletins);
    await this.replaceSubcollectionItems(churchId, 'aniversariantes', data.birthdays);
    await this.replaceSubcollectionItems(churchId, 'escalas', data.deaconSchedules);
    await this.replaceSubcollectionItems(churchId, 'banners', data.banners);
  }

  public static async updateManagerApprovalStatus(
    targetUid: string,
    status: ManagerApprovalStatus
  ): Promise<void> {
    try {
      await setDoc(
        doc(db, 'users', targetUid),
        {
          status,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${targetUid}`);
      throw e;
    }
  }

  public static async removeManagerAccount(targetUid: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'users', targetUid));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `users/${targetUid}`);
      throw e;
    }
  }
}
