import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  isSignInWithEmailLink,
  reload,
  sendEmailVerification,
  sendSignInLinkToEmail,
  signInWithEmailAndPassword,
  signInWithEmailLink,
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
  ChurchInviteDoc,
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

let firestoreErrorToastListener: ((message: string) => void) | null = null;

export function setFirestoreErrorListener(
  listener: ((message: string) => void) | null
): void {
  firestoreErrorToastListener = listener;
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): void {
  const rawMessage = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: rawMessage,
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

  // Show visible error toast on write/update/create/delete failures
  if (
    firestoreErrorToastListener &&
    (operationType === OperationType.CREATE ||
      operationType === OperationType.UPDATE ||
      operationType === OperationType.WRITE ||
      operationType === OperationType.DELETE)
  ) {
    firestoreErrorToastListener(
      `Erro ao gravar no banco de dados (${path || operationType}): ${rawMessage}`
    );
  }
}

/**
 * Recursively strips `undefined` fields from objects and arrays before writing to Firestore,
 * while preserving Firestore FieldValue sentinels (e.g. serverTimestamp()), Dates, and primitives.
 */
export function stripUndefined<T>(value: T): T {
  if (value === undefined || value === null) {
    return value;
  }
  if (typeof value !== 'object') {
    return value;
  }
  if (value instanceof Date) {
    return value;
  }
  // Preserve Firestore FieldValue sentinels (such as serverTimestamp())
  const proto = Object.getPrototypeOf(value);
  if (proto && proto !== Object.prototype && !Array.isArray(value)) {
    return value;
  }
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map((item) => stripUndefined(item)) as unknown as T;
  }
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (val !== undefined) {
      result[key] = stripUndefined(val);
    }
  }
  return result as T;
}

export const PLATFORM_OWNER_EMAIL = 'studiojpgloria@gmail.com';
export const EMAIL_FOR_SIGN_IN_STORAGE_KEY = 'emailForSignIn';

export const DAYS_OF_WEEK = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  '1ª Semana do Mês',
  'Diariamente'
] as const;

/**
 * Normalizes any time string ("19:30", "19h30", "18h", "9:00") to the standardized format "19h30" / "18h00"
 */
export function formatTimeStandard(raw?: string | null): string {
  if (!raw) return '19h00';
  const cleaned = raw.trim().toLowerCase();
  const match = cleaned.match(/^(\d{1,2})\s*[:h]\s*(\d{0,2})/);
  if (match) {
    const h = Math.min(23, Math.max(0, parseInt(match[1], 10)))
      .toString()
      .padStart(2, '0');
    const m = match[2]
      ? Math.min(59, Math.max(0, parseInt(match[2], 10)))
          .toString()
          .padStart(2, '0')
      : '00';
    return `${h}h${m}`;
  }
  const digitsOnly = cleaned.match(/^(\d{1,2})$/);
  if (digitsOnly) {
    const h = Math.min(23, Math.max(0, parseInt(digitsOnly[1], 10)))
      .toString()
      .padStart(2, '0');
    return `${h}h00`;
  }
  return raw.trim();
}

/**
 * Converts a standardized time ("19h30" or "18h") to HTML <input type="time" /> value ("19:30" or "18:00")
 */
export function standardTimeToHtmlTime(raw?: string | null): string {
  const std = formatTimeStandard(raw);
  const match = std.match(/^(\d{2})h(\d{2})$/);
  if (match) {
    return `${match[1]}:${match[2]}`;
  }
  return '19:00';
}

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
 * Helper to normalize team arrays on a ChurchTenant from its teamMembers list (and optional convites docs)
 */
export function buildNormalizedTeamArrays(
  ownerUid: string,
  ownerEmail: string,
  ownerName: string | undefined,
  existingMembers?: ChurchTeamMember[],
  fallbackManagerEmails?: string[],
  fallbackManagerUids?: string[],
  inviteDocs?: ChurchInviteDoc[]
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
      mapByEmail.set(
        em,
        stripUndefined({
          email: em,
          ...(m.name ? { name: m.name } : {}),
          ...(m.uid ? { uid: m.uid } : {}),
          role: m.role === 'editor' ? 'editor' : 'admin',
          status: m.status === 'active' || Boolean(m.uid) ? 'active' : 'pending',
          invitedAt: m.invitedAt || new Date().toISOString(),
          ...(m.invitedBy ? { invitedBy: m.invitedBy } : {}),
          ...(m.emailSent !== undefined ? { emailSent: m.emailSent } : {}),
          ...(m.lastSentAt ? { lastSentAt: m.lastSentAt } : {}),
          ...(m.acceptedAt ? { acceptedAt: m.acceptedAt } : {})
        })
      );
    }
  }

  // Merge subcollection convites/{email} if provided
  if (Array.isArray(inviteDocs)) {
    for (const inv of inviteDocs) {
      if (!inv?.email) continue;
      const em = inv.email.toLowerCase().trim();
      const prev = mapByEmail.get(em);
      const isAccepted = inv.status === 'accepted' || prev?.status === 'active' || Boolean(inv.acceptedUid || prev?.uid);
      mapByEmail.set(
        em,
        stripUndefined({
          email: em,
          ...(prev?.name ? { name: prev.name } : {}),
          ...(inv.acceptedUid || prev?.uid ? { uid: inv.acceptedUid || prev?.uid } : {}),
          role: inv.role === 'editor' ? 'editor' : 'admin',
          status: isAccepted ? 'active' : 'pending',
          invitedAt: inv.invitedAt || prev?.invitedAt || new Date().toISOString(),
          ...(inv.invitedBy || prev?.invitedBy ? { invitedBy: inv.invitedBy || prev?.invitedBy } : {}),
          ...(inv.emailSent !== undefined
            ? { emailSent: inv.emailSent }
            : prev?.emailSent !== undefined
            ? { emailSent: prev.emailSent }
            : {}),
          ...(inv.lastSentAt || prev?.lastSentAt ? { lastSentAt: inv.lastSentAt || prev?.lastSentAt } : {}),
          ...(inv.acceptedAt || prev?.acceptedAt ? { acceptedAt: inv.acceptedAt || prev?.acceptedAt } : {})
        })
      );
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

  // Always guarantee owner is an active admin without any undefined fields
  if (cleanOwnerEmail) {
    const prevOwner = mapByEmail.get(cleanOwnerEmail);
    const resolvedOwnerName = prevOwner?.name || ownerName || cleanOwnerEmail.split('@')[0];
    const resolvedOwnerUid = ownerUid || prevOwner?.uid;
    mapByEmail.set(
      cleanOwnerEmail,
      stripUndefined({
        email: cleanOwnerEmail,
        ...(resolvedOwnerName ? { name: resolvedOwnerName } : {}),
        ...(resolvedOwnerUid ? { uid: resolvedOwnerUid } : {}),
        role: 'admin',
        status: 'active',
        invitedAt: prevOwner?.invitedAt || new Date().toISOString(),
        ...(prevOwner?.invitedBy ? { invitedBy: prevOwner.invitedBy } : {})
      })
    );
  }

  const teamMembers = Array.from(mapByEmail.values()).map((m) => stripUndefined(m));
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
          const rawAppName = (data.appName || '').trim();
          const looksLikeLegacyChurchName =
            !data.isPlatformBrandConfirmed &&
            /ipb|presbiteriana|gl[oó]ria|central|batista|assembleia/i.test(rawAppName);
          onUpdate({
            appName: !rawAppName || looksLikeLegacyChurchName ? 'Minha Igreja' : rawAppName,
            tagline: data.tagline || 'Conectando você à sua comunidade de fé',
            isPlatformBrandConfirmed: Boolean(data.isPlatformBrandConfirmed)
          });
        } else {
          onUpdate({
            appName: 'Minha Igreja',
            tagline: 'Conectando você à sua comunidade de fé',
            isPlatformBrandConfirmed: true
          });
        }
      },
      () => {
        onUpdate({
          appName: 'Minha Igreja',
          tagline: 'Conectando você à sua comunidade de fé',
          isPlatformBrandConfirmed: true
        });
      }
    );
  }

  public static async savePlatformSettings(settings: PlatformSettings): Promise<void> {
    const ref = doc(db, 'platform_config', 'main');
    try {
      await setDoc(
        ref,
        stripUndefined({
          appName: settings.appName.trim() || 'Minha Igreja',
          tagline: settings.tagline.trim() || 'Conectando você à sua comunidade de fé',
          isPlatformBrandConfirmed: true,
          updatedAt: serverTimestamp()
        }),
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
    if (!normalized || normalized === 'admin' || normalized === 'gestor' || normalized === 'convite') {
      return null;
    }
    try {
      // 1. Direct document lookup
      try {
        const directSnap = await getDoc(doc(db, 'churches', normalized));
        if (directSnap.exists()) {
          return { ...(directSnap.data() as ChurchTenant), id: directSnap.id };
        }
      } catch {
        // Continue to query by slug if direct ID check fails
      }

      // 2. Query by slug
      try {
        const q = query(collection(db, 'churches'), where('slug', '==', normalized));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const first = snap.docs[0];
          return { ...(first.data() as ChurchTenant), id: first.id };
        }
      } catch {
        // Ignore if query fails
      }

      return null;
    } catch {
      return null;
    }
  }

  public static async isSlugAvailable(slug: string, excludeChurchId?: string): Promise<boolean> {
    const normalized = slugifyChurchName(slug);
    if (!normalized || normalized === 'admin' || normalized === 'gestor' || normalized === 'convite') {
      return false;
    }
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
    if (!candidate || candidate === 'admin' || candidate === 'gestor' || candidate === 'convite') {
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
      onInvites?: (list: ChurchInviteDoc[]) => void;
    }
  ): () => void {
    const unsubs: (() => void)[] = [];
    let latestRawTenant: ChurchTenant | null = null;
    let latestInvites: ChurchInviteDoc[] = [];

    const emitNormalizedTenant = () => {
      if (!latestRawTenant) {
        handlers.onTenant(null);
        return;
      }
      const norm = buildNormalizedTeamArrays(
        latestRawTenant.ownerUid,
        latestRawTenant.ownerEmail,
        latestRawTenant.ownerName,
        latestRawTenant.teamMembers,
        latestRawTenant.managerEmails,
        latestRawTenant.managerUids,
        latestInvites
      );
      handlers.onTenant({
        ...latestRawTenant,
        ...norm
      });
    };

    // 1. Church main document
    unsubs.push(
      onSnapshot(
        doc(db, 'churches', churchId),
        (snap) => {
          if (snap.exists()) {
            latestRawTenant = { ...(snap.data() as ChurchTenant), id: snap.id };
            emitNormalizedTenant();
          } else {
            latestRawTenant = null;
            handlers.onTenant(null);
          }
        },
        (err) => console.warn(`Church ${churchId} doc listener:`, err)
      )
    );

    // 1b. convites subcollection (only subscribed when authenticated to avoid permission warnings for public visitors)
    if (auth.currentUser) {
      unsubs.push(
        onSnapshot(
          collection(db, 'churches', churchId, 'convites'),
          (snap) => {
            const invites: ChurchInviteDoc[] = [];
            snap.forEach((d) => invites.push({ ...(d.data() as ChurchInviteDoc), email: d.id }));
            latestInvites = invites;
            if (handlers.onInvites) {
              handlers.onInvites(invites);
            }
            if (latestRawTenant) {
              emitNormalizedTenant();
            }
          },
          () => {
            // Non-admin visitors/editors don't need full convites list if restricted
          }
        )
      );
    }

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
      const normalizedSchedules = (info.schedules || []).map((s) =>
        stripUndefined({
          ...s,
          time: formatTimeStandard(s.time)
        })
      );
      const payload: Record<string, unknown> = {
        ...info,
        schedules: normalizedSchedules,
        city,
        state,
        updatedAt: serverTimestamp()
      };
      if (extra?.slug) payload.slug = slugifyChurchName(extra.slug);
      if (extra?.themeColor) payload.themeColor = extra.themeColor;
      if (extra?.latitude !== undefined) payload.latitude = extra.latitude;
      if (extra?.longitude !== undefined) payload.longitude = extra.longitude;

      await setDoc(ref, stripUndefined(payload), { merge: true });

      // Sync cultos & lideranca subcollections (requires Admin level)
      await this.replaceSubcollectionItems(churchId, 'cultos', normalizedSchedules);
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
      const cleanItem = stripUndefined(item);
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
        const cleanItem = stripUndefined(item);
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
          const churchesToProcess = new Map<string, ChurchTenant>();

          // 1. Query churches where managerEmails array-contains this email
          try {
            const qInvited = query(
              collection(db, 'churches'),
              where('managerEmails', 'array-contains', emailLower)
            );
            const invitedSnap = await getDocs(qInvited);
            for (const chDoc of invitedSnap.docs) {
              churchesToProcess.set(chDoc.id, { ...(chDoc.data() as ChurchTenant), id: chDoc.id });
            }
          } catch {
            // ignore
          }

          // 2. Also check active churches to catch any church where teamMembers or ownerEmail matches
          try {
            const qActive = query(collection(db, 'churches'), where('status', '==', 'ativa'));
            const activeSnap = await getDocs(qActive);
            for (const chDoc of activeSnap.docs) {
              const chData = chDoc.data() as ChurchTenant;
              const hasInTeam = chData.teamMembers?.some(
                (m) => m.email?.toLowerCase().trim() === emailLower
              );
              const isOwner = chData.ownerEmail?.toLowerCase().trim() === emailLower;
              if (hasInTeam || isOwner) {
                churchesToProcess.set(chDoc.id, { ...chData, id: chDoc.id });
              }
            }
          } catch {
            // ignore
          }

          for (const [chDocId, chData] of churchesToProcess.entries()) {
            matchedChurchIds.push(chDocId);
            if (!primaryChurchId) {
              primaryChurchId = chDocId;
              primaryChurchSlug = chData.slug || chDocId;
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
            const nowIso = new Date().toISOString();
            const updatedMembers = norm.teamMembers.map((m) => {
              if (m.email === emailLower && (m.status !== 'active' || m.uid !== user.uid)) {
                changed = true;
                return stripUndefined({
                  ...m,
                  uid: user.uid,
                  name: m.name || resolvedName,
                  status: 'active' as const,
                  acceptedAt: m.acceptedAt || nowIso
                });
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
                doc(db, 'churches', chDocId),
                stripUndefined({
                  teamMembers: recomputed.teamMembers,
                  adminEmails: recomputed.adminEmails,
                  adminUids: recomputed.adminUids,
                  editorEmails: recomputed.editorEmails,
                  editorUids: recomputed.editorUids,
                  managerEmails: recomputed.managerEmails,
                  managerUids: recomputed.managerUids
                }),
                { merge: true }
              );
            }

            // Also mark invite in subcollection churches/{churchId}/convites/{email} as accepted if present
            try {
              const inviteRef = doc(db, 'churches', chDocId, 'convites', emailLower);
              const inviteSnap = await getDoc(inviteRef);
              if (inviteSnap.exists()) {
                const invData = inviteSnap.data() as ChurchInviteDoc;
                if (invData.status !== 'accepted') {
                  await setDoc(
                    inviteRef,
                    stripUndefined({
                      ...invData,
                      status: 'accepted',
                      acceptedAt: nowIso,
                      acceptedUid: user.uid
                    }),
                    { merge: true }
                  );
                }
              }
            } catch {
              // ignore if convites doc doesn't exist
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
          const updated = stripUndefined<PlatformUser>({
            ...existing,
            name: existing.name || resolvedName,
            role: targetRole,
            ...(nextChurchId ? { churchId: nextChurchId, churchSlug: nextChurchSlug } : {}),
            managedChurchIds: mergedManagedIds,
            status: 'approved',
            updatedAt: serverTimestamp()
          });
          await setDoc(userRef, updated, { merge: true });
          return updated;
        }
        return {
          ...existing,
          role: targetRole
        };
      }

      const newUser = stripUndefined<PlatformUser>({
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
      });

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
    const schedules = (wizardData.schedules || []).map((s) => stripUndefined(s));

    const initialTeamMember: ChurchTeamMember = stripUndefined({
      email: emailLower,
      name: ownerName,
      uid: user.uid,
      role: 'admin',
      status: 'active',
      invitedAt: new Date().toISOString()
    });

    const newTenant: ChurchTenant = stripUndefined({
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
    });

    try {
      await setDoc(doc(db, 'churches', churchId), stripUndefined(newTenant));

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
        stripUndefined({
          uid: user.uid,
          email: emailLower,
          name: ownerName,
          role: isOwner ? 'owner' : 'gestor',
          churchId,
          churchSlug: finalSlug,
          managedChurchIds: Array.from(new Set([...existingManaged, churchId])),
          status: 'approved',
          updatedAt: serverTimestamp()
        }),
        { merge: true }
      );

      return newTenant;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `churches/${churchId}`);
      throw e;
    }
  }

  // ============================================================================
  // 6. GESTÃO DE EQUIPE DA IGREJA E CONVITES POR E-MAIL (churches/{churchId}/convites/{email})
  // ============================================================================
  public static async sendSignInInviteEmailLink(
    churchId: string,
    churchSlug: string,
    inviteEmail: string
  ): Promise<{ emailSent: boolean; emailError?: string }> {
    const cleanEmail = inviteEmail.toLowerCase().trim();
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const actionUrl = `${origin}/convite?igreja=${encodeURIComponent(churchSlug || churchId)}`;

    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(EMAIL_FOR_SIGN_IN_STORAGE_KEY, cleanEmail);
      }
      await sendSignInLinkToEmail(auth, cleanEmail, {
        url: actionUrl,
        handleCodeInApp: true
      });

      const nowIso = new Date().toISOString();
      try {
        await setDoc(
          doc(db, 'churches', churchId, 'convites', cleanEmail),
          stripUndefined({
            email: cleanEmail,
            emailSent: true,
            lastSentAt: nowIso
          }),
          { merge: true }
        );
      } catch {
        // ignore if called by guest requesting their own sign-in link
      }

      return { emailSent: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('sendSignInLinkToEmail warning:', msg);
      return { emailSent: false, emailError: msg };
    }
  }

  public static async inviteTeamMember(
    churchId: string,
    inviteEmail: string,
    role: TeamRole = 'editor',
    invitedByEmail?: string
  ): Promise<{ emailSent: boolean; emailError?: string }> {
    const cleanEmail = inviteEmail.toLowerCase().trim();
    if (!cleanEmail) {
      throw new Error('Informe um e-mail válido.');
    }
    const churchRef = doc(db, 'churches', churchId);
    const inviteRef = doc(db, 'churches', churchId, 'convites', cleanEmail);

    let churchSlug = churchId;

    try {
      const snap = await getDoc(churchRef);
      if (!snap.exists()) {
        throw new Error('Igreja não encontrada.');
      }
      const data = snap.data() as ChurchTenant;
      churchSlug = data.slug || churchId;
      const finalRole: TeamRole =
        cleanEmail === data.ownerEmail?.toLowerCase().trim() ? 'admin' : role;
      const nowIso = new Date().toISOString();

      const norm = buildNormalizedTeamArrays(
        data.ownerUid,
        data.ownerEmail,
        data.ownerName,
        data.teamMembers,
        data.managerEmails,
        data.managerUids
      );

      const existingMember = norm.teamMembers.find((m) => m.email === cleanEmail);
      const filteredMembers = norm.teamMembers.filter((m) => m.email !== cleanEmail);
      const isAlreadyVerifiedActive =
        existingMember?.status === 'active' && Boolean(existingMember?.uid);

      const newMember: ChurchTeamMember = stripUndefined({
        email: cleanEmail,
        ...(existingMember?.name ? { name: existingMember.name } : {}),
        ...(isAlreadyVerifiedActive && existingMember?.uid ? { uid: existingMember.uid } : {}),
        role: finalRole,
        status: isAlreadyVerifiedActive ? 'active' : 'pending',
        invitedAt: existingMember?.invitedAt || nowIso,
        ...(invitedByEmail ? { invitedBy: invitedByEmail } : {}),
        emailSent: true,
        lastSentAt: nowIso
      });

      // 1. Save invite document in subcollection churches/{churchId}/convites/{email}
      const inviteDoc: ChurchInviteDoc = stripUndefined({
        email: cleanEmail,
        churchId,
        churchSlug,
        churchName: data.name || churchSlug,
        role: finalRole,
        status: isAlreadyVerifiedActive ? 'accepted' : 'pending',
        emailSent: true,
        ...(invitedByEmail ? { invitedBy: invitedByEmail } : {}),
        invitedAt: existingMember?.invitedAt || nowIso,
        lastSentAt: nowIso,
        ...(isAlreadyVerifiedActive && existingMember?.uid
          ? { acceptedUid: existingMember.uid, acceptedAt: existingMember.acceptedAt || nowIso }
          : {})
      });
      await setDoc(inviteRef, inviteDoc, { merge: true });

      // 2. Keep normalized team arrays on churches/{churchId} in sync
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
        stripUndefined({
          teamMembers: recomputed.teamMembers,
          adminEmails: recomputed.adminEmails,
          adminUids: recomputed.adminUids,
          editorEmails: recomputed.editorEmails,
          editorUids: recomputed.editorUids,
          managerEmails: recomputed.managerEmails,
          managerUids: recomputed.managerUids,
          updatedAt: serverTimestamp()
        }),
        { merge: true }
      );
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `churches/${churchId}/convites/${cleanEmail}`);
      throw e;
    }

    // 3. Send passwordless sign-in link to invited email via Firebase Auth
    return await this.sendSignInInviteEmailLink(churchId, churchSlug, cleanEmail);
  }

  public static async updateTeamMemberRole(
    churchId: string,
    memberEmail: string,
    newRole: TeamRole
  ): Promise<void> {
    const cleanEmail = memberEmail.toLowerCase().trim();
    const churchRef = doc(db, 'churches', churchId);
    const inviteRef = doc(db, 'churches', churchId, 'convites', cleanEmail);

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
        m.email === cleanEmail ? stripUndefined({ ...m, role: newRole }) : m
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
        stripUndefined({
          teamMembers: recomputed.teamMembers,
          adminEmails: recomputed.adminEmails,
          adminUids: recomputed.adminUids,
          editorEmails: recomputed.editorEmails,
          editorUids: recomputed.editorUids,
          managerEmails: recomputed.managerEmails,
          managerUids: recomputed.managerUids,
          updatedAt: serverTimestamp()
        }),
        { merge: true }
      );

      // Update convites subcollection doc if it exists
      const invSnap = await getDoc(inviteRef);
      if (invSnap.exists()) {
        await setDoc(inviteRef, stripUndefined({ role: newRole }), { merge: true });
      }
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
    const inviteRef = doc(db, 'churches', churchId, 'convites', cleanEmail);
    try {
      const snap = await getDoc(churchRef);
      if (!snap.exists()) return;
      const data = snap.data() as ChurchTenant;
      if (data.ownerEmail?.toLowerCase().trim() === cleanEmail) {
        throw new Error('Não é possível remover o gestor titular da igreja.');
      }

      // Delete from subcollection churches/{churchId}/convites/{email}
      try {
        await deleteDoc(inviteRef);
      } catch {
        // ignore if not found
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
        stripUndefined({
          teamMembers: recomputed.teamMembers,
          adminEmails: recomputed.adminEmails,
          adminUids: recomputed.adminUids,
          editorEmails: recomputed.editorEmails,
          editorUids: recomputed.editorUids,
          managerEmails: recomputed.managerEmails,
          managerUids: recomputed.managerUids,
          updatedAt: serverTimestamp()
        }),
        { merge: true }
      );
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `churches/${churchId}`);
      throw e;
    }
  }

  /**
   * Accepts a pending invite for a specific church (used on /convite route)
   */
  public static async acceptTeamInviteForChurch(
    user: User,
    churchSlugOrId: string
  ): Promise<{ churchSlug: string; churchName: string; role: TeamRole }> {
    const emailLower = (user.email || '').toLowerCase().trim();
    if (!emailLower) {
      throw new Error('Usuário sem e-mail válido.');
    }

    const church = await this.getChurchBySlug(churchSlugOrId);
    if (!church) {
      throw new Error('A igreja do convite não foi encontrada.');
    }

    const inviteRef = doc(db, 'churches', church.id, 'convites', emailLower);
    const inviteSnap = await getDoc(inviteRef);
    const inviteData = inviteSnap.exists() ? (inviteSnap.data() as ChurchInviteDoc) : null;

    const existingTeamMember = church.teamMembers?.find(
      (m) => m.email.toLowerCase().trim() === emailLower
    );
    const isListedInChurch =
      Boolean(inviteData) ||
      Boolean(existingTeamMember) ||
      church.managerEmails?.map((e) => e.toLowerCase().trim()).includes(emailLower) ||
      church.ownerEmail?.toLowerCase().trim() === emailLower;

    if (!isListedInChurch) {
      throw new Error(
        `Não há convite pendente para o e-mail ${emailLower} na igreja ${church.name}.`
      );
    }

    const assignedRole: TeamRole =
      church.ownerEmail?.toLowerCase().trim() === emailLower
        ? 'admin'
        : inviteData?.role || existingTeamMember?.role || 'editor';

    const nowIso = new Date().toISOString();
    const displayName = user.displayName || emailLower.split('@')[0] || 'Colaborador';

    // 1. Mark convites/{email} as accepted
    if (inviteSnap.exists()) {
      await setDoc(
        inviteRef,
        stripUndefined({
          ...inviteData,
          status: 'accepted',
          acceptedAt: nowIso,
          acceptedUid: user.uid
        }),
        { merge: true }
      );
    }

    // 2. Activate member in churches/{churchId}
    const norm = buildNormalizedTeamArrays(
      church.ownerUid,
      church.ownerEmail,
      church.ownerName,
      church.teamMembers,
      church.managerEmails,
      church.managerUids
    );

    const filtered = norm.teamMembers.filter((m) => m.email !== emailLower);
    const activeMember: ChurchTeamMember = stripUndefined({
      email: emailLower,
      name: existingTeamMember?.name || displayName,
      uid: user.uid,
      role: assignedRole,
      status: 'active',
      invitedAt: inviteData?.invitedAt || existingTeamMember?.invitedAt || nowIso,
      ...(inviteData?.invitedBy || existingTeamMember?.invitedBy
        ? { invitedBy: inviteData?.invitedBy || existingTeamMember?.invitedBy }
        : {}),
      emailSent: true,
      acceptedAt: nowIso
    });

    const recomputed = buildNormalizedTeamArrays(
      church.ownerUid,
      church.ownerEmail,
      church.ownerName,
      [...filtered, activeMember],
      [...norm.managerEmails, emailLower],
      [...norm.managerUids, user.uid]
    );

    await setDoc(
      doc(db, 'churches', church.id),
      stripUndefined({
        teamMembers: recomputed.teamMembers,
        adminEmails: recomputed.adminEmails,
        adminUids: recomputed.adminUids,
        editorEmails: recomputed.editorEmails,
        editorUids: recomputed.editorUids,
        managerEmails: recomputed.managerEmails,
        managerUids: recomputed.managerUids
      }),
      { merge: true }
    );

    // 3. Link user profile in users/{uid}
    const pUser = await this.resolveOrCreatePlatformUser(user, displayName);
    const updatedManaged = Array.from(
      new Set([...(pUser.managedChurchIds || []), church.id].filter(Boolean))
    );
    await setDoc(
      doc(db, 'users', user.uid),
      stripUndefined({
        uid: user.uid,
        email: emailLower,
        name: pUser.name || displayName,
        role: isPlatformOwnerEmail(emailLower, true) ? 'owner' : 'gestor',
        churchId: pUser.churchId || church.id,
        churchSlug: pUser.churchSlug || church.slug,
        managedChurchIds: updatedManaged,
        status: 'approved',
        updatedAt: serverTimestamp()
      }),
      { merge: true }
    );

    return {
      churchSlug: church.slug,
      churchName: church.name,
      role: assignedRole
    };
  }

  public static isEmailSignInLink(url: string): boolean {
    try {
      return isSignInWithEmailLink(auth, url);
    } catch {
      return false;
    }
  }

  public static async completeEmailLinkSignIn(
    email: string,
    url: string,
    churchSlug?: string
  ): Promise<{
    user: PlatformUser;
    targetSlug?: string;
    churchName?: string;
    role?: TeamRole;
  }> {
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail) {
      throw new Error('Informe o seu e-mail para concluir o login.');
    }

    const credential = await signInWithEmailLink(auth, cleanEmail, url);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(EMAIL_FOR_SIGN_IN_STORAGE_KEY);
    }

    let acceptedInfo: { churchSlug: string; churchName: string; role: TeamRole } | null = null;
    if (churchSlug) {
      try {
        acceptedInfo = await this.acceptTeamInviteForChurch(credential.user, churchSlug);
      } catch (err) {
        console.warn('Invite acceptance warning on email link sign-in:', err);
      }
    }

    const pUser = await this.resolveOrCreatePlatformUser(credential.user);
    return {
      user: pUser,
      targetSlug: acceptedInfo?.churchSlug || churchSlug || pUser.churchSlug,
      churchName: acceptedInfo?.churchName,
      role: acceptedInfo?.role
    };
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
        stripUndefined({
          status,
          updatedAt: serverTimestamp()
        }),
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
        'cultos',
        'convites'
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
            stripUndefined({
              uid: uData.uid || uDoc.id,
              email: uData.email || '',
              name: uData.name || 'Gestor',
              role: isPlatformOwnerEmail(uData.email, true) ? 'owner' : 'gestor',
              churchId: '',
              churchSlug: '',
              managedChurchIds: [],
              status: 'approved',
              updatedAt: serverTimestamp()
            }),
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
        stripUndefined({
          status,
          updatedAt: serverTimestamp()
        }),
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
