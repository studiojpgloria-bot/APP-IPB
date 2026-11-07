import { BibleBook } from '../types';

export const BIBLE_BOOKS: BibleBook[] = [
  // Antigo Testamento
  { id: 'gn', abbrev: 'gn', name: 'Gênesis', testament: 'VT', chaptersCount: 50, group: 'Pentateuco' },
  { id: 'ex', abbrev: 'ex', name: 'Êxodo', testament: 'VT', chaptersCount: 40, group: 'Pentateuco' },
  { id: 'lv', abbrev: 'lv', name: 'Levítico', testament: 'VT', chaptersCount: 27, group: 'Pentateuco' },
  { id: 'nm', abbrev: 'nm', name: 'Números', testament: 'VT', chaptersCount: 36, group: 'Pentateuco' },
  { id: 'dt', abbrev: 'dt', name: 'Deuteronômio', testament: 'VT', chaptersCount: 34, group: 'Pentateuco' },
  { id: 'js', abbrev: 'js', name: 'Josué', testament: 'VT', chaptersCount: 24, group: 'Históricos' },
  { id: 'jz', abbrev: 'jz', name: 'Juízes', testament: 'VT', chaptersCount: 21, group: 'Históricos' },
  { id: 'rt', abbrev: 'rt', name: 'Rute', testament: 'VT', chaptersCount: 4, group: 'Históricos' },
  { id: '1sm', abbrev: '1sm', name: '1 Samuel', testament: 'VT', chaptersCount: 31, group: 'Históricos' },
  { id: '2sm', abbrev: '2sm', name: '2 Samuel', testament: 'VT', chaptersCount: 24, group: 'Históricos' },
  { id: '1rs', abbrev: '1rs', name: '1 Reis', testament: 'VT', chaptersCount: 22, group: 'Históricos' },
  { id: '2rs', abbrev: '2rs', name: '2 Reis', testament: 'VT', chaptersCount: 25, group: 'Históricos' },
  { id: '1cr', abbrev: '1cr', name: '1 Crônicas', testament: 'VT', chaptersCount: 29, group: 'Históricos' },
  { id: '2cr', abbrev: '2cr', name: '2 Crônicas', testament: 'VT', chaptersCount: 36, group: 'Históricos' },
  { id: 'ed', abbrev: 'ed', name: 'Esdras', testament: 'VT', chaptersCount: 10, group: 'Históricos' },
  { id: 'ne', abbrev: 'ne', name: 'Neemias', testament: 'VT', chaptersCount: 13, group: 'Históricos' },
  { id: 'et', abbrev: 'et', name: 'Ester', testament: 'VT', chaptersCount: 10, group: 'Históricos' },
  { id: 'job', abbrev: 'job', name: 'Jó', testament: 'VT', chaptersCount: 42, group: 'Poéticos' },
  { id: 'sl', abbrev: 'sl', name: 'Salmos', testament: 'VT', chaptersCount: 150, group: 'Poéticos' },
  { id: 'pv', abbrev: 'pv', name: 'Provérbios', testament: 'VT', chaptersCount: 31, group: 'Poéticos' },
  { id: 'ec', abbrev: 'ec', name: 'Eclesiastes', testament: 'VT', chaptersCount: 12, group: 'Poéticos' },
  { id: 'ct', abbrev: 'ct', name: 'Cânticos', testament: 'VT', chaptersCount: 8, group: 'Poéticos' },
  { id: 'is', abbrev: 'is', name: 'Isaías', testament: 'VT', chaptersCount: 66, group: 'Profetas Maiores' },
  { id: 'jr', abbrev: 'jr', name: 'Jeremias', testament: 'VT', chaptersCount: 52, group: 'Profetas Maiores' },
  { id: 'lm', abbrev: 'lm', name: 'Lamentações', testament: 'VT', chaptersCount: 5, group: 'Profetas Maiores' },
  { id: 'ez', abbrev: 'ez', name: 'Ezequiel', testament: 'VT', chaptersCount: 48, group: 'Profetas Maiores' },
  { id: 'dn', abbrev: 'dn', name: 'Daniel', testament: 'VT', chaptersCount: 12, group: 'Profetas Maiores' },
  { id: 'os', abbrev: 'os', name: 'Oséias', testament: 'VT', chaptersCount: 14, group: 'Profetas Menores' },
  { id: 'jl', abbrev: 'jl', name: 'Joel', testament: 'VT', chaptersCount: 3, group: 'Profetas Menores' },
  { id: 'am', abbrev: 'am', name: 'Amós', testament: 'VT', chaptersCount: 9, group: 'Profetas Menores' },
  { id: 'ob', abbrev: 'ob', name: 'Obadias', testament: 'VT', chaptersCount: 1, group: 'Profetas Menores' },
  { id: 'jn', abbrev: 'jn', name: 'Jonas', testament: 'VT', chaptersCount: 4, group: 'Profetas Menores' },
  { id: 'mq', abbrev: 'mq', name: 'Miquéias', testament: 'VT', chaptersCount: 7, group: 'Profetas Menores' },
  { id: 'na', abbrev: 'na', name: 'Naum', testament: 'VT', chaptersCount: 3, group: 'Profetas Menores' },
  { id: 'hc', abbrev: 'hc', name: 'Habacuque', testament: 'VT', chaptersCount: 3, group: 'Profetas Menores' },
  { id: 'sf', abbrev: 'sf', name: 'Sofonias', testament: 'VT', chaptersCount: 3, group: 'Profetas Menores' },
  { id: 'ag', abbrev: 'ag', name: 'Ageu', testament: 'VT', chaptersCount: 2, group: 'Profetas Menores' },
  { id: 'zc', abbrev: 'zc', name: 'Zacarias', testament: 'VT', chaptersCount: 14, group: 'Profetas Menores' },
  { id: 'ml', abbrev: 'ml', name: 'Malaquias', testament: 'VT', chaptersCount: 4, group: 'Profetas Menores' },

  // Novo Testamento
  { id: 'mt', abbrev: 'mt', name: 'Mateus', testament: 'NT', chaptersCount: 28, group: 'Evangelhos' },
  { id: 'mc', abbrev: 'mc', name: 'Marcos', testament: 'NT', chaptersCount: 16, group: 'Evangelhos' },
  { id: 'lc', abbrev: 'lc', name: 'Lucas', testament: 'NT', chaptersCount: 24, group: 'Evangelhos' },
  { id: 'jo', abbrev: 'jo', name: 'João', testament: 'NT', chaptersCount: 21, group: 'Evangelhos' },
  { id: 'at', abbrev: 'at', name: 'Atos', testament: 'NT', chaptersCount: 28, group: 'Histórico' },
  { id: 'rm', abbrev: 'rm', name: 'Romanos', testament: 'NT', chaptersCount: 16, group: 'Cartas Paulinas' },
  { id: '1co', abbrev: '1co', name: '1 Coríntios', testament: 'NT', chaptersCount: 16, group: 'Cartas Paulinas' },
  { id: '2co', abbrev: '2co', name: '2 Coríntios', testament: 'NT', chaptersCount: 13, group: 'Cartas Paulinas' },
  { id: 'gl', abbrev: 'gl', name: 'Gálatas', testament: 'NT', chaptersCount: 6, group: 'Cartas Paulinas' },
  { id: 'ef', abbrev: 'ef', name: 'Efésios', testament: 'NT', chaptersCount: 6, group: 'Cartas Paulinas' },
  { id: 'fp', abbrev: 'fp', name: 'Filipenses', testament: 'NT', chaptersCount: 4, group: 'Cartas Paulinas' },
  { id: 'cl', abbrev: 'cl', name: 'Colossenses', testament: 'NT', chaptersCount: 4, group: 'Cartas Paulinas' },
  { id: '1ts', abbrev: '1ts', name: '1 Tessalonicenses', testament: 'NT', chaptersCount: 5, group: 'Cartas Paulinas' },
  { id: '2ts', abbrev: '2ts', name: '2 Tessalonicenses', testament: 'NT', chaptersCount: 3, group: 'Cartas Paulinas' },
  { id: '1tm', abbrev: '1tm', name: '1 Timóteo', testament: 'NT', chaptersCount: 6, group: 'Cartas Pastorais' },
  { id: '2tm', abbrev: '2tm', name: '2 Timóteo', testament: 'NT', chaptersCount: 4, group: 'Cartas Pastorais' },
  { id: 'tt', abbrev: 'tt', name: 'Tito', testament: 'NT', chaptersCount: 3, group: 'Cartas Pastorais' },
  { id: 'fm', abbrev: 'fm', name: 'Filemom', testament: 'NT', chaptersCount: 1, group: 'Cartas Pastorais' },
  { id: 'hb', abbrev: 'hb', name: 'Hebreus', testament: 'NT', chaptersCount: 13, group: 'Cartas Gerais' },
  { id: 'tg', abbrev: 'tg', name: 'Tiago', testament: 'NT', chaptersCount: 5, group: 'Cartas Gerais' },
  { id: '1pe', abbrev: '1pe', name: '1 Pedro', testament: 'NT', chaptersCount: 5, group: 'Cartas Gerais' },
  { id: '2pe', abbrev: '2pe', name: '2 Pedro', testament: 'NT', chaptersCount: 3, group: 'Cartas Gerais' },
  { id: '1jo', abbrev: '1jo', name: '1 João', testament: 'NT', chaptersCount: 5, group: 'Cartas Gerais' },
  { id: '2jo', abbrev: '2jo', name: '2 João', testament: 'NT', chaptersCount: 1, group: 'Cartas Gerais' },
  { id: '3jo', abbrev: '3jo', name: '3 João', testament: 'NT', chaptersCount: 1, group: 'Cartas Gerais' },
  { id: 'jd', abbrev: 'jd', name: 'Judas', testament: 'NT', chaptersCount: 1, group: 'Cartas Gerais' },
  { id: 'ap', abbrev: 'ap', name: 'Apocalipse', testament: 'NT', chaptersCount: 22, group: 'Profecia' }
];

export interface BibleSearchResult {
  reference: string;
  bookAbbrev: string;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface ParsedBibleReference {
  book: BibleBook;
  chapter: number;
  verse?: number;
}

export function normalizeBibleString(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

const BOOK_SYNONYMS: Record<string, string> = {
  gen: 'gn',
  genesis: 'gn',
  exo: 'ex',
  exodo: 'ex',
  lev: 'lv',
  levitico: 'lv',
  num: 'nm',
  numeros: 'nm',
  deu: 'dt',
  deut: 'dt',
  deuteronomio: 'dt',
  jos: 'js',
  josue: 'js',
  jui: 'jz',
  juizes: 'jz',
  rut: 'rt',
  rute: 'rt',
  '1sam': '1sm',
  '1samuel': '1sm',
  '1 samuel': '1sm',
  '1 sm': '1sm',
  '2sam': '2sm',
  '2samuel': '2sm',
  '2 samuel': '2sm',
  '2 sm': '2sm',
  '1re': '1rs',
  '1reis': '1rs',
  '1 reis': '1rs',
  '1 rs': '1rs',
  '2re': '2rs',
  '2reis': '2rs',
  '2 reis': '2rs',
  '2 rs': '2rs',
  '1cro': '1cr',
  '1cronicas': '1cr',
  '1 cronicas': '1cr',
  '1 cr': '1cr',
  '2cro': '2cr',
  '2cronicas': '2cr',
  '2 cronicas': '2cr',
  '2 cr': '2cr',
  esd: 'ed',
  esdras: 'ed',
  nee: 'ne',
  neemias: 'ne',
  est: 'et',
  ester: 'et',
  job: 'job',
  sal: 'sl',
  salmo: 'sl',
  salmos: 'sl',
  pro: 'pv',
  prov: 'pv',
  proverbios: 'pv',
  ecl: 'ec',
  eclesiastes: 'ec',
  can: 'ct',
  cantares: 'ct',
  canticos: 'ct',
  'cantico dos canticos': 'ct',
  isa: 'is',
  isaias: 'is',
  jer: 'jr',
  jeremias: 'jr',
  lam: 'lm',
  lamentacoes: 'lm',
  'lamentacoes de jeremias': 'lm',
  eze: 'ez',
  ezequiel: 'ez',
  dan: 'dn',
  daniel: 'dn',
  ose: 'os',
  oseias: 'os',
  joe: 'jl',
  joel: 'jl',
  amo: 'am',
  amos: 'am',
  oba: 'ob',
  obadias: 'ob',
  jon: 'jn',
  jonas: 'jn',
  miq: 'mq',
  miqueias: 'mq',
  nau: 'na',
  naum: 'na',
  hab: 'hc',
  habacuque: 'hc',
  sof: 'sf',
  sofonias: 'sf',
  age: 'ag',
  ageu: 'ag',
  zac: 'zc',
  zacarias: 'zc',
  mal: 'ml',
  malaquias: 'ml',
  mat: 'mt',
  mateus: 'mt',
  mar: 'mc',
  marcos: 'mc',
  luc: 'lc',
  lucas: 'lc',
  joa: 'jo',
  joao: 'jo',
  ato: 'at',
  atos: 'at',
  'atos dos apostolos': 'at',
  rom: 'rm',
  romanos: 'rm',
  '1cor': '1co',
  '1corintios': '1co',
  '1 corintios': '1co',
  '1 co': '1co',
  '2cor': '2co',
  '2corintios': '2co',
  '2 corintios': '2co',
  '2 co': '2co',
  gal: 'gl',
  galatas: 'gl',
  efe: 'ef',
  efesios: 'ef',
  fil: 'fp',
  filipenses: 'fp',
  col: 'cl',
  colossenses: 'cl',
  '1tes': '1ts',
  '1tessalonicenses': '1ts',
  '1 tessalonicenses': '1ts',
  '1 ts': '1ts',
  '2tes': '2ts',
  '2tessalonicenses': '2ts',
  '2 tessalonicenses': '2ts',
  '2 ts': '2ts',
  '1tim': '1tm',
  '1timoteo': '1tm',
  '1 timoteo': '1tm',
  '1 tm': '1tm',
  '2tim': '2tm',
  '2timoteo': '2tm',
  '2 timoteo': '2tm',
  '2 tm': '2tm',
  tit: 'tt',
  tito: 'tt',
  flm: 'fm',
  filemom: 'fm',
  filemon: 'fm',
  heb: 'hb',
  hebreus: 'hb',
  tia: 'tg',
  tiago: 'tg',
  '1ped': '1pe',
  '1pedro': '1pe',
  '1 pedro': '1pe',
  '1 pe': '1pe',
  '2ped': '2pe',
  '2pedro': '2pe',
  '2 pedro': '2pe',
  '2 pe': '2pe',
  '1joa': '1jo',
  '1joao': '1jo',
  '1 joao': '1jo',
  '1 jo': '1jo',
  '2joa': '2jo',
  '2joao': '2jo',
  '2 joao': '2jo',
  '2 jo': '2jo',
  '3joa': '3jo',
  '3joao': '3jo',
  '3 joao': '3jo',
  '3 jo': '3jo',
  jud: 'jd',
  judas: 'jd',
  apo: 'ap',
  apoc: 'ap',
  apocalipse: 'ap'
};

export function findBibleBookByQuery(rawBookName: string): BibleBook | null {
  const trimmed = rawBookName.trim().replace(/\.$/, '');
  if (!trimmed) return null;

  // Distinguish "Jó" (with acute accent) from "Jo" (abbreviation for João)
  if (/^j[óo]$/i.test(trimmed)) {
    if (trimmed.toLowerCase() === 'jó') {
      return BIBLE_BOOKS.find((b) => b.abbrev === 'job') || null;
    }
    return BIBLE_BOOKS.find((b) => b.abbrev === 'jo') || null;
  }

  const norm = normalizeBibleString(trimmed).replace(/\s+/g, ' ');
  const compact = norm.replace(/\s+/g, '');

  const directAbbrev = BOOK_SYNONYMS[norm] || BOOK_SYNONYMS[compact];
  if (directAbbrev) {
    return BIBLE_BOOKS.find((b) => b.abbrev === directAbbrev) || null;
  }

  // Exact match by abbrev or normalized name
  const exact = BIBLE_BOOKS.find(
    (b) =>
      b.abbrev.toLowerCase() === compact ||
      normalizeBibleString(b.name) === norm ||
      normalizeBibleString(b.name).replace(/\s+/g, '') === compact
  );
  if (exact) return exact;

  // Prefix match if at least 3 chars
  if (norm.length >= 3) {
    const prefixMatch = BIBLE_BOOKS.find(
      (b) =>
        normalizeBibleString(b.name).startsWith(norm) ||
        normalizeBibleString(b.name).replace(/\s+/g, '').startsWith(compact)
    );
    if (prefixMatch) return prefixMatch;
  }

  return null;
}

/**
 * Parses references like:
 * - "João 3"
 * - "João 3:16"
 * - "Jo 3.16"
 * - "1 Coríntios 13"
 * - "1Co 13:4"
 * - "Salmos 119"
 * - "Mateus 5"
 */
export function parseBibleReference(query: string): ParsedBibleReference | null {
  if (!query || !query.trim()) return null;
  const cleaned = query.trim().replace(/\s+/g, ' ');

  // Pattern: optional leading number (1, 2, 3) + book name + chapter + optional (: or . or ,) + verse
  const match = cleaned.match(/^((?:[123]\s*)?[a-zA-ZÀ-ÿ.]+(?:\s+[a-zA-ZÀ-ÿ.]+)*)\s+(\d+)(?:[:.,](\d+))?$/);
  if (!match) {
    // Also support compact format like "Jo3:16" or "1Co13"
    const compactMatch = cleaned.match(/^((?:[123]\s*)?[a-zA-ZÀ-ÿ]+)(\d+)(?:[:.,](\d+))?$/);
    if (!compactMatch) return null;
    const book = findBibleBookByQuery(compactMatch[1]);
    if (!book) return null;
    const chapter = parseInt(compactMatch[2], 10);
    if (isNaN(chapter) || chapter < 1 || chapter > book.chaptersCount) return null;
    const verse = compactMatch[3] ? parseInt(compactMatch[3], 10) : undefined;
    return { book, chapter, verse };
  }

  const bookPart = match[1];
  const chapter = parseInt(match[2], 10);
  const verse = match[3] ? parseInt(match[3], 10) : undefined;

  const book = findBibleBookByQuery(bookPart);
  if (!book) return null;
  if (isNaN(chapter) || chapter < 1 || chapter > book.chaptersCount) return null;

  return { book, chapter, verse };
}
