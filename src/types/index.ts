export type ViewMode =
  | 'directory'
  | 'admin'
  | 'invite'
  | 'home'
  | 'bible'
  | 'bulletins'
  | 'birthdays'
  | 'deacons'
  | 'church'
  | 'manager';

export type UserRole = 'owner' | 'gestor' | 'membro';
export type TeamRole = 'admin' | 'editor';
export type ChurchStatus = 'ativa' | 'bloqueada' | 'pendente';

export type DeaconScheduleCategory = string;
export type PublicationStatus = 'draft' | 'published';

export type BannerPosition = 'topo' | 'meio' | 'rodape';

export type ManagerApprovalStatus = 'approved' | 'pending' | 'revoked';

export interface ChurchTeamMember {
  email: string;
  name?: string;
  uid?: string;
  role: TeamRole;
  status: 'active' | 'pending';
  invitedAt: string;
  invitedBy?: string;
  emailSent?: boolean;
  lastSentAt?: string;
  acceptedAt?: string;
}

export interface ChurchInviteDoc {
  email: string;
  churchId: string;
  churchSlug: string;
  churchName: string;
  role: TeamRole;
  status: 'pending' | 'accepted';
  emailSent?: boolean;
  invitedBy?: string;
  invitedAt: string;
  lastSentAt?: string;
  acceptedAt?: string;
  acceptedUid?: string;
}

export interface PlatformUser {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  churchId?: string;
  churchSlug?: string;
  managedChurchIds?: string[];
  status?: ManagerApprovalStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface PlatformSettings {
  appName: string;
  tagline: string;
  isPlatformBrandConfirmed?: boolean;
  updatedAt?: unknown;
}

export interface ChurchManagerAccount {
  uid: string;
  email: string;
  name: string;
  role: 'owner' | 'gestor';
  status: ManagerApprovalStatus;
  churchId?: string;
  churchSlug?: string;
  requestedAt: unknown;
  approvedAt?: unknown;
  approvedBy?: string;
}

export interface ChurchRegistry {
  churchId: string;
  churchName: string;
  ownerUid: string;
  ownerEmail: string;
  ownerName: string;
  createdAt: unknown;
}

export interface PublicationAuditFields {
  createdByName?: string;
  createdByEmail?: string;
  createdAt?: string;
  updatedByName?: string;
  updatedByEmail?: string;
  updatedAt?: string;
}

export interface ScheduleItem {
  id: string;
  day: string;
  time: string;
  title: string;
  description: string;
  location?: string;
}

export interface LeaderMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  photoUrl: string;
  email?: string;
  phone?: string;
}

export interface ChurchInfo {
  name: string;
  tagline: string;
  aboutHistory: string;
  missionVision: string;
  address: string;
  cityStateZip: string;
  googleMapsUrl: string;
  primaryPhone: string;
  secondaryPhone?: string;
  whatsappNumber: string;
  whatsappDefaultMessage: string;
  email: string;
  instagramUrl: string;
  youtubeUrl: string;
  facebookUrl: string;
  logoUrl: string;
  schedules: ScheduleItem[];
  leadership: LeaderMember[];
}

export interface ChurchTenant extends ChurchInfo {
  id: string;
  slug: string;
  city: string;
  state: string;
  status: ChurchStatus;
  themeColor: string;
  latitude?: number;
  longitude?: number;
  ownerUid: string;
  ownerEmail: string;
  ownerName?: string;
  adminUids?: string[];
  adminEmails?: string[];
  editorUids?: string[];
  editorEmails?: string[];
  managerUids: string[];
  managerEmails: string[];
  teamMembers?: ChurchTeamMember[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Bulletin extends PublicationAuditFields {
  id: string;
  title: string;
  editionDate: string; // YYYY-MM-DD
  summary: string;
  isCurrent: boolean;
  status?: PublicationStatus;
  type: 'pdf' | 'text';
  pdfUrl?: string;
  pdfFileName?: string;
  themeVerse?: string;
  pastoralWord?: string;
  orderOfService?: string[];
  announcements?: string[];
  createdAt: string;
}

export interface BirthdayPerson extends PublicationAuditFields {
  id: string;
  name: string;
  birthDay: number; // 1 - 31
  birthMonth: number; // 1 - 12
  birthYear?: number;
  phone?: string;
  photoUrl?: string;
  ministry?: string;
}

export interface DeaconScheduleItem extends PublicationAuditFields {
  id: string;
  category: DeaconScheduleCategory;
  status?: PublicationStatus;
  date: string; // YYYY-MM-DD
  serviceName: string;
  time: string;
  coordinator: string;
  coordinatorPhone?: string;
  receptionTeam: string[];
  offeringAndCommunionTeam: string[];
  parkingAndOrderTeam: string[];
  notes?: string;
}

export interface Banner extends PublicationAuditFields {
  id: string;
  title: string;
  position: BannerPosition;
  status?: PublicationStatus;
  imageUrl: string;
  linkUrl: string;
  openInNewTab: boolean;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  order: number;
  isActive: boolean;
}

export interface BibleBook {
  id: string;
  name: string;
  abbrev: string;
  chaptersCount: number;
  testament: 'VT' | 'NT';
  group: string;
}

export interface BibleVerse {
  number: number;
  text: string;
  book_id?: string;
  book_name?: string;
  chapter?: number;
  verse?: number;
}

export interface BibleChapterData {
  bookName: string;
  bookAbbrev: string;
  chapter: number;
  verses: BibleVerse[];
}

export interface BibleChapterResponse {
  reference: string;
  verses: BibleVerse[];
  text: string;
  translation_id: string;
  translation_name: string;
  isOfflineFallback?: boolean;
}

export interface UserBibleNote {
  id: string;
  bookAbbrev: string;
  bookName: string;
  chapter: number;
  verse: number;
  verseText?: string;
  reference: string;
  noteText: string;
  colorTag?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserFavoriteVerse {
  id: string;
  bookAbbrev: string;
  bookName: string;
  chapter: number;
  verse: number;
  verseText: string;
  reference: string;
  savedAt: string;
}

export interface BibleApiConfig {
  apiBaseUrl: string;
  apiKey: string;
  versionName: string;
  requestTimeoutMs: number;
}

export type BibleConfig = BibleApiConfig;

export interface AppSettings {
  appName: string;
  themeColor: string;
  bibleConfig: BibleApiConfig;
  managerEmail: string;
  lastUpdated: string;
}
