export type ViewMode = 'home' | 'bible' | 'bulletins' | 'birthdays' | 'deacons' | 'church' | 'manager';

export interface ScheduleItem {
  id: string;
  day: string;
  time: string;
  title: string;
  description: string;
  location?: string;
}

export type DeaconScheduleCategory =
  | 'semana_oracao'
  | 'quinta_estudo'
  | 'domingo_manha'
  | 'domingo_noite'
  | 'evento_especial';

export interface DeaconScheduleItem {
  id: string;
  category: DeaconScheduleCategory;
  date: string; // YYYY-MM-DD
  serviceName: string; // e.g., "Semana de Oração", "Culto de Estudo e Oração", "Culto Dominical (Manhã)", "Culto Dominical (Noite)", "Evento Especial"
  time: string; // e.g., "09h00", "19h30"
  coordinator: string; // Diácono Coordenador de Plantão
  coordinatorPhone?: string; // WhatsApp para contato/troca
  receptionTeam: string[]; // Porta e Acolhimento
  offeringAndCommunionTeam: string[]; // Coleta de Dízimos, Ofertas e Santa Ceia
  parkingAndOrderTeam: string[]; // Pátio, Estacionamento e Ordem
  notes?: string; // Observações ou detalhes do evento especial
}

export interface LeaderMember {
  id: string;
  name: string;
  role: string;
  bio?: string;
  photoUrl: string;
  phone?: string;
  email?: string;
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
  schedules: ScheduleItem[];
  leadership: LeaderMember[];
  logoUrl: string;
}

export interface Bulletin {
  id: string;
  title: string;
  editionDate: string; // YYYY-MM-DD
  summary: string;
  isCurrent: boolean;
  type: 'pdf' | 'text';
  pdfUrl?: string;
  pdfFileName?: string;
  textContent?: string;
  themeVerse?: string;
  pastoralWord?: string;
  orderOfService?: string[];
  announcements?: string[];
  createdAt: string;
}

export interface BirthdayPerson {
  id: string;
  name: string;
  birthDay: number; // 1-31
  birthMonth: number; // 1-12
  birthYear?: number;
  phone?: string;
  photoUrl?: string;
  ministry?: string;
}

export type BannerPosition = 'topo' | 'meio' | 'rodape';

export interface Banner {
  id: string;
  title: string;
  position: BannerPosition;
  imageUrl: string;
  linkUrl?: string;
  openInNewTab?: boolean;
  startDate?: string;
  endDate?: string;
  order: number;
  isActive: boolean;
}

export interface BibleConfig {
  apiBaseUrl: string;
  apiKey: string;
  versionName: string; // e.g., 'almeida_atualizada', 'nvi', etc.
  requestTimeoutMs: number;
}

export interface UserBibleNote {
  id: string;
  bookAbbrev: string;
  bookName: string;
  chapter: number;
  verse?: number;
  reference: string;
  noteText: string;
  colorTag: string; // hex or category
  createdAt: string;
  updatedAt: string;
}

export interface UserFavoriteVerse {
  id: string;
  bookAbbrev: string;
  bookName: string;
  chapter: number;
  verse: number;
  reference: string;
  verseText: string;
  savedAt: string;
}

export interface AppSettings {
  appName: string;
  themeColor: string;
  bibleConfig: BibleConfig;
  managerEmail: string;
  lastUpdated: string;
}

export interface BibleBook {
  id: string;
  abbrev: string;
  name: string;
  testament: 'VT' | 'NT';
  chaptersCount: number;
  group: string;
}

export interface BibleVerse {
  number: number;
  text: string;
}

export interface BibleChapterData {
  bookName: string;
  bookAbbrev: string;
  chapter: number;
  verses: BibleVerse[];
}
