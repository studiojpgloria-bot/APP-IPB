import React, { useEffect, useState } from 'react';
import {
  AArrowDown,
  AArrowUp,
  Bookmark,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Database,
  Download,
  Edit3,
  Heart,
  Moon,
  Plus,
  Search,
  Share2,
  Sun,
  Trash2,
  Upload,
  X
} from 'lucide-react';
import { useChurch } from '../../context/ChurchContext';
import { BibleApiService } from '../../services/bibleApi';
import { BIBLE_BOOKS, searchBibleVerses } from '../../services/bibleData';
import { ChurchStorageService } from '../../services/storage';
import { BibleBook, BibleVerse } from '../../types';

type BibleTab = 'read' | 'notes' | 'favorites';
type ReadingTheme = 'light' | 'sepia' | 'dark';

const NOTE_COLORS = [
  { hex: '#344E41', label: 'Verde Sálvia' },
  { hex: '#B08938', label: 'Dourado Ocre' },
  { hex: '#2B5B84', label: 'Azul Sereno' },
  { hex: '#8C4A32', label: 'Terracota' }
];

export const BibleView: React.FC = () => {
  const {
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
    isMobileAppPreview,
    showToast,
    settings,
    askConfirmation
  } = useChurch();

  // Active Tab
  const [activeTab, setActiveTab] = useState<BibleTab>('read');

  // Initialize from cached reading state so user never loses their reading position
  const initialReadingState = ChurchStorageService.getReadingState();

  const [selectedBook, setSelectedBook] = useState<BibleBook>(
    () =>
      BIBLE_BOOKS.find((b) => b.abbrev.toLowerCase() === initialReadingState.bookAbbrev.toLowerCase()) ||
      BIBLE_BOOKS.find((b) => b.abbrev === 'sl') ||
      BIBLE_BOOKS[0]
  );
  const [selectedChapter, setSelectedChapter] = useState<number>(() => initialReadingState.chapter || 23);
  const [testamentFilter, setTestamentFilter] = useState<'ALL' | 'VT' | 'NT'>('ALL');
  const [bookSelectorOpen, setBookSelectorOpen] = useState(false);
  const [chapterSelectorOpen, setChapterSelectorOpen] = useState(false);

  // Chapter Content & Loading State
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [isLoadingVerses, setIsLoadingVerses] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ReturnType<typeof searchBibleVerses>>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Reader Customization (Font size & theme) restored from cache
  const [fontSize, setFontSize] = useState<number>(() => initialReadingState.fontSize || 18);
  const [theme, setTheme] = useState<ReadingTheme>(() => initialReadingState.theme || 'light');

  // Note Modal State
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteTargetVerse, setNoteTargetVerse] = useState<{
    bookAbbrev: string;
    bookName: string;
    chapter: number;
    verse: number;
    verseText: string;
  } | null>(null);
  const [noteInputText, setNoteInputText] = useState('');
  const [noteColorTag, setNoteColorTag] = useState('#344E41');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [savedDraftBanner, setSavedDraftBanner] = useState(() => ChurchStorageService.getNoteDraft());

  // Search Notes query
  const [notesFilterQuery, setNotesFilterQuery] = useState('');

  // Persist reading state (book, chapter, fontSize, theme) automatically to cache
  useEffect(() => {
    ChurchStorageService.saveReadingState({
      bookAbbrev: selectedBook.abbrev,
      chapter: selectedChapter,
      fontSize,
      theme
    });
  }, [selectedBook.abbrev, selectedChapter, fontSize, theme]);

  // Load verses whenever book or chapter changes
  useEffect(() => {
    let isMounted = true;
    setIsLoadingVerses(true);

    BibleApiService.fetchChapter(selectedBook.abbrev, selectedChapter)
      .then((data) => {
        if (isMounted) {
          setVerses(data.verses);
          setIsLoadingVerses(false);
        }
      })
      .catch((err) => {
        console.error('Erro ao carregar versículos:', err);
        if (isMounted) setIsLoadingVerses(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedBook.abbrev, selectedChapter]);

  // Handle Search
  const handleExecuteSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const results = searchBibleVerses(searchQuery);
    setSearchResults(results);
  };

  const handleSelectSearchResult = (res: {
    bookAbbrev: string;
    chapter: number;
    verse: number;
  }) => {
    const book = BIBLE_BOOKS.find((b) => b.abbrev.toLowerCase() === res.bookAbbrev.toLowerCase());
    if (book) {
      setSelectedBook(book);
      setSelectedChapter(res.chapter);
      setActiveTab('read');
      setIsSearching(false);
      setSearchQuery('');
    }
  };

  // Chapter Navigation
  const handlePrevChapter = () => {
    if (selectedChapter > 1) {
      setSelectedChapter((c) => c - 1);
    } else {
      // Previous book
      const currentIndex = BIBLE_BOOKS.findIndex((b) => b.id === selectedBook.id);
      if (currentIndex > 0) {
        const prevBook = BIBLE_BOOKS[currentIndex - 1];
        setSelectedBook(prevBook);
        setSelectedChapter(prevBook.chaptersCount);
      }
    }
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const handleNextChapter = () => {
    if (selectedChapter < selectedBook.chaptersCount) {
      setSelectedChapter((c) => c + 1);
    } else {
      // Next book
      const currentIndex = BIBLE_BOOKS.findIndex((b) => b.id === selectedBook.id);
      if (currentIndex < BIBLE_BOOKS.length - 1) {
        const nextBook = BIBLE_BOOKS[currentIndex + 1];
        setSelectedBook(nextBook);
        setSelectedChapter(1);
      }
    }
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  // Open Note Modal for a Verse
  const handleOpenNoteModal = (verseNum: number, verseText: string) => {
    const existing = notes.find(
      (n) => n.bookAbbrev === selectedBook.abbrev && n.chapter === selectedChapter && n.verse === verseNum
    );

    setNoteTargetVerse({
      bookAbbrev: selectedBook.abbrev,
      bookName: selectedBook.name,
      chapter: selectedChapter,
      verse: verseNum,
      verseText
    });

    if (existing) {
      setEditingNoteId(existing.id);
      setNoteInputText(existing.noteText);
      setNoteColorTag(existing.colorTag || '#344E41');
    } else {
      setEditingNoteId(null);
      const draft = ChurchStorageService.getNoteDraft();
      if (
        draft &&
        draft.bookAbbrev === selectedBook.abbrev &&
        draft.chapter === selectedChapter &&
        draft.verse === verseNum
      ) {
        setNoteInputText(draft.text);
      } else {
        setNoteInputText('');
      }
      setNoteColorTag('#344E41');
    }
    setNoteModalOpen(true);
  };

  const handleNoteTextChange = (val: string) => {
    setNoteInputText(val);
    if (noteTargetVerse && !editingNoteId) {
      const draftObj = {
        bookAbbrev: noteTargetVerse.bookAbbrev,
        chapter: noteTargetVerse.chapter,
        verse: noteTargetVerse.verse,
        text: val
      };
      ChurchStorageService.saveNoteDraft(draftObj);
      setSavedDraftBanner(val.trim() ? draftObj : null);
    }
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInputText.trim() || !noteTargetVerse) return;

    if (editingNoteId) {
      updateNote(editingNoteId, noteInputText.trim(), noteColorTag);
    } else {
      addNote({
        bookAbbrev: noteTargetVerse.bookAbbrev,
        bookName: noteTargetVerse.bookName,
        chapter: noteTargetVerse.chapter,
        verse: noteTargetVerse.verse,
        reference: `${noteTargetVerse.bookName} ${noteTargetVerse.chapter}:${noteTargetVerse.verse}`,
        noteText: noteInputText.trim(),
        colorTag: noteColorTag
      });
    }

    ChurchStorageService.saveNoteDraft(null);
    setSavedDraftBanner(null);
    setNoteModalOpen(false);
    setNoteInputText('');
    setEditingNoteId(null);
  };

  const handleCopyVerse = (verseNum: number, text: string) => {
    const content = `"${text}" (${selectedBook.name} ${selectedChapter}:${verseNum})`;
    navigator.clipboard.writeText(content);
    showToast('Versículo copiado com sucesso!');
  };

  // Theme styling helpers
  const themeClasses = {
    light: 'bg-[#FAF9F6] text-stone-900',
    sepia: 'bg-[#F4ECD8] text-[#3D3325]',
    dark: 'bg-[#1C1F1E] text-stone-200'
  };

  const filteredBooks = BIBLE_BOOKS.filter((b) => {
    if (testamentFilter === 'ALL') return true;
    return b.testament === testamentFilter;
  });

  const filteredNotes = notes.filter((n) => {
    if (!notesFilterQuery.trim()) return true;
    const q = notesFilterQuery.toLowerCase();
    return (
      n.reference.toLowerCase().includes(q) ||
      n.noteText.toLowerCase().includes(q) ||
      n.bookName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4 pb-12">
      {/* 1. Header & Navigation Tabs */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/90 shadow-xs space-y-4">
        <div
          className={`flex gap-3 ${
            isMobileAppPreview
              ? 'flex-col'
              : 'flex-col sm:flex-row sm:items-center justify-between'
          }`}
        >
          <div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#344E41] shrink-0" />
              <span>Bíblia Sagrada</span>
            </h1>
            <p className="text-xs text-stone-500">
              Tradução padrão: {settings.bibleConfig?.versionName ? settings.bibleConfig.versionName.toUpperCase() : 'Almeida Atualizada'}
            </p>
          </div>

          {/* Reader Preferences Bar */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Font Size Adjusters */}
            <div className="flex items-center bg-stone-100 rounded-xl p-1 text-stone-700">
              <button
                onClick={() => setFontSize((s) => Math.max(14, s - 2))}
                className="min-h-[38px] min-w-[38px] flex items-center justify-center hover:bg-white rounded-lg transition-colors"
                title="Diminuir tamanho da fonte"
                aria-label="Diminuir fonte"
              >
                <AArrowDown className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono px-2 text-stone-500">{fontSize}px</span>
              <button
                onClick={() => setFontSize((s) => Math.min(28, s + 2))}
                className="min-h-[38px] min-w-[38px] flex items-center justify-center hover:bg-white rounded-lg transition-colors"
                title="Aumentar tamanho da fonte"
                aria-label="Aumentar fonte"
              >
                <AArrowUp className="w-4 h-4" />
              </button>
            </div>

            {/* Reading Themes (Claro / Sépia / Noturno) */}
            <div className="flex items-center bg-stone-100 rounded-xl p-1">
              <button
                onClick={() => setTheme('light')}
                className={`min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg transition-colors ${
                  theme === 'light' ? 'bg-white shadow-xs text-stone-900' : 'text-stone-500 hover:text-stone-900'
                }`}
                title="Modo Claro"
              >
                <Sun className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTheme('sepia')}
                className={`min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg transition-colors ${
                  theme === 'sepia' ? 'bg-[#F4ECD8] text-[#3D3325] font-bold shadow-xs' : 'text-stone-500 hover:text-stone-900'
                }`}
                title="Modo Sépia (Conforto Visual)"
              >
                <span className="text-xs font-serif">S</span>
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg transition-colors ${
                  theme === 'dark' ? 'bg-stone-900 text-amber-300 shadow-xs' : 'text-stone-500 hover:text-stone-900'
                }`}
                title="Modo Noturno"
              >
                <Moon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Top Tabs: Leitura | Minhas Anotações | Favoritos */}
        <div className="flex items-center gap-1 sm:gap-2 border-b border-stone-200 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('read')}
            className={`min-h-[44px] px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              activeTab === 'read'
                ? 'border-[#344E41] text-[#344E41]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>Leitura Bíblica</span>
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`min-h-[44px] px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              activeTab === 'notes'
                ? 'border-[#344E41] text-[#344E41]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Edit3 className="w-4 h-4 shrink-0" />
            <span>Minhas Anotações</span>
            {notes.length > 0 && (
              <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded-full font-mono">
                {notes.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`min-h-[44px] px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              activeTab === 'favorites'
                ? 'border-[#344E41] text-[#344E41]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Heart className="w-4 h-4 shrink-0" />
            <span>Favoritos</span>
            {favorites.length > 0 && (
              <span className="text-[10px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded-full font-mono">
                {favorites.length}
              </span>
            )}
          </button>
        </div>

        {/* Global Search Bar */}
        <form onSubmit={handleExecuteSearch} className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por palavra (ex: amor, fé, pastor) ou referência (ex: Salmos 23, João 3:16)..."
            className="w-full min-h-[46px] pl-10 pr-10 rounded-xl bg-stone-50 border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#344E41] focus:bg-white"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setIsSearching(false);
                setSearchResults([]);
              }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>
      </div>

      {/* 2. TAB CONTENT: SEARCH RESULTS */}
      {isSearching && (
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <h3 className="font-bold text-stone-900 text-sm">
              Resultados da Busca para &ldquo;{searchQuery}&rdquo; ({searchResults.length})
            </h3>
            <button
              onClick={() => {
                setIsSearching(false);
                setSearchQuery('');
              }}
              className="text-xs text-stone-500 hover:underline"
            >
              Voltar à leitura
            </button>
          </div>

          {searchResults.length === 0 ? (
            <div className="p-8 text-center text-stone-500 text-sm">
              Nenhum versículo encontrado para este termo no catálogo de demonstração.
            </div>
          ) : (
            <div className="space-y-3">
              {searchResults.map((res, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectSearchResult(res)}
                  className="p-3.5 rounded-xl border border-stone-200 hover:border-[#344E41] hover:bg-stone-50/70 cursor-pointer transition-colors space-y-1.5"
                >
                  <span className="font-bold text-xs text-[#344E41]">{res.reference}</span>
                  <p className="font-serif text-sm text-stone-800 leading-relaxed">&ldquo;{res.text}&rdquo;</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. TAB CONTENT: LEITURA BÍBLICA */}
      {!isSearching && activeTab === 'read' && (
        <div className="space-y-4">
          {/* Book & Chapter Selectors Bar */}
          <div className="bg-white p-3 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between gap-2">
            <button
              onClick={handlePrevChapter}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
              title="Capítulo anterior"
              aria-label="Capítulo anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              {/* Select Book Button */}
              <button
                onClick={() => setBookSelectorOpen(true)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#EAF0EC] hover:bg-[#dbe6df] text-[#344E41] font-bold text-sm flex items-center gap-1.5 transition-colors"
              >
                <span>{selectedBook.name}</span>
              </button>

              {/* Select Chapter Button */}
              <button
                onClick={() => setChapterSelectorOpen(true)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-sm flex items-center gap-1.5 transition-colors"
              >
                <span>Capítulo {selectedChapter}</span>
              </button>
            </div>

            <button
              onClick={handleNextChapter}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
              title="Próximo capítulo"
              aria-label="Próximo capítulo"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Reading Canvas */}
          <div
            className={`p-6 sm:p-10 rounded-3xl shadow-xs border border-stone-200/90 transition-colors duration-200 min-h-[450px] ${
              themeClasses[theme]
            }`}
          >
            {/* Chapter Header */}
            <div className="text-center pb-8 border-b border-stone-200/50">
              <span className="text-xs font-semibold tracking-wider uppercase opacity-70">
                {selectedBook.group} · {selectedBook.testament === 'VT' ? 'Antigo Testamento' : 'Novo Testamento'}
              </span>
              <h2 className="mt-1 text-2xl sm:text-3xl font-serif font-bold tracking-tight">
                {selectedBook.name} {selectedChapter}
              </h2>
            </div>

            {/* Verses Container */}
            {isLoadingVerses ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-[#344E41] border-t-transparent animate-spin" />
                <span className="text-xs font-medium opacity-60">Carregando Escrituras...</span>
              </div>
            ) : (
              <div className="mt-8 space-y-6">
                {verses.map((v) => {
                  const fav = isFavorite(selectedBook.abbrev, selectedChapter, v.number);
                  const hasNote = notes.some(
                    (n) =>
                      n.bookAbbrev === selectedBook.abbrev &&
                      n.chapter === selectedChapter &&
                      n.verse === v.number
                  );

                  return (
                    <div
                      key={v.number}
                      className="group relative rounded-xl p-2.5 -mx-2 hover:bg-stone-500/10 transition-colors"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="font-mono text-xs font-bold opacity-45 shrink-0 mt-1 select-none w-6 text-right">
                          {v.number}
                        </span>

                        <p
                          className="font-scripture leading-relaxed flex-1"
                          style={{ fontSize: `${fontSize}px` }}
                        >
                          {v.text}
                        </p>
                      </div>

                      {/* Attached note preview if exists */}
                      {hasNote && (
                        <div className="mt-2 ml-8 p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-stone-800 text-xs flex items-start gap-2">
                          <Edit3 className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <span className="font-semibold text-amber-900 block text-[11px]">Sua anotação pessoal:</span>
                            <p className="mt-0.5 leading-relaxed">
                              {notes.find(
                                (n) =>
                                  n.bookAbbrev === selectedBook.abbrev &&
                                  n.chapter === selectedChapter &&
                                  n.verse === v.number
                              )?.noteText}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Floating actions per verse */}
                      <div className="mt-2 ml-8 flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() =>
                            toggleFavorite({
                              bookAbbrev: selectedBook.abbrev,
                              bookName: selectedBook.name,
                              chapter: selectedChapter,
                              verse: v.number,
                              reference: `${selectedBook.name} ${selectedChapter}:${v.number}`,
                              verseText: v.text
                            })
                          }
                          className={`min-h-[36px] px-2.5 py-1 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors ${
                            fav
                              ? 'text-rose-600 bg-rose-50 hover:bg-rose-100'
                              : 'text-stone-500 hover:text-stone-900 hover:bg-stone-200/50'
                          }`}
                          title={fav ? 'Remover dos favoritos' : 'Favoritar este versículo'}
                        >
                          <Heart className={`w-3.5 h-3.5 ${fav ? 'fill-rose-500' : ''}`} />
                          <span className="text-[11px]">{fav ? 'Favoritado' : 'Favoritar'}</span>
                        </button>

                        <button
                          onClick={() => handleOpenNoteModal(v.number, v.text)}
                          className={`min-h-[36px] px-2.5 py-1 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors ${
                            hasNote
                              ? 'text-[#344E41] bg-[#EAF0EC]'
                              : 'text-stone-500 hover:text-stone-900 hover:bg-stone-200/50'
                          }`}
                          title="Fazer anotação pessoal neste versículo"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span className="text-[11px]">{hasNote ? 'Editar Nota' : 'Anotar'}</span>
                        </button>

                        <button
                          onClick={() => handleCopyVerse(v.number, v.text)}
                          className="min-h-[36px] px-2.5 py-1 text-xs font-medium text-stone-500 hover:text-stone-900 hover:bg-stone-200/50 rounded-lg flex items-center gap-1.5 transition-colors"
                          title="Copiar versículo"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span className="text-[11px]">Copiar</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom Chapter Switcher */}
            <div className="mt-12 pt-6 border-t border-stone-200/50 flex items-center justify-between">
              <button
                onClick={handlePrevChapter}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-stone-300 hover:bg-stone-200/50 text-xs font-semibold flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>
              <span className="text-xs font-serif italic opacity-70">
                {selectedBook.name} {selectedChapter}
              </span>
              <button
                onClick={handleNextChapter}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-stone-300 hover:bg-stone-200/50 text-xs font-semibold flex items-center gap-1.5"
              >
                <span>Próximo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB CONTENT: MINHAS ANOTAÇÕES */}
      {!isSearching && activeTab === 'notes' && (
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-4">
          {/* Local Cache Status Banner */}
          <div
            className={`p-4 rounded-2xl bg-[#EAF0EC]/70 border border-emerald-200/80 flex gap-3 ${
              isMobileAppPreview
                ? 'flex-col'
                : 'flex-col lg:flex-row lg:items-center justify-between'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#344E41] text-white flex items-center justify-center shrink-0 mt-0.5">
                <Database className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-[#284136]">Cache de Anotações Ativo no Aparelho</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-white text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Salvo Automaticamente
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
                  Suas anotações estão gravadas no cache persistente deste dispositivo (LocalStorage + IndexedDB). Mesmo fechando o app ou sem internet, elas permanecem disponíveis.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={exportUserNotesBackup}
                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Baixar cópia das suas anotações"
              >
                <Download className="w-3.5 h-3.5 text-[#344E41]" />
                <span>Exportar</span>
              </button>

              <label className="min-h-[38px] px-3 py-1.5 rounded-xl bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5 text-[#344E41]" />
                <span>Restaurar</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      if (ev.target?.result) {
                        importUserNotesBackup(String(ev.target.result));
                      }
                    };
                    reader.readAsText(file);
                  }}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  const firstVerse = verses[0]?.text || '';
                  handleOpenNoteModal(1, firstVerse);
                }}
                className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#344E41] hover:bg-[#284136] text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova Anotação</span>
              </button>
            </div>
          </div>

          {/* Unsaved Draft Recovery Alert if exists */}
          {savedDraftBanner && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3">
              <div className="text-xs text-amber-900">
                <span className="font-bold block">Rascunho salvo automaticamente no cache:</span>
                <span className="line-clamp-1 italic">&ldquo;{savedDraftBanner.text}&rdquo;</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const book = BIBLE_BOOKS.find((b) => b.abbrev === savedDraftBanner.bookAbbrev) || selectedBook;
                  setNoteTargetVerse({
                    bookAbbrev: book.abbrev,
                    bookName: book.name,
                    chapter: savedDraftBanner.chapter,
                    verse: savedDraftBanner.verse,
                    verseText: ''
                  });
                  setNoteInputText(savedDraftBanner.text);
                  setEditingNoteId(null);
                  setNoteModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold text-xs shrink-0"
              >
                Continuar Rascunho
              </button>
            </div>
          )}

          <div
            className={`flex gap-3 pb-3 border-b border-stone-100 ${
              isMobileAppPreview
                ? 'flex-col'
                : 'flex-col sm:flex-row sm:items-center justify-between'
            }`}
          >
            <div>
              <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#344E41]" />
                <span>Minhas Anotações Pessoais ({notes.length})</span>
              </h3>
              <p className="text-xs text-stone-500">
                Suas reflexões ficam salvas de forma estritamente privada no seu aparelho.
              </p>
            </div>

            <input
              type="text"
              value={notesFilterQuery}
              onChange={(e) => setNotesFilterQuery(e.target.value)}
              placeholder="Buscar em minhas anotações..."
              className="min-h-[40px] px-3 py-1.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#344E41]"
            />
          </div>

          {filteredNotes.length === 0 ? (
            <div className="p-12 text-center text-stone-500 space-y-2">
              <Edit3 className="w-8 h-8 text-stone-300 mx-auto" />
              <p className="text-sm font-medium">Nenhuma anotação encontrada.</p>
              <p className="text-xs text-stone-400">
                Toque no botão &ldquo;Nova Anotação&rdquo; acima ou em &ldquo;Anotar&rdquo; em qualquer versículo durante a leitura.
              </p>
            </div>
          ) : (
            <div className={`grid gap-3.5 ${isMobileAppPreview ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 flex flex-col justify-between gap-3 border-l-4"
                  style={{ borderLeftColor: note.colorTag || '#344E41' }}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#344E41]">{note.reference}</span>
                      <span className="text-[10px] text-stone-400">
                        {new Date(note.updatedAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-xs text-stone-700 leading-relaxed whitespace-pre-line">
                      {note.noteText}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between">
                    <button
                      onClick={() => {
                        const book = BIBLE_BOOKS.find((b) => b.abbrev === note.bookAbbrev);
                        if (book) {
                          setSelectedBook(book);
                          setSelectedChapter(note.chapter);
                          setActiveTab('read');
                        }
                      }}
                      className="text-xs font-semibold text-[#344E41] hover:underline"
                    >
                      Ir ao capítulo
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingNoteId(note.id);
                          setNoteTargetVerse({
                            bookAbbrev: note.bookAbbrev,
                            bookName: note.bookName,
                            chapter: note.chapter,
                            verse: note.verse || 1,
                            verseText: ''
                          });
                          setNoteInputText(note.noteText);
                          setNoteColorTag(note.colorTag || '#344E41');
                          setNoteModalOpen(true);
                        }}
                        className="p-1.5 text-stone-500 hover:text-stone-800 rounded-lg hover:bg-stone-200"
                        title="Editar anotação"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          askConfirmation({
                            title: 'Excluir Anotação?',
                            message: `Deseja excluir sua anotação em ${note.reference}?`,
                            isDestructive: true,
                            onConfirm: () => deleteNote(note.id)
                          })
                        }
                        className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-stone-200"
                        title="Excluir anotação"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. TAB CONTENT: FAVORITOS */}
      {!isSearching && activeTab === 'favorites' && (
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-4">
          <div className="pb-3 border-b border-stone-100">
            <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
              <span>Versículos Favoritos ({favorites.length})</span>
            </h3>
            <p className="text-xs text-stone-500">
              Versículos marcados para memorização e consulta rápida.
            </p>
          </div>

          {favorites.length === 0 ? (
            <div className="p-12 text-center text-stone-500 space-y-2">
              <Bookmark className="w-8 h-8 text-stone-300 mx-auto" />
              <p className="text-sm font-medium">Você ainda não favoritou nenhum versículo.</p>
              <p className="text-xs text-stone-400">
                Toque no ícone de coração em qualquer versículo durante a leitura para salvá-lo aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {favorites.map((fav) => (
                <div
                  key={fav.id}
                  className="p-4 rounded-xl border border-stone-200 hover:border-stone-300 bg-stone-50/40 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#344E41]">{fav.reference}</span>
                    <button
                      onClick={() =>
                        toggleFavorite({
                          bookAbbrev: fav.bookAbbrev,
                          bookName: fav.bookName,
                          chapter: fav.chapter,
                          verse: fav.verse,
                          reference: fav.reference,
                          verseText: fav.verseText
                        })
                      }
                      className="text-stone-400 hover:text-rose-600 p-1"
                      title="Remover dos favoritos"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="font-serif text-sm text-stone-800 leading-relaxed">&ldquo;{fav.verseText}&rdquo;</p>
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => {
                        const book = BIBLE_BOOKS.find((b) => b.abbrev === fav.bookAbbrev);
                        if (book) {
                          setSelectedBook(book);
                          setSelectedChapter(fav.chapter);
                          setActiveTab('read');
                        }
                      }}
                      className="text-xs font-semibold text-[#344E41] hover:underline"
                    >
                      Ler no contexto ({fav.bookName} {fav.chapter})
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`"${fav.verseText}" (${fav.reference})`);
                        showToast('Versículo copiado!');
                      }}
                      className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copiar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: SELECIONAR LIVRO */}
      {bookSelectorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] shadow-2xl border border-stone-200 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-stone-900 text-base">Selecione o Livro</h3>
                <p className="text-xs text-stone-500">66 Livros da Bíblia Sagrada</p>
              </div>
              <button
                onClick={() => setBookSelectorOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter VT / NT */}
            <div className="flex items-center gap-2 p-3 bg-stone-50 border-b border-stone-200 text-xs">
              <button
                onClick={() => setTestamentFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  testamentFilter === 'ALL'
                    ? 'bg-[#344E41] text-white'
                    : 'bg-white text-stone-600 hover:bg-stone-200 border border-stone-200'
                }`}
              >
                Todos (66)
              </button>
              <button
                onClick={() => setTestamentFilter('VT')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  testamentFilter === 'VT'
                    ? 'bg-[#344E41] text-white'
                    : 'bg-white text-stone-600 hover:bg-stone-200 border border-stone-200'
                }`}
              >
                Antigo Testamento (39)
              </button>
              <button
                onClick={() => setTestamentFilter('NT')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  testamentFilter === 'NT'
                    ? 'bg-[#344E41] text-white'
                    : 'bg-white text-stone-600 hover:bg-stone-200 border border-stone-200'
                }`}
              >
                Novo Testamento (27)
              </button>
            </div>

            {/* Book Grid */}
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {filteredBooks.map((book) => {
                const isSelected = book.id === selectedBook.id;
                return (
                  <button
                    key={book.id}
                    onClick={() => {
                      setSelectedBook(book);
                      setSelectedChapter(1);
                      setBookSelectorOpen(false);
                    }}
                    className={`min-h-[44px] p-2.5 rounded-xl text-left border transition-all ${
                      isSelected
                        ? 'bg-[#344E41] text-white border-[#344E41] shadow-xs'
                        : 'bg-stone-50/60 hover:bg-stone-100 text-stone-800 border-stone-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs leading-tight">{book.name}</span>
                      <span className={`text-[10px] font-mono ${isSelected ? 'text-emerald-200' : 'text-stone-400'}`}>
                        {book.chaptersCount} cap
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SELECIONAR CAPÍTULO */}
      {chapterSelectorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] shadow-2xl border border-stone-200 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-stone-900 text-base">
                  {selectedBook.name} · Escolha o Capítulo
                </h3>
                <p className="text-xs text-stone-500">Total de {selectedBook.chaptersCount} capítulos</p>
              </div>
              <button
                onClick={() => setChapterSelectorOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-5 sm:grid-cols-6 gap-2">
              {Array.from({ length: selectedBook.chaptersCount }, (_, i) => i + 1).map((ch) => {
                const isCurrent = ch === selectedChapter;
                return (
                  <button
                    key={ch}
                    onClick={() => {
                      setSelectedChapter(ch);
                      setChapterSelectorOpen(false);
                    }}
                    className={`min-h-[44px] rounded-xl font-bold text-sm flex items-center justify-center transition-all ${
                      isCurrent
                        ? 'bg-[#344E41] text-white shadow-xs'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-800'
                    }`}
                  >
                    {ch}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CRIAR / EDITAR ANOTAÇÃO PESSOAL */}
      {noteModalOpen && noteTargetVerse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-stone-200 overflow-hidden">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-stone-900 text-base">
                  Anotação Pessoal · {noteTargetVerse.bookName} {noteTargetVerse.chapter}:{noteTargetVerse.verse}
                </h3>
                <p className="text-xs text-stone-500">Salva somente no seu navegador/aparelho</p>
              </div>
              <button
                onClick={() => setNoteModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNote} className="p-5 space-y-4">
              {noteTargetVerse.verseText && (
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs font-serif text-stone-700 italic">
                  &ldquo;{noteTargetVerse.verseText}&rdquo;
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                    Sua Reflexão / Estudo
                  </label>
                  <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Rascunho salvo em tempo real
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={noteInputText}
                  onChange={(e) => handleNoteTextChange(e.target.value)}
                  placeholder="Escreva o que Deus falou ao seu coração neste versículo..."
                  required
                  className="w-full p-3 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#344E41]"
                />
              </div>

              {/* Color Tag Selector */}
              <div>
                <span className="block text-[11px] font-bold text-stone-600 mb-1.5">Cor do Marcador:</span>
                <div className="flex items-center gap-2">
                  {NOTE_COLORS.map((col) => (
                    <button
                      key={col.hex}
                      type="button"
                      onClick={() => setNoteColorTag(col.hex)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 border transition-all ${
                        noteColorTag === col.hex
                          ? 'border-stone-900 bg-stone-100 text-stone-900 shadow-2xs'
                          : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.hex }} />
                      <span>{col.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNoteModalOpen(false)}
                  className="min-h-[44px] px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2 text-xs font-semibold text-white bg-[#344E41] hover:bg-[#284136] rounded-xl shadow-xs"
                >
                  Salvar no Aparelho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
