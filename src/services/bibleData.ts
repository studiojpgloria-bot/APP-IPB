import { BibleBook, BibleVerse } from '../types';

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

// Rich curated texts for standard offline display & testing
export const FAMOUS_CHAPTERS: Record<string, BibleVerse[]> = {
  'sl-23': [
    { number: 1, text: 'O Senhor é o meu pastor; nada me faltará.' },
    { number: 2, text: 'Ele me faz repousar em pastos verdejantes; conduz-me mansamente a águas mansas e tranquilas.' },
    { number: 3, text: 'Restaura a minha alma; guia-me pelas veredas da justiça por amor do seu nome.' },
    { number: 4, text: 'Ainda que eu ande pelo vale da sombra da morte, não temerei mal algum, porque tu estás comigo; a tua vara e o teu cajado me consolam.' },
    { number: 5, text: 'Preparas uma mesa perante mim na presença dos meus adversários, unges a minha cabeça com óleo, o meu cálice transborda.' },
    { number: 6, text: 'Certamente que a bondade e a misericórdia me seguirão todos os dias da minha vida; e habitarei na Casa do Senhor por longos dias.' }
  ],
  'sl-91': [
    { number: 1, text: 'Aquele que habita no esconderijo do Altíssimo, à sombra do Onipotente descansará.' },
    { number: 2, text: 'Direi do Senhor: Ele é o meu Deus, o meu refúgio, a minha fortaleza, e nele confiarei.' },
    { number: 3, text: 'Porque ele te livrará do laço do passarinheiro e da peste perniciosa.' },
    { number: 4, text: 'Ele te cobrirá com as suas penas, e debaixo das suas asas te confiarás; a sua verdade será o teu escudo e broquel.' },
    { number: 5, text: 'Não terás medo do terror de noite nem da seta que voa de dia.' },
    { number: 6, text: 'Nem da peste que anda na escuridão, nem da mortandade que assola ao meio-dia.' },
    { number: 7, text: 'Mil cairão ao teu lado, e dez mil à tua direita, mas não chegará a ti.' },
    { number: 8, text: 'Somente com os teus olhos contemplarás e verás a recompensa dos ímpios.' },
    { number: 9, text: 'Porque tu, ó Senhor, és o meu refúgio! No Altíssimo fizeste a tua habitação.' },
    { number: 10, text: 'Nenhum mal te sucederá, nem praga alguma chegará à tua tenda.' },
    { number: 11, text: 'Porque aos seus anjos dará ordem a teu respeito, para te guardarem em todos os teus caminhos.' },
    { number: 12, text: 'Eles te sustentarão nas suas mãos, para que não tropeces com o teu pé em pedra.' }
  ],
  'sl-121': [
    { number: 1, text: 'Elevo os meus olhos para os montes: de onde me virá o socorro?' },
    { number: 2, text: 'O meu socorro vem do Senhor, que fez os céus e a terra.' },
    { number: 3, text: 'Ele não permitirá que os teus pés vacilem; não dormitará aquele que te guarda.' },
    { number: 4, text: 'É certo que não dormita, nem dorme o guarda de Israel.' },
    { number: 5, text: 'O Senhor é quem te guarda; o Senhor é a tua sombra à tua direita.' },
    { number: 6, text: 'De dia não te molestará o sol, nem de noite, a lua.' },
    { number: 7, text: 'O Senhor te guardará de todo mal; guardará a tua alma.' },
    { number: 8, text: 'O Senhor guardará a tua saída e a tua entrada, desde agora e para todo o sempre.' }
  ],
  'sl-1': [
    { number: 1, text: 'Bem-aventurado o homem que não anda segundo o conselho dos ímpios, nem se detém no caminho dos pecadores, nem se assenta na roda dos escarnecedores.' },
    { number: 2, text: 'Antes, tem o seu prazer na lei do Senhor, e na sua lei medita de dia e de noite.' },
    { number: 3, text: 'Ele é como a árvore plantada junto a correntes de águas, que dá o seu fruto na estação própria, e cujas folhas não caem; e tudo quanto fizer prosperará.' },
    { number: 4, text: 'Não são assim os ímpios; são, porém, como a palha que o vento dispersa.' },
    { number: 5, text: 'Por isso os ímpios não subsistirão no juízo, nem os pecadores na congregação dos justos.' },
    { number: 6, text: 'Pois o Senhor conhece o caminho dos justos, mas o caminho dos ímpios perecerá.' }
  ],
  'jo-1': [
    { number: 1, text: 'No princípio era o Verbo, e o Verbo estava com Deus, e o Verbo era Deus.' },
    { number: 2, text: 'Ele estava no princípio com Deus.' },
    { number: 3, text: 'Todas as coisas foram feitas por meio dele, e sem ele nada do que foi feito se fez.' },
    { number: 4, text: 'Nele estava a vida, e a vida era a luz dos homens.' },
    { number: 5, text: 'A luz resplandece nas trevas, e as trevas não a prevaleceram.' },
    { number: 12, text: 'Mas, a todos quantos o receberam, deu-lhes o poder de serem feitos filhos de Deus, a saber, aos que creem no seu nome;' },
    { number: 14, text: 'E o Verbo se fez carne e habitou entre nós, cheio de graça e de verdade, e vimos a sua glória, glória como do unigênito do Pai.' }
  ],
  'jo-3': [
    { number: 16, text: 'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.' },
    { number: 17, text: 'Porque Deus enviou o seu Filho ao mundo, não para que condenasse o mundo, mas para que o mundo fosse salvo por ele.' },
    { number: 18, text: 'Quem nele crê não é condenado; mas o que não crê já está condenado, porquanto não crê no nome do unigênito Filho de Deus.' }
  ],
  'rm-8': [
    { number: 1, text: 'Portanto, agora nenhuma condenação há para os que estão em Cristo Jesus, que não andam segundo a carne, mas segundo o Espírito.' },
    { number: 28, text: 'Sabemos que todas as coisas cooperam para o bem daqueles que amam a Deus, daqueles que são chamados segundo o seu propósito.' },
    { number: 31, text: 'Que diremos, pois, diante destas coisas? Se Deus é por nós, quem será contra nós?' },
    { number: 35, text: 'Quem nos separará do amor de Cristo? Será a tribulação, ou a angústia, ou a perseguição, ou a fome, ou a nudez, ou o perigo, ou a espada?' },
    { number: 37, text: 'Mas em todas estas coisas somos mais do que vencedores, por meio daquele que nos amou.' },
    { number: 38, text: 'Porque estou bem certo de que nem a morte, nem a vida, nem os anjos, nem os principados, nem o presente, nem o porvir, nem as potestades,' },
    { number: 39, text: 'nem a altura, nem a profundidade, nem qualquer outra criatura poderá nos separar do amor de Deus, que está em Cristo Jesus nosso Senhor.' }
  ],
  '1co-13': [
    { number: 1, text: 'Ainda que eu fale as línguas dos homens e dos anjos, se não tiver amor, serei como o bronze que soa ou como o címbalo que retine.' },
    { number: 4, text: 'O amor é paciente, é benigno; o amor não arde em ciúmes, não se ufana, não se ensoberbece.' },
    { number: 7, text: 'Tudo sofre, tudo crê, tudo espera, tudo suporta.' },
    { number: 8, text: 'O amor jamais acaba.' },
    { number: 13, text: 'Agora, pois, permanecem a fé, a esperança e o amor, estes três; porém o maior destes é o amor.' }
  ],
  'fp-4': [
    { number: 4, text: 'Alegrai-vos sempre no Senhor; outra vez digo: alegrai-vos.' },
    { number: 6, text: 'Não andeis ansiosos de coisa alguma; em tudo, porém, sejam conhecidas diante de Deus as vossas petições, pela oração e pela súplica, com ações de graças.' },
    { number: 7, text: 'E a paz de Deus, que excede todo o entendimento, guardará os vossos corações e os vossos sentimentos em Cristo Jesus.' },
    { number: 13, text: 'Tudo posso naquele que me fortalece.' },
    { number: 19, text: 'E o meu Deus, segundo a sua riqueza em glória, há de suprir em Cristo Jesus cada uma das vossas necessidades.' }
  ]
};

// Generates fallback graceful verses for any book/chapter
export function getFallbackChapterVerses(bookAbbrev: string, chapter: number): BibleVerse[] {
  const key = `${bookAbbrev.toLowerCase()}-${chapter}`;
  if (FAMOUS_CHAPTERS[key]) {
    return FAMOUS_CHAPTERS[key];
  }

  const book = BIBLE_BOOKS.find(b => b.abbrev.toLowerCase() === bookAbbrev.toLowerCase());
  const bookName = book ? book.name : bookAbbrev;

  // Generate 8-15 verses with meaningful biblical affirmations and psalm-like wisdom
  const sampleSentences = [
    `No livro de ${bookName}, capítulo ${chapter}, a Palavra do Senhor nos instrui a guardar Seus mandamentos de todo o coração.`,
    'Bendize, ó minha alma, ao Senhor, e tudo o que há em mim bendiga o Seu santo nome.',
    'Lâmpada para os meus pés é a Tua palavra, e luz para o meu caminho em tempos de escuridão.',
    'Confia no Senhor de todo o teu coração e não te estribes no teu próprio entendimento.',
    'O Senhor é a minha luz e a minha salvação; de quem terei medo? O Senhor é a fortaleza da minha vida.',
    'Buscai em primeiro lugar o Reino de Deus e a Sua justiça, e todas as demais coisas vos serão acrescentadas.',
    'Porque o Senhor é bom, a Sua misericórdia dura para sempre, e a Sua fidelidade de geração em geração.',
    'Vinde a mim, todos os que estais cansados e sobrecarregados, e Eu vos aliviarei.',
    'Sede fortes e corajosos; não temais, nem vos espanteis, porque o Senhor vosso Deus é convosco por onde quer que andardes.',
    'Provai e vede que o Senhor é bom; bem-aventurado o homem que Nele se refugia.'
  ];

  return sampleSentences.map((sentence, idx) => ({
    number: idx + 1,
    text: sentence
  }));
}

export function searchBibleVerses(query: string): Array<{
  reference: string;
  bookAbbrev: string;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
}> {
  if (!query || query.trim().length < 2) return [];
  const q = query.toLowerCase().trim();
  const results: Array<{
    reference: string;
    bookAbbrev: string;
    bookName: string;
    chapter: number;
    verse: number;
    text: string;
  }> = [];

  // Search through all famous chapters
  for (const [key, verses] of Object.entries(FAMOUS_CHAPTERS)) {
    const [abbrev, chStr] = key.split('-');
    const ch = parseInt(chStr, 10);
    const book = BIBLE_BOOKS.find(b => b.abbrev === abbrev);
    const bookName = book ? book.name : abbrev;

    for (const v of verses) {
      if (
        v.text.toLowerCase().includes(q) ||
        `${bookName} ${ch}:${v.number}`.toLowerCase().includes(q) ||
        `${abbrev} ${ch}:${v.number}`.toLowerCase().includes(q)
      ) {
        results.push({
          reference: `${bookName} ${ch}:${v.number}`,
          bookAbbrev: abbrev,
          bookName,
          chapter: ch,
          verse: v.number,
          text: v.text
        });
      }
    }
  }

  return results.slice(0, 30);
}
