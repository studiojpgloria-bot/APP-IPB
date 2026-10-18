/**
 * Church Storage Service
 * 
 * GUIA DE INTEGRAÇÃO COM FIREBASE (Quando o usuário solicitar subida para a nuvem):
 * - Para o Firestore: basta substituir os métodos get/set do LocalStorage por:
 *     import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
 *     import { db, storage } from '../config/firebase';
 * - Para o Firebase Storage: a função compressImageFile já gera o Blob/Base64 ideal
 *     para upload via `uploadBytes(ref(storage, path), blob)`.
 * 
 * Atualmente este serviço opera 100% em memória/localStorage local para testes
 * instantâneos sem exigir credenciais ou custos externos.
 */

import { AppSettings, Banner, BirthdayPerson, Bulletin, ChurchInfo, DeaconScheduleItem, UserBibleNote, UserFavoriteVerse } from '../types';
import { FAMOUS_CHAPTERS } from './bibleData';

export const STORAGE_KEYS = {
  CHURCH_INFO: 'ipc_church_info_v2',
  BULLETINS: 'ipc_bulletins_v1',
  BIRTHDAYS: 'ipc_birthdays_v1',
  DEACON_SCHEDULES: 'ipc_deacon_schedules_v2',
  BANNERS: 'ipc_banners_v1',
  SETTINGS: 'ipc_settings_v1',
  MANAGER_AUTH: 'ipc_manager_auth_v1',
  USER_NOTES: 'ipc_user_bible_notes_v1',
  USER_FAVORITES: 'ipc_user_bible_favorites_v1',
  USER_NOTE_DRAFT: 'ipc_user_note_draft_v1',
  USER_READING_STATE: 'ipc_user_reading_state_v1',
  USER_CACHE_META: 'ipc_user_cache_meta_v1',
  BIBLE_CHAPTERS_CACHE: 'ipc_bible_chapters_cache_v1'
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

// Calculates today's day and month to ensure immediate demonstration of the birthday of the day
const today = new Date();
const currentDay = today.getDate();
const currentMonth = today.getMonth() + 1;

export const INITIAL_CHURCH_INFO: ChurchInfo = {
  name: 'Igreja Presbiteriana Central',
  tagline: 'Uma comunidade de fé, acolhimento e esperança em Cristo',
  aboutHistory:
    'Fundada em 1954, a Igreja Presbiteriana Central é uma comunidade reformada e acolhedora, comprometida com a fidelidade bíblica, a proclamação do Evangelho da Graça e o serviço amoroso à nossa cidade. Reunimo-nos semanalmente para prestar culto a Deus, crescer no conhecimento das Escrituras e cultivar relacionamentos fraternos genuínos.',
  missionVision:
    'Glorificar a Deus por meio do discipulado transformador, edificando famílias firmadas na Palavra e servindo à comunidade com compaixão e verdade.',
  address: 'Rua das Oliveiras, 450 - Centro Histórico',
  cityStateZip: 'São Paulo - SP, CEP 01000-000',
  googleMapsUrl: 'https://maps.google.com/?q=Igreja+Presbiteriana+Central',
  primaryPhone: '(11) 3256-8800',
  secondaryPhone: '(11) 3256-8810',
  whatsappNumber: '5511999887766',
  whatsappDefaultMessage: 'Olá! Gostaria de mais informações sobre os cultos e atividades da Igreja Presbiteriana Central.',
  email: 'contato@ipcentral.org.br',
  instagramUrl: 'https://instagram.com',
  youtubeUrl: 'https://youtube.com',
  facebookUrl: 'https://facebook.com',
  logoUrl: 'https://images.unsplash.com/photo-1548625361-196144e1329c?auto=format&fit=crop&w=400&q=80',
  schedules: [
    {
      id: 'sch-1',
      day: '1ª Semana do Mês',
      time: '19h30',
      title: 'Semana de Oração Mensal',
      description: 'Reuniões especiais de clamor, intercessão e consagração na primeira semana de cada mês.',
      location: 'Templo Principal'
    },
    {
      id: 'sch-2',
      day: 'Quinta-feira',
      time: '19h30',
      title: 'Culto de Estudo e Oração',
      description: 'Momento semanal de ensino expositivo das Escrituras e intercessão pelas famílias.',
      location: 'Templo Principal'
    },
    {
      id: 'sch-3',
      day: 'Domingo (Manhã)',
      time: '09h00',
      title: 'Culto Matutino & Escola Bíblica',
      description: 'Culto solene pela manhã e estudo bíblico para todas as faixas etárias.',
      location: 'Templo Principal e Salas'
    },
    {
      id: 'sch-4',
      day: 'Domingo (Noite)',
      time: '19h00',
      title: 'Culto de Adoração à Noite',
      description: 'Louvor congregacional acolhedor, orações e proclamação do Evangelho para toda a família.',
      location: 'Templo Principal'
    },
    {
      id: 'sch-5',
      day: 'Eventos Especiais',
      time: 'Conforme Agenda',
      title: 'Programações e Eventos da Igreja',
      description: 'Santa Ceia, conferências, casamentos, encontros de departamentos e celebrações especiais.',
      location: 'Templo / Salão Social'
    }
  ],
  leadership: [
    {
      id: 'lead-1',
      name: 'Rev. Paulo Silveira',
      role: 'Pastor Titular',
      bio: 'Bacharel em Teologia pelo Seminário Presbiteriano com mestrado em Aconselhamento Pastoral. Casado com Lúcia e pai de dois filhos.',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      phone: '(11) 98765-4321',
      email: 'rev.paulo@ipcentral.org.br'
    },
    {
      id: 'lead-2',
      name: 'Rev. Marcos Vinícius',
      role: 'Pastor Auxiliar de Jovens e Família',
      bio: 'Responsável pelos ministérios de juventude, EBD e integração de novos membros.',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      phone: '(11) 97654-3210',
      email: 'rev.marcos@ipcentral.org.br'
    },
    {
      id: 'lead-3',
      name: 'Presb. Roberto Santos',
      role: 'Vice-Presidente do Conselho',
      bio: 'Presbítero regente há 15 anos, coordenador das obras missionárias e assistência social.',
      photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      phone: '(11) 96543-2109'
    },
    {
      id: 'lead-4',
      name: 'Diac. Helena Drummond',
      role: 'Presidente da Junta Diaconal',
      bio: 'Coordena o ministério de acolhimento, recepção de visitantes e assistência às famílias.',
      photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80'
    }
  ]
};

export const INITIAL_BULLETINS: Bulletin[] = [
  {
    id: 'bol-1',
    title: 'Boletim Semanal IPC - O Cuidado da Providência Divina',
    editionDate: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    summary: 'Reflexão pastoral em Mateus 6, escala de liturgia, aniversariantes da semana e avisos do retiro comunitário.',
    isCurrent: true,
    type: 'text',
    themeVerse: '“Buscai, pois, em primeiro lugar, o seu reino e a sua justiça, e todas estas coisas vos serão acrescentadas.” — Mateus 6:33',
    pastoralWord:
      'Querida congregação, vivemos dias marcados por ansiedades e incertezas sobre o amanhã. Todavia, as palavras de nosso Senhor Jesus Cristo nos convidam a repousar no cuidado paternal do Criador, que sustenta as aves dos céus e veste com incomparável beleza as flores dos campos. Que neste domingo nossos corações se encham da paz que excede todo entendimento, lembrando que a graça de Deus nos basta para cada dia.',
    orderOfService: [
      'Prelúdio Instrumental e Chamada à Adoração (Salmo 100)',
      'Hino Congregacional nº 15 - "Segurança e Paz"',
      'Oração Pastoral de Invocação e Confissão',
      'Leitura Bíblica Alternada: Filipenses 4:4-9',
      'Cânticos de Louvor e Gratidão',
      'Consagração de Dízimos e Ofertas de Amor',
      'Mensagem Pastoral: "Descansando na Soberania de Deus" (Rev. Paulo Silveira)',
      'Oração Final e Bênção Apostólica',
      'Poslúdio e Recepção aos Visitantes'
    ],
    announcements: [
      'Escola Bíblica Dominical: início do novo trimestre sobre as Epístolas da Prisão no próximo domingo às 10h15.',
      'Campanha de Arrecadação de Agasalhos e Cobertores no hall de entrada durante todo este mês.',
      'Ensaio Geral do Coral Central: sábado às 16h no templo principal.',
      'Reunião da Sociedade de Mulheres (SAF): quinta-feira às 15h no Salão Social.'
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 'bol-2',
    title: 'Boletim Semanal IPC - Famílias Firmadas na Rocha',
    editionDate: new Date(today.getTime() - 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    summary: 'Mês da Família: princípios para um lar harmonioso e cristocêntrico. Escalas e informes.',
    isCurrent: false,
    type: 'text',
    themeVerse: '“Eu e a minha casa serviremos ao Senhor.” — Josué 24:15b',
    pastoralWord:
      'O lar é a primeira igreja com a qual nos deparamos. Fortalecer os vínculos conjugais e instruir nossos filhos no temor do Senhor são privilégios santos que demandam tempo, dedicação e mansidão.',
    orderOfService: [
      'Louvor Inicial e Saudação',
      'Oração pelas Famílias da Igreja',
      'Dedicação de Crianças ao Senhor',
      'Sermão: Edificando sobre a Rocha',
      'Comunhão e Café Fraterno'
    ],
    announcements: [
      'Almoço Comunitário das Famílias no próximo domingo após a EBD.',
      'Inscrições para o Encontro de Casais abertas na secretaria.'
    ],
    createdAt: new Date(today.getTime() - 9 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const INITIAL_BIRTHDAYS: BirthdayPerson[] = [
  {
    id: 'bday-today',
    name: 'Ana Carolina Mendonça',
    birthDay: currentDay,
    birthMonth: currentMonth,
    birthYear: 1994,
    phone: '(11) 98111-2233',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    ministry: 'Ministério de Louvor & EBD Infantil'
  },
  {
    id: 'bday-2',
    name: 'Carlos Eduardo Barreto',
    birthDay: ((currentDay + 2) % 28) + 1,
    birthMonth: currentMonth,
    birthYear: 1982,
    phone: '(11) 98222-3344',
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
    ministry: 'Junta Diaconal'
  },
  {
    id: 'bday-3',
    name: 'Beatriz Vasconcelos',
    birthDay: ((currentDay + 5) % 28) + 1,
    birthMonth: currentMonth,
    birthYear: 2001,
    phone: '(11) 98333-4455',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
    ministry: 'Mocidade IPC'
  },
  {
    id: 'bday-4',
    name: 'Rev. Paulo Silveira',
    birthDay: ((currentDay + 11) % 28) + 1,
    birthMonth: currentMonth,
    birthYear: 1974,
    phone: '(11) 98765-4321',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    ministry: 'Pastorado Titular'
  },
  {
    id: 'bday-5',
    name: 'Dona Maria de Lourdes',
    birthDay: ((currentDay + 18) % 28) + 1,
    birthMonth: currentMonth,
    birthYear: 1948,
    phone: '(11) 98444-5566',
    photoUrl: 'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?auto=format&fit=crop&w=300&q=80',
    ministry: 'Sociedade de Mulheres (SAF)'
  },
  {
    id: 'bday-6',
    name: 'Gabriel Albuquerque',
    birthDay: 15,
    birthMonth: (currentMonth % 12) + 1,
    birthYear: 1999,
    phone: '(11) 98555-6677',
    ministry: 'Sonorização e Transmissão'
  }
];

// Helper to format date in current month
const formatMonthDate = (dayNum: number) => {
  const y = today.getFullYear();
  const m = String(currentMonth).padStart(2, '0');
  const d = String(Math.min(Math.max(dayNum, 1), 28)).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const INITIAL_DEACON_SCHEDULES: DeaconScheduleItem[] = [
  // 1. PRIMEIRA SEMANA DO MÊS: SEMANA DE ORAÇÃO
  {
    id: 'deac-sem-oracao-1',
    category: 'semana_oracao',
    date: formatMonthDate(2),
    serviceName: '1ª Semana do Mês — Semana de Oração (Abertura a Sexta)',
    time: '19h30',
    coordinator: 'Diác. Helena Drummond',
    coordinatorPhone: '5511999887766',
    receptionTeam: ['Diác. Carlos Eduardo Barreto', 'Diác. Lucas Magalhães'],
    offeringAndCommunionTeam: ['Diác. Helena Drummond', 'Diác. Marcos Azevedo'],
    parkingAndOrderTeam: ['Diác. André Viana', 'Diác. Felipe Tavares'],
    notes: 'Plantão especial durante toda a 1ª semana do mês (Semana de Oração). Abertura do templo às 19h00.'
  },

  // 2. QUINTAS-FEIRAS: CULTO DE ESTUDO E ORAÇÃO
  {
    id: 'deac-quinta-1',
    category: 'quinta_estudo',
    date: formatMonthDate(Math.max(currentDay - 3, 8)),
    serviceName: 'Quinta-feira — Culto de Estudo e Oração',
    time: '19h30',
    coordinator: 'Diác. Marcos Azevedo',
    coordinatorPhone: '5511999887766',
    receptionTeam: ['Diác. Marcos Azevedo', 'Diác. Mariana Costa'],
    offeringAndCommunionTeam: ['Diác. Rafael Nogueira'],
    parkingAndOrderTeam: ['Diác. Lucas Magalhães'],
    notes: 'Apoio na distribuição de hinários/bíblias e ordem no estacionamento.'
  },
  {
    id: 'deac-quinta-2',
    category: 'quinta_estudo',
    date: formatMonthDate(Math.min(currentDay + 4, 27)),
    serviceName: 'Quinta-feira — Culto de Estudo e Oração',
    time: '19h30',
    coordinator: 'Diác. Rafael Nogueira',
    coordinatorPhone: '5511999887766',
    receptionTeam: ['Diác. Rafael Nogueira', 'Diác. Ricardo Gomes'],
    offeringAndCommunionTeam: ['Diác. Henrique Lopes'],
    parkingAndOrderTeam: ['Diác. Samuel Rocha'],
    notes: 'Plantão de quinta-feira. Verificar microfones e água no púlpito às 19h10.'
  },

  // 3. DOMINGO PELA MANHÃ: CULTO MATUTINO
  {
    id: 'deac-dom-manha-1',
    category: 'domingo_manha',
    date: formatMonthDate(currentDay),
    serviceName: 'Domingo pela Manhã — Culto Matutino & EBD',
    time: '09h00',
    coordinator: 'Diác. Helena Drummond',
    coordinatorPhone: '5511999887766',
    receptionTeam: ['Diác. Carlos Eduardo Barreto', 'Diác. Lucas Magalhães'],
    offeringAndCommunionTeam: ['Diác. Helena Drummond', 'Diác. Marcos Azevedo'],
    parkingAndOrderTeam: ['Diác. André Viana', 'Diác. Felipe Tavares'],
    notes: 'Culto dominical matutino e transição para as classes da Escola Bíblica Dominical.'
  },
  {
    id: 'deac-dom-manha-2',
    category: 'domingo_manha',
    date: formatMonthDate(Math.min(currentDay + 7, 28)),
    serviceName: 'Domingo pela Manhã — Culto Matutino & EBD',
    time: '09h00',
    coordinator: 'Diác. Rafael Nogueira',
    coordinatorPhone: '5511999887766',
    receptionTeam: ['Diác. Mariana Costa', 'Diác. Samuel Rocha'],
    offeringAndCommunionTeam: ['Diác. Rafael Nogueira', 'Diác. Henrique Lopes'],
    parkingAndOrderTeam: ['Diác. Ricardo Gomes', 'Diác. Tiago Mendes'],
    notes: 'Chegada da equipe às 08h30 para recepção das famílias.'
  },

  // 4. DOMINGO À NOITE: CULTO NOTURNO
  {
    id: 'deac-dom-noite-1',
    category: 'domingo_noite',
    date: formatMonthDate(currentDay),
    serviceName: 'Domingo à Noite — Culto de Adoração e Santa Ceia',
    time: '19h00',
    coordinator: 'Diác. Carlos Eduardo Barreto',
    coordinatorPhone: '5511982223344',
    receptionTeam: ['Diác. Mariana Costa', 'Diác. Ricardo Gomes'],
    offeringAndCommunionTeam: ['Diác. Carlos Eduardo Barreto', 'Diác. Henrique Lopes', 'Diác. Helena Drummond'],
    parkingAndOrderTeam: ['Diác. Samuel Rocha', 'Diác. Tiago Mendes'],
    notes: 'Culto de Domingo à Noite com Santa Ceia. Preparação da mesa da Ceia às 18h15.'
  },
  {
    id: 'deac-dom-noite-2',
    category: 'domingo_noite',
    date: formatMonthDate(Math.min(currentDay + 7, 28)),
    serviceName: 'Domingo à Noite — Culto Vespertino da Família',
    time: '19h00',
    coordinator: 'Diác. André Viana',
    coordinatorPhone: '5511999887766',
    receptionTeam: ['Diác. Felipe Tavares', 'Diác. Tiago Mendes'],
    offeringAndCommunionTeam: ['Diác. André Viana', 'Diác. Carlos Eduardo Barreto'],
    parkingAndOrderTeam: ['Diác. Lucas Magalhães', 'Diác. Marcos Azevedo'],
    notes: 'Recepção especial de visitantes no hall principal.'
  },

  // 5. ESPAÇO RESERVADO PARA EVENTOS ESPECIAIS
  {
    id: 'deac-evento-1',
    category: 'evento_especial',
    date: formatMonthDate(Math.min(currentDay + 5, 28)),
    serviceName: 'Evento Especial — Encontro de Casais & Famílias',
    time: '19h30',
    coordinator: 'Diác. Helena Drummond',
    coordinatorPhone: '5511999887766',
    receptionTeam: ['Diác. Helena Drummond', 'Diác. Mariana Costa'],
    offeringAndCommunionTeam: ['Diác. Carlos Eduardo Barreto'],
    parkingAndOrderTeam: ['Diác. André Viana', 'Diác. Samuel Rocha'],
    notes: 'Espaço reservado para Eventos: Apoio na organização do Salão Social e recepção dos convidados.'
  }
];

export const INITIAL_BANNERS: Banner[] = [
  {
    id: 'ban-top-1',
    title: 'Retiro Espiritual de Outono | Inscrições Abertas até 25 do mês',
    position: 'topo',
    imageUrl: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=1200&q=80',
    linkUrl: 'https://wa.me/5511999887766?text=Quero+me+inscrever+no+Retiro+de+Outono',
    openInNewTab: true,
    order: 1,
    isActive: true
  },
  {
    id: 'ban-mid-1',
    title: 'Novo Módulo da Escola Bíblica: Teologia e Poesia nos Salmos',
    position: 'meio',
    imageUrl: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1200&q=80',
    linkUrl: '',
    order: 1,
    isActive: true
  },
  {
    id: 'ban-mid-2',
    title: 'Campanha do Quilo: Alimentos para Acolhimento Comunitário',
    position: 'meio',
    imageUrl: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1200&q=80',
    linkUrl: 'https://wa.me/5511999887766?text=Quero+saber+como+doar+na+Campanha+do+Quilo',
    order: 2,
    isActive: true
  },
  {
    id: 'ban-bot-1',
    title: 'Participe dos Pequenos Grupos nos Lares toda Terça e Quinta',
    position: 'rodape',
    imageUrl: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=80',
    linkUrl: 'https://wa.me/5511999887766?text=Gostaria+de+participar+de+um+Pequeno+Grupo+no+meu+bairro',
    order: 1,
    isActive: true
  }
];

export const INITIAL_SETTINGS: AppSettings = {
  appName: 'Igreja Presbiteriana Central',
  themeColor: '#344E41',
  bibleConfig: {
    apiBaseUrl: 'https://bible-api.com',
    apiKey: '',
    versionName: 'almeida',
    requestTimeoutMs: 6000
  },
  managerEmail: 'gestor@igreja.com.br',
  lastUpdated: new Date().toISOString()
};

// Client Storage API wrapper
export class ChurchStorageService {
  // Church Info
  public static getChurchInfo(): ChurchInfo {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CHURCH_INFO);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Erro ao ler churchInfo do storage:', e);
    }
    ChurchStorageService.saveChurchInfo(INITIAL_CHURCH_INFO);
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
    ChurchStorageService.saveBulletins(INITIAL_BULLETINS);
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
    ChurchStorageService.saveBirthdays(INITIAL_BIRTHDAYS);
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
    ChurchStorageService.saveDeaconSchedules(INITIAL_DEACON_SCHEDULES);
    return INITIAL_DEACON_SCHEDULES;
  }

  public static saveDeaconSchedules(schedules: DeaconScheduleItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.DEACON_SCHEDULES, JSON.stringify(schedules));
      ChurchStorageService.mirrorToIndexedDB(STORAGE_KEYS.DEACON_SCHEDULES, schedules);
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
    ChurchStorageService.saveBanners(INITIAL_BANNERS);
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
    ChurchStorageService.saveSettings(INITIAL_SETTINGS);
    return INITIAL_SETTINGS;
  }

  public static saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Erro ao salvar configurações:', e);
    }
  }

  // Bible Personal Notes (LocalStorage + IndexedDB on user's device)
  public static getInitialNotes(): UserBibleNote[] {
    return [
      {
        id: 'note-sample-1',
        bookAbbrev: 'sl',
        bookName: 'Salmos',
        chapter: 23,
        verse: 1,
        reference: 'Salmos 23:1',
        noteText: 'Lembrar que o cuidado de Deus é constante. Ele é o Bom Pastor que nunca desampara suas ovelhas e provê tudo o que necessitamos.',
        colorTag: '#344E41',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'note-sample-2',
        bookAbbrev: 'sl',
        bookName: 'Salmos',
        chapter: 121,
        verse: 2,
        reference: 'Salmos 121:2',
        noteText: 'Nos momentos de dúvida, olhar para o Criador dos céus e da terra traz descanso e segurança para toda a família.',
        colorTag: '#4A6B5D',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'note-sample-3',
        bookAbbrev: 'fp',
        bookName: 'Filipenses',
        chapter: 4,
        verse: 7,
        reference: 'Filipenses 4:7',
        noteText: 'A paz de Deus guarda o coração e os pensamentos em Cristo Jesus quando apresentamos nossas súplicas em oração.',
        colorTag: '#B08938',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }

  public static getInitialFavorites(): UserFavoriteVerse[] {
    return [
      {
        id: 'fav-1',
        bookAbbrev: 'sl',
        bookName: 'Salmos',
        chapter: 121,
        verse: 2,
        reference: 'Salmos 121:2',
        verseText: 'O meu socorro vem do Senhor, que fez os céus e a terra.',
        savedAt: new Date().toISOString()
      },
      {
        id: 'fav-2',
        bookAbbrev: 'fp',
        bookName: 'Filipenses',
        chapter: 4,
        verse: 13,
        reference: 'Filipenses 4:13',
        verseText: 'Tudo posso naquele que me fortalece.',
        savedAt: new Date().toISOString()
      },
      {
        id: 'fav-3',
        bookAbbrev: 'rm',
        bookName: 'Romanos',
        chapter: 8,
        verse: 28,
        reference: 'Romanos 8:28',
        verseText: 'Sabemos que todas as coisas cooperam para o bem daqueles que amam a Deus, daqueles que são chamados segundo o seu propósito.',
        savedAt: new Date().toISOString()
      }
    ];
  }

  public static getUserNotes(): UserBibleNote[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER_NOTES);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Erro ao ler notas bíblicas:', e);
    }
    const initial = ChurchStorageService.getInitialNotes();
    ChurchStorageService.saveUserNotes(initial);
    return initial;
  }

  public static saveUserNotes(notes: UserBibleNote[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_NOTES, JSON.stringify(notes));
      ChurchStorageService.mirrorToIndexedDB(STORAGE_KEYS.USER_NOTES, notes);
      ChurchStorageService.touchCacheMeta();
    } catch (e) {
      console.error('Erro ao salvar notas bíblicas:', e);
    }
  }

  // Bible Favorites (LocalStorage + IndexedDB on user's device)
  public static getUserFavorites(): UserFavoriteVerse[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER_FAVORITES);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Erro ao ler favoritos:', e);
    }
    const initial = ChurchStorageService.getInitialFavorites();
    ChurchStorageService.saveUserFavorites(initial);
    return initial;
  }

  public static saveUserFavorites(favs: UserFavoriteVerse[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_FAVORITES, JSON.stringify(favs));
      ChurchStorageService.mirrorToIndexedDB(STORAGE_KEYS.USER_FAVORITES, favs);
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
      bookAbbrev: 'sl',
      chapter: 23,
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
        : { bookAbbrev: 'sl', chapter: 23, fontSize: 18, theme: 'light' };
      const updated = { ...current, ...state };
      localStorage.setItem(STORAGE_KEYS.USER_READING_STATE, JSON.stringify(updated));
      ChurchStorageService.mirrorToIndexedDB(STORAGE_KEYS.USER_READING_STATE, updated);
    } catch (e) {
      console.warn('Erro ao salvar estado de leitura:', e);
    }
  }

  // Unsaved Note Draft Cache (so user never loses a note in progress)
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

  // Immediate Boot Cache Initializer: creates local cache as soon as user opens the app
  public static initializeUserCacheOnBoot(): UserCacheMetadata {
    // 1. Ensure all church & user collections exist in localStorage immediately
    const info = ChurchStorageService.getChurchInfo();
    const bulletins = ChurchStorageService.getBulletins();
    const birthdays = ChurchStorageService.getBirthdays();
    const deaconSchedules = ChurchStorageService.getDeaconSchedules();
    const banners = ChurchStorageService.getBanners();
    const settings = ChurchStorageService.getSettings();
    const notes = ChurchStorageService.getUserNotes();
    const favorites = ChurchStorageService.getUserFavorites();
    const readingState = ChurchStorageService.getReadingState();

    // 2. Seed offline Bible chapters cache if not yet present
    let cachedChapters: Record<string, any> = {};
    try {
      const existingChapters = localStorage.getItem(STORAGE_KEYS.BIBLE_CHAPTERS_CACHE);
      if (existingChapters) {
        cachedChapters = JSON.parse(existingChapters);
      } else {
        cachedChapters = { ...FAMOUS_CHAPTERS };
        localStorage.setItem(STORAGE_KEYS.BIBLE_CHAPTERS_CACHE, JSON.stringify(cachedChapters));
      }
    } catch {
      cachedChapters = { ...FAMOUS_CHAPTERS };
    }

    // 3. Create or update cache metadata
    let meta: UserCacheMetadata;
    const now = new Date().toISOString();
    try {
      const rawMeta = localStorage.getItem(STORAGE_KEYS.USER_CACHE_META);
      if (rawMeta) {
        const parsed = JSON.parse(rawMeta) as UserCacheMetadata;
        meta = {
          ...parsed,
          lastSyncedAt: now,
          notesCount: notes.length,
          favoritesCount: favorites.length,
          cachedChaptersCount: Object.keys(cachedChapters).length
        };
      } else {
        meta = {
          deviceId: `ipc-dev-${Math.random().toString(36).substring(2, 10)}`,
          initializedAt: now,
          lastSyncedAt: now,
          notesCount: notes.length,
          favoritesCount: favorites.length,
          cachedChaptersCount: Object.keys(cachedChapters).length
        };
      }
      localStorage.setItem(STORAGE_KEYS.USER_CACHE_META, JSON.stringify(meta));
    } catch {
      meta = {
        deviceId: 'ipc-local',
        initializedAt: now,
        lastSyncedAt: now,
        notesCount: notes.length,
        favoritesCount: favorites.length,
        cachedChaptersCount: Object.keys(cachedChapters).length
      };
    }

    // 4. Mirror to IndexedDB asynchronously for redundant browser persistence
    ChurchStorageService.mirrorToIndexedDB(STORAGE_KEYS.USER_NOTES, notes);
    ChurchStorageService.mirrorToIndexedDB(STORAGE_KEYS.USER_FAVORITES, favorites);
    ChurchStorageService.mirrorToIndexedDB(STORAGE_KEYS.USER_READING_STATE, readingState);
    ChurchStorageService.mirrorToIndexedDB(STORAGE_KEYS.CHURCH_INFO, info);
    ChurchStorageService.mirrorToIndexedDB(STORAGE_KEYS.BULLETINS, bulletins);
    ChurchStorageService.mirrorToIndexedDB(STORAGE_KEYS.BIRTHDAYS, birthdays);
    ChurchStorageService.mirrorToIndexedDB(STORAGE_KEYS.DEACON_SCHEDULES, deaconSchedules);
    ChurchStorageService.mirrorToIndexedDB(STORAGE_KEYS.BANNERS, banners);
    ChurchStorageService.mirrorToIndexedDB(STORAGE_KEYS.SETTINGS, settings);

    // 5. Attempt recovery from IndexedDB if localStorage was ever cleared
    ChurchStorageService.recoverFromIndexedDBIfNeeded();

    return meta;
  }

  public static touchCacheMeta(): UserCacheMetadata {
    const now = new Date().toISOString();
    try {
      const rawMeta = localStorage.getItem(STORAGE_KEYS.USER_CACHE_META);
      const notesRaw = localStorage.getItem(STORAGE_KEYS.USER_NOTES);
      const favsRaw = localStorage.getItem(STORAGE_KEYS.USER_FAVORITES);
      const chapsRaw = localStorage.getItem(STORAGE_KEYS.BIBLE_CHAPTERS_CACHE);

      const notesCount = notesRaw ? JSON.parse(notesRaw).length : 0;
      const favoritesCount = favsRaw ? JSON.parse(favsRaw).length : 0;
      const cachedChaptersCount = chapsRaw ? Object.keys(JSON.parse(chapsRaw)).length : 0;

      const parsed: UserCacheMetadata = rawMeta
        ? JSON.parse(rawMeta)
        : {
            deviceId: `ipc-dev-${Math.random().toString(36).substring(2, 10)}`,
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
        deviceId: 'ipc-local',
        initializedAt: now,
        lastSyncedAt: now,
        notesCount: 0,
        favoritesCount: 0,
        cachedChaptersCount: 0
      };
    }
  }

  public static mirrorToIndexedDB(key: string, value: unknown): void {
    if (typeof window === 'undefined' || !('indexedDB' in window)) return;
    try {
      const request = window.indexedDB.open('ipc_offline_cache_db', 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('kv_store')) {
          db.createObjectStore('kv_store');
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('kv_store', 'readwrite');
        tx.objectStore('kv_store').put(value, key);
      };
    } catch {
      // Ignore IndexedDB errors in restricted contexts
    }
  }

  public static recoverFromIndexedDBIfNeeded(): void {
    if (typeof window === 'undefined' || !('indexedDB' in window)) return;
    try {
      const request = window.indexedDB.open('ipc_offline_cache_db', 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('kv_store')) {
          db.createObjectStore('kv_store');
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('kv_store', 'readonly');
        const store = tx.objectStore('kv_store');
        const getNotes = store.get(STORAGE_KEYS.USER_NOTES);
        getNotes.onsuccess = () => {
          const idbNotes = getNotes.result;
          const localNotesRaw = localStorage.getItem(STORAGE_KEYS.USER_NOTES);
          const localNotes = localNotesRaw ? JSON.parse(localNotesRaw) : [];
          // If IndexedDB has more notes than default seed, restore them
          if (Array.isArray(idbNotes) && idbNotes.length > localNotes.length) {
            localStorage.setItem(STORAGE_KEYS.USER_NOTES, JSON.stringify(idbNotes));
          }
        };
      };
    } catch {
      // Ignore
    }
  }

  // Image compressor using Canvas to avoid crashing localStorage
  public static async compressImageFile(file: File, maxWidth = 1200, quality = 0.82): Promise<string> {
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

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(readerEvent.target?.result as string);
            return;
          }

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
    const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return [];

    // Header check
    const header = lines[0].toLowerCase();
    const delimiter = header.includes(';') ? ';' : ',';

    const parsed: BirthdayPerson[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));
      if (cols.length < 2) continue;

      const name = cols[0];
      if (!name) continue;

      let day = 1;
      let month = 1;
      let year: number | undefined = undefined;

      // Format could be: "15/04/1990", "15/04", or "15" and "4" in separate columns
      if (cols[1].includes('/') || cols[1].includes('-')) {
        const parts = cols[1].split(/[/-]/).map(p => parseInt(p, 10));
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
