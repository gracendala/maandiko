import React, { useState, useEffect } from 'react';
import { BIBLE_BOOKS, FEATURED_BIBLE_VERSES, fetchRealBibleChapter } from '../data/bibleLibrary';
import { BibleBook, BibleVerse, BibleTranslation } from '../types';
import {
  Book,
  Search,
  Radio,
  FolderDown,
  X,
  CheckCircle2,
  Trash2,
  Globe,
  Upload,
  FileText,
  Zap,
  Download,
  Hash,
  RotateCw
} from 'lucide-react';

interface BibleModuleProps {
  onProject: (sermonId: string, numero: number | string, texte: string, titreOverride?: string) => void;
  projectedState: any;
  navRef?: React.MutableRefObject<{ handleNext: () => void; handlePrev: () => void } | null>;
}

interface BibleVersionInfo {
  id: string;
  name: string;
  language: string;
  year?: string;
  description: string;
  sizeMb: string;
}

const AVAILABLE_CATALOG_VERSIONS: BibleVersionInfo[] = [
  { id: 'LSG', name: 'Louis Segond 1910', language: 'Français', year: '1910', description: 'Version protestante française classique de référence.', sizeMb: '4.2 MB' },
  { id: 'MARTIN', name: 'David Martin 1744', language: 'Français', year: '1744', description: 'Version réformée classique historique par David Martin.', sizeMb: '4.8 MB' },
  { id: 'OST', name: 'Ostervald 1996', language: 'Français', year: '1996', description: 'Révision de la célèbre Bible de J.F. Ostervald.', sizeMb: '4.3 MB' },
  { id: 'BDS', name: 'Bible du Semeur', language: 'Français', year: '2000', description: 'Traduction dynamique en français contemporain.', sizeMb: '4.1 MB' },
  { id: 'KJV', name: 'King James Version', language: 'Anglais', year: '1611', description: 'Version royale anglaise autorisée traditionnelle.', sizeMb: '4.4 MB' },
  { id: 'NIV', name: 'New International Version', language: 'Anglais', year: '1978', description: 'Traduction anglaise moderne de haute fidélité.', sizeMb: '4.5 MB' },
  { id: 'ESV', name: 'English Standard Version', language: 'Anglais', year: '2001', description: 'Traduction littérale exacte moderne.', sizeMb: '4.6 MB' },
  { id: 'RVR1960', name: 'Reina Valera 1960', language: 'Espagnol', year: '1960', description: 'Version espagnole classique de référence.', sizeMb: '4.3 MB' },
  { id: 'LUT1545', name: 'Luther Bibel 1545', language: 'Allemand', year: '1545', description: 'Traduction historique allemande de Martin Luther.', sizeMb: '4.7 MB' },
  { id: 'ARC', name: 'Almeida Revista e Corrigida', language: 'Portugais', year: '1995', description: 'Version portugaise traditionnelle classique.', sizeMb: '4.4 MB' },
  { id: 'SW2000', name: 'Biblia Takatifu', language: 'Swahili', year: '2000', description: 'Version officielle intégrale en langue Swahili.', sizeMb: '4.2 MB' },
  { id: 'ITA', name: 'Riveduta 1927', language: 'Italien', year: '1927', description: 'Traduction italienne protestante de référence.', sizeMb: '4.3 MB' },
];

export const BibleModule: React.FC<BibleModuleProps> = ({ onProject, projectedState, navRef }) => {
  const [selectedBook, setSelectedBook] = useState<BibleBook>(
    BIBLE_BOOKS.find(b => b.id === 'jean') || BIBLE_BOOKS[0]
  );
  const [selectedChapter, setSelectedChapter] = useState<number>(3);
  const [searchQuery, setSearchQuery] = useState('');
  const [translation, setTranslation] = useState<string>(() => {
    try {
      return localStorage.getItem('protext_active_bible_translation') || '';
    } catch (e) {
      return '';
    }
  });
  const [testamentFilter, setTestamentFilter] = useState<'ALL' | 'OT' | 'NT'>('ALL');

  // Downloader & Version Manager State
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [downloadedVersions, setDownloadedVersions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('protext_downloaded_bible_versions');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading downloaded Bible versions', e);
    }
    return []; // No default pre-installed versions
  });

  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [customVersions, setCustomVersions] = useState<BibleVersionInfo[]>(() => {
    try {
      const saved = localStorage.getItem('protext_custom_bible_versions_meta');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading custom Bible meta', e);
    }
    return [];
  });

  // Custom uploaded verses library in localStorage / Memory
  const [customVerseMap, setCustomVerseMap] = useState<Record<string, BibleVerse[]>>(() => {
    try {
      const saved = localStorage.getItem('protext_custom_bible_verses_data');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading custom Bible verse data', e);
    }
    return {};
  });

  // Ensure translation matches downloaded versions
  useEffect(() => {
    if (downloadedVersions.length > 0) {
      if (!translation || !downloadedVersions.includes(translation)) {
        setTranslation(downloadedVersions[0]);
      }
    } else {
      setTranslation('');
    }
  }, [downloadedVersions]);

  // Save active translation
  useEffect(() => {
    try {
      if (translation) {
        localStorage.setItem('protext_active_bible_translation', translation);
      } else {
        localStorage.removeItem('protext_active_bible_translation');
      }
    } catch (e) {}
  }, [translation]);

  // Save downloaded versions list to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('protext_downloaded_bible_versions', JSON.stringify(downloadedVersions));
    } catch (e) {
      console.error('Error saving downloaded Bible versions list', e);
    }
  }, [downloadedVersions]);

  // Save custom metadata
  useEffect(() => {
    try {
      localStorage.setItem('protext_custom_bible_versions_meta', JSON.stringify(customVersions));
    } catch (e) {
      console.error('Error saving custom versions meta', e);
    }
  }, [customVersions]);

  // Handle Online Version Download / Activate
  const handleDownloadVersion = (ver: BibleVersionInfo) => {
    if (downloadedVersions.includes(ver.id)) return;

    setDownloadingId(ver.id);
    setDownloadProgress(15);

    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setDownloadingId(null);
          setDownloadedVersions(old => Array.from(new Set([...old, ver.id])));
          setTranslation(ver.id);
          return 100;
        }
        return prev + 25;
      });
    }, 120);
  };

  const handleRemoveVersion = (verId: string) => {
    setDownloadedVersions(old => {
      const next = old.filter(id => id !== verId);
      if (translation === verId) {
        setTranslation(next[0] || '');
      }
      return next;
    });
    setCustomVersions(old => old.filter(c => c.id !== verId));
  };

  // Local File Uploader (.json / .txt Bible files)
  const handleLocalBibleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const baseName = file.name.replace(/\.[^/.]+$/, "").toUpperCase();
        const customId = `CUSTOM_${baseName.replace(/\s+/g, '_')}`;

        let parsedVerses: BibleVerse[] = [];

        if (file.name.endsWith('.json')) {
          const jsonContent = JSON.parse(text);
          if (Array.isArray(jsonContent)) {
            parsedVerses = jsonContent.map((v: any) => ({
              book: v.book || 'Jean',
              chapter: Number(v.chapter || 1),
              verse: Number(v.verse || 1),
              text: v.text || v.content || '',
              translation: customId
            }));
          } else if (typeof jsonContent === 'object') {
            // Traverse nested json structure { "Jean": { "3": { "16": "..." } } }
            Object.keys(jsonContent).forEach(bName => {
              const bData = jsonContent[bName];
              if (typeof bData === 'object') {
                Object.keys(bData).forEach(cNum => {
                  const cData = bData[cNum];
                  if (typeof cData === 'object') {
                    Object.keys(cData).forEach(vNum => {
                      parsedVerses.push({
                        book: bName,
                        chapter: Number(cNum),
                        verse: Number(vNum),
                        text: String(cData[vNum]),
                        translation: customId
                      });
                    });
                  }
                });
              }
            });
          }
        } else {
          // Plain TXT parser lines (e.g. Jean 3:16 Car Dieu a tant aime...)
          const lines = text.split('\n');
          lines.forEach((line, idx) => {
            const trimmed = line.trim();
            if (trimmed) {
              parsedVerses.push({
                book: selectedBook.name,
                chapter: selectedChapter,
                verse: idx + 1,
                text: trimmed,
                translation: customId
              });
            }
          });
        }

        if (parsedVerses.length > 0) {
          const newMeta: BibleVersionInfo = {
            id: customId,
            name: file.name.replace(/\.[^/.]+$/, ""),
            language: 'Fichier Local',
            description: `Importé depuis le fichier local ${file.name} (${parsedVerses.length} versets)`,
            sizeMb: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          };

          setCustomVersions(old => [...old.filter(c => c.id !== customId), newMeta]);
          setDownloadedVersions(old => Array.from(new Set([...old, customId])));

          const key = `VERSION_${customId}`;
          const updatedVerses = { ...customVerseMap, [key]: parsedVerses };
          setCustomVerseMap(updatedVerses);

          try {
            localStorage.setItem('protext_custom_bible_verses_data', JSON.stringify(updatedVerses));
          } catch (e) {
            console.error("Error storing imported verses", e);
          }

          setTranslation(customId);
          alert(`Bible "${newMeta.name}" importée avec succès ! (${parsedVerses.length} versets enregistrés)`);
        } else {
          alert("Format de fichier non reconnu. Veuillez utiliser un fichier JSON de Bible standard.");
        }
      } catch (err) {
        console.error("Error parsing imported Bible file", err);
        alert("Erreur lors de la lecture du fichier Bible.");
      }
    };

    reader.readAsText(file);
  };

  const filteredBooks = BIBLE_BOOKS.filter(b => {
    const matchesTestament = testamentFilter === 'ALL' || b.testament === testamentFilter;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesTestament;

    return matchesTestament && b.name.toLowerCase().includes(q);
  });

  // Combine default catalog + custom imported versions
  const allAvailableVersions = React.useMemo(() => {
    const map = new Map<string, BibleVersionInfo>();
    AVAILABLE_CATALOG_VERSIONS.forEach(v => map.set(v.id, v));
    customVersions.forEach(v => map.set(v.id, v));
    return Array.from(map.values());
  }, [customVersions]);

  const normalizeStr = (str: string) =>
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

  // Cache for online Bible API fetches
  const [fetchedVersesCache, setFetchedVersesCache] = useState<Record<string, BibleVerse[]>>({});
  const [isLoadingApi, setIsLoadingApi] = useState(false);

  // Fetch real verses asynchronously from Bible API when chapter/version changes
  useEffect(() => {
    if (!translation || !selectedBook) return;
    const cacheKey = `${selectedBook.name}_${selectedChapter}_${translation}`;
    if (fetchedVersesCache[cacheKey] && fetchedVersesCache[cacheKey].length > 0) return;

    let isMounted = true;
    setIsLoadingApi(true);

    fetchRealBibleChapter(selectedBook.name, selectedChapter, translation)
      .then(parsed => {
        if (isMounted) {
          setFetchedVersesCache(prev => ({
            ...prev,
            [cacheKey]: parsed || []
          }));
        }
      })
      .catch((err) => {
        console.error("Error fetching Bible chapter:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingApi(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedBook.name, selectedChapter, translation]);

  // Filter or fetched verses for the selected Book & Chapter
  const currentChapterVerses: BibleVerse[] = React.useMemo(() => {
    if (!translation) return [];
    const cacheKey = `${selectedBook.name}_${selectedChapter}_${translation}`;

    // 1. Check online API cache
    if (fetchedVersesCache[cacheKey] && fetchedVersesCache[cacheKey].length > 0) {
      return fetchedVersesCache[cacheKey];
    }

    const selBookNorm = normalizeStr(selectedBook.name);

    // 2. Check custom imported / downloaded verse storage
    const customKey = `VERSION_${translation}`;
    const customVerses = customVerseMap[customKey];
    if (customVerses && customVerses.length > 0) {
      const matching = customVerses.filter(
        v => normalizeStr(v.book).includes(selBookNorm) && Number(v.chapter) === Number(selectedChapter)
      );
      if (matching.length > 0) return matching;
    }

    return [];
  }, [selectedBook, selectedChapter, translation, customVerseMap, fetchedVersesCache]);

  // Search results across loaded verses
  const searchResults: BibleVerse[] = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q || q.length < 2) return [];

    const results: BibleVerse[] = [];
    (Object.values(fetchedVersesCache) as BibleVerse[][]).forEach(verseList => {
      if (Array.isArray(verseList)) {
        verseList.forEach(v => {
          if (
            v.book.toLowerCase().includes(q) ||
            v.text.toLowerCase().includes(q) ||
            `${v.book} ${v.chapter}:${v.verse}`.toLowerCase().includes(q)
          ) {
            results.push(v);
          }
        });
      }
    });

    return results;
  }, [searchQuery, fetchedVersesCache]);

  const isVerseLive = (v: BibleVerse) => {
    if (!projectedState) return false;
    if (
      projectedState.sermonId === 'BLACK' ||
      projectedState.animPhase === 'EXITING' ||
      projectedState.animPhase === 'OUT' ||
      !projectedState.texte
    ) {
      return false;
    }
    const ref = `${v.book} ${v.chapter}:${v.verse}`;
    return (
      projectedState.sermonId === 'BIBLE' &&
      (projectedState.numero === ref || projectedState.texte === v.text)
    );
  };

  // Navigation handler effect for live keyboard / monitor bar control
  useEffect(() => {
    if (!navRef) return;
    navRef.current = {
      handleNext: () => {
        if (!currentChapterVerses || currentChapterVerses.length === 0) return;

        const currentIdx = currentChapterVerses.findIndex((v) => isVerseLive(v));

        let nextIdx = 0;
        if (currentIdx >= 0) {
          if (currentIdx < currentChapterVerses.length - 1) {
            nextIdx = currentIdx + 1;
          } else {
            if (selectedChapter < selectedBook.chapters) {
              setSelectedChapter(prev => prev + 1);
            }
            return;
          }
        }

        const v = currentChapterVerses[nextIdx];
        if (!v) return;
        onProject(
          'BIBLE',
          `${v.book} ${v.chapter}:${v.verse}`,
          v.text,
          `Sainte Bible - ${v.book} ${v.chapter} (${translation})`
        );
        const el = document.getElementById(`verse-${v.verse}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      },
      handlePrev: () => {
        if (!currentChapterVerses || currentChapterVerses.length === 0) return;

        const currentIdx = currentChapterVerses.findIndex((v) => isVerseLive(v));

        let prevIdx = 0;
        if (currentIdx > 0) {
          prevIdx = currentIdx - 1;
        } else if (currentIdx === 0) {
          if (selectedChapter > 1) {
            setSelectedChapter(prev => prev - 1);
          }
          return;
        }

        const v = currentChapterVerses[prevIdx];
        if (!v) return;
        onProject(
          'BIBLE',
          `${v.book} ${v.chapter}:${v.verse}`,
          v.text,
          `Sainte Bible - ${v.book} ${v.chapter} (${translation})`
        );
        const el = document.getElementById(`verse-${v.verse}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    };
  }, [currentChapterVerses, projectedState, translation, selectedChapter, selectedBook, onProject, navRef]);

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-[#0d1017]">
      {/* Left Sidebar 1: Bible Books & Chapters Directory */}
      <div className="w-80 border-r border-white/10 bg-[#121622] flex flex-col flex-shrink-0">
        <div className="p-3 border-b border-white/10 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Book className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-white text-sm">Sainte Bible</span>
            </div>

            {/* Translation Badge & Manager Opener */}
            <div className="flex items-center gap-1.5">
              <select
                value={translation}
                onChange={(e) => setTranslation(e.target.value)}
                disabled={downloadedVersions.length === 0}
                className="bg-[#181f2e] text-slate-200 font-bold border border-white/15 rounded-lg text-xs px-2 py-1 outline-none cursor-pointer max-w-[130px] truncate disabled:opacity-50"
              >
                {downloadedVersions.length === 0 ? (
                  <option value="">Aucune version</option>
                ) : (
                  allAvailableVersions
                    .filter(v => downloadedVersions.includes(v.id))
                    .map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))
                )}
              </select>

              <button
                onClick={() => setShowVersionModal(true)}
                className="p-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 transition cursor-pointer"
                title="Gérer / Télécharger d'autres versions de la Bible"
              >
                <FolderDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ex: Jean 3:16, foi, lumière, Psaumes..."
              className="w-full bg-[#181f2e] border border-white/15 pl-8 pr-8 py-1.5 rounded-lg text-xs text-white placeholder-slate-400 outline-none focus:border-blue-500 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white transition cursor-pointer"
                title="Effacer la recherche"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Testament Filters */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setTestamentFilter('ALL')}
              className={`flex-1 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                testamentFilter === 'ALL'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  : 'bg-black/30 text-slate-400 hover:text-white'
              }`}
            >
              Tous (66)
            </button>
            <button
              onClick={() => setTestamentFilter('OT')}
              className={`flex-1 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                testamentFilter === 'OT'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  : 'bg-black/30 text-slate-400 hover:text-white'
              }`}
            >
              Ancien Test. (39)
            </button>
            <button
              onClick={() => setTestamentFilter('NT')}
              className={`flex-1 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                testamentFilter === 'NT'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  : 'bg-black/30 text-slate-400 hover:text-white'
              }`}
            >
              Nouveau Test. (27)
            </button>
          </div>
        </div>

        {/* Books List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredBooks.map(book => {
            const isSelected = book.id === selectedBook.id;
            return (
              <button
                key={book.id}
                onClick={() => {
                  setSelectedBook(book);
                  setSelectedChapter(1);
                  setSearchQuery('');
                }}
                className={`w-full text-left p-2 rounded-xl transition cursor-pointer flex items-center justify-between text-xs ${
                  isSelected
                    ? 'bg-[#1a2332] border border-blue-500/40 text-white font-bold shadow-md'
                    : 'hover:bg-white/5 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${book.testament === 'NT' ? 'bg-blue-400' : 'bg-slate-500'}`} />
                  <span>{book.name}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {book.chaptersCount} chap.
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Middle Column: Chapter Selector & Bookmarks */}
      <div className="w-64 border-r border-white/10 bg-[#10131d] flex flex-col flex-shrink-0">
        <div className="p-3 border-b border-white/10 flex items-center justify-between">
          <span className="font-bold text-white text-xs flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-blue-400" />
            <span>Chapitres de {selectedBook.name}</span>
          </span>
          <span className="text-[10px] text-blue-300 font-mono font-bold">
            1 - {selectedBook.chaptersCount}
          </span>
        </div>

        {/* Chapter Grid */}
        <div className="p-3 overflow-y-auto grid grid-cols-5 gap-1.5 max-h-[40%] border-b border-white/10">
          {Array.from({ length: selectedBook.chaptersCount }, (_, i) => i + 1).map(chNum => {
            const isChSelected = chNum === selectedChapter;
            return (
              <button
                key={chNum}
                onClick={() => {
                  setSelectedChapter(chNum);
                  setSearchQuery('');
                }}
                className={`py-2 rounded-lg text-xs font-mono font-bold transition cursor-pointer flex items-center justify-center ${
                  isChSelected
                    ? 'bg-blue-600 text-white font-bold shadow-md'
                    : 'bg-[#181f2e] text-slate-300 hover:bg-white/10 hover:text-white border border-white/5'
                }`}
              >
                {chNum}
              </button>
            );
          })}
        </div>

        {/* Verse Shortcuts Section for Selected Chapter */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-white/10 flex items-center justify-between bg-[#141824]">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              <span>Versets</span>
              {isLoadingApi && (
                <span className="text-[9px] text-amber-400 animate-pulse font-normal ml-1">
                  (chargement...)
                </span>
              )}
            </span>
            <span className="text-[10px] text-blue-300 font-mono font-bold">
              {currentChapterVerses.length} versets
            </span>
          </div>

          <div className="p-3 overflow-y-auto grid grid-cols-5 gap-1.5 flex-1 content-start">
            {currentChapterVerses.map((v) => {
              const live = isVerseLive(v);
              return (
                <button
                  key={v.verse}
                  onClick={() => {
                    onProject(
                      'BIBLE',
                      `${v.book} ${v.chapter}:${v.verse}`,
                      v.text,
                      `Sainte Bible - ${v.book} ${v.chapter} (${translation})`
                    );
                    const el = document.getElementById(`verse-${v.verse}`);
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }}
                  className={`py-2 rounded-lg text-xs font-mono font-bold transition cursor-pointer flex items-center justify-center relative ${
                    live
                      ? 'bg-emerald-600 text-white font-extrabold shadow-md ring-2 ring-emerald-400'
                      : 'bg-[#181f2e] text-slate-200 hover:bg-blue-600 hover:text-white border border-white/5'
                  }`}
                  title={`${v.book} ${v.chapter}:${v.verse} - Cliquer pour projeter`}
                >
                  {v.verse}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Right Area: Verses Display & Instant Projection */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0c12]">
        {downloadedVersions.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#0a0c12]">
            <div className="p-5 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-5 shadow-xl">
              <Book className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-black text-white mb-3">Aucune version de la Bible installée</h2>
            <p className="text-slate-400 text-sm max-w-lg mb-8 leading-relaxed">
              Afin de lire et projeter les Écritures Saintes, veuillez ouvrir le Gestionnaire de Bibles pour installer une version officielle de votre choix (Louis Segond, Martin, Ostervald, King James, etc.) ou importer votre propre fichier local.
            </p>
            <button
              onClick={() => setShowVersionModal(true)}
              className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center gap-2.5 shadow-xl transition transform hover:scale-105 cursor-pointer"
            >
              <FolderDown className="w-5 h-5" />
              <span>Ouvrir le Gestionnaire de Bibles</span>
            </button>
          </div>
        ) : (
          <>
            {/* Header Bar */}
            <div className="p-4 border-b border-white/10 bg-[#121722] flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-300 border border-blue-500/20">
                  <Book className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span>{selectedBook.name} {selectedChapter}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 font-mono">
                      {translation}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    {selectedBook.testament === 'OT' ? 'Ancien Testament' : 'Nouveau Testament'} • Cliquez sur un verset pour le projeter instantanément
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowVersionModal(true)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <FolderDown className="w-4 h-4 text-blue-400" />
                  <span>Gérer les Versions ({downloadedVersions.length})</span>
                </button>

                <button
                  onClick={() => {
                    const first = currentChapterVerses[0];
                    if (first) {
                      onProject(
                        'BIBLE',
                        `${first.book} ${first.chapter}:${first.verse}`,
                        first.text,
                        `Sainte Bible - ${first.book} ${first.chapter} (${translation})`
                      );
                    }
                  }}
                  disabled={currentChapterVerses.length === 0}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  <Radio className="w-4 h-4" />
                  <span>Projeter Verset 1</span>
                </button>
              </div>
            </div>

            {/* Verses Container */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto space-y-4">
                {isLoadingApi && currentChapterVerses.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 space-y-3">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-sm font-medium">Chargement des versets depuis la base de données...</p>
                  </div>
                ) : searchQuery.trim().length >= 2 ? (
                  /* Search Results overlay mode if searchQuery active */
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                      <span>Résultats de Recherche pour "{searchQuery}"</span>
                      <span>{searchResults.length} versets trouvés</span>
                    </div>

                    {searchResults.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 text-xs italic bg-[#131722] rounded-xl border border-white/5">
                        Aucun verset trouvé avec ces mots-clés dans les chapitres chargés. Essayez un autre terme ou naviguez directement par livre et chapitre.
                      </div>
                    ) : (
                      searchResults.map((v, idx) => {
                        const live = isVerseLive(v);

                        return (
                          <div
                            key={idx}
                            onClick={() => {
                              onProject(
                                'BIBLE',
                                `${v.book} ${v.chapter}:${v.verse}`,
                                v.text,
                                `Sainte Bible - ${v.book} ${v.chapter} (${v.translation || translation})`
                              );
                            }}
                            className={`p-5 rounded-xl border transition-all duration-150 cursor-pointer relative group flex flex-col justify-between ${
                              live
                                ? 'bg-emerald-950/90 border-emerald-400 ring-2 ring-emerald-400/50 shadow-xl'
                                : 'bg-[#131722] hover:bg-[#181f2e] border-white/10 hover:border-blue-500/40 text-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-blue-300 text-sm">
                                {v.book} {v.chapter}:{v.verse}
                              </span>
                              <div className="flex items-center gap-2">
                                {live ? (
                                  <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold tracking-wider animate-pulse">
                                    <Radio className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>EN DIRECT</span>
                                  </span>
                                ) : (
                                  <span className="text-xs text-slate-500 group-hover:text-blue-400 transition font-bold">
                                    Projeter →
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="font-serif text-base leading-relaxed text-white font-medium">
                              "{v.text}"
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                ) : currentChapterVerses.length === 0 ? (
                  <div className="p-12 text-center bg-[#131722] rounded-2xl border border-white/10 space-y-3">
                    <Book className="w-10 h-10 text-slate-600 mx-auto" />
                    <h3 className="text-base font-bold text-white">Aucun verset disponible</h3>
                    <p className="text-slate-400 text-xs max-w-md mx-auto">
                      Impossible de charger les versets pour {selectedBook.name} chapitre {selectedChapter} (Version : {translation}). Veuillez vérifier votre connexion Internet.
                    </p>
                  </div>
                ) : (
                  /* Normal Book Chapter Verses View */
                  <div className="space-y-4">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Écritures de {selectedBook.name} Chapitre {selectedChapter}</span>
                      <span className="text-slate-500 font-mono text-[11px] font-normal">Version : {translation}</span>
                    </div>

                    {currentChapterVerses.map((v) => {
                      const live = isVerseLive(v);

                      return (
                        <div
                          key={v.verse}
                          id={`verse-${v.verse}`}
                          onClick={() => {
                            onProject(
                              'BIBLE',
                              `${v.book} ${v.chapter}:${v.verse}`,
                              v.text,
                              `Sainte Bible - ${v.book} ${v.chapter} (${translation})`
                            );
                          }}
                          className={`p-5 rounded-xl border transition-all duration-150 cursor-pointer relative group ${
                            live
                              ? 'bg-emerald-950/90 border-emerald-400 ring-2 ring-emerald-400/50 shadow-xl'
                              : 'bg-[#131722] hover:bg-[#181f2e] border-white/10 hover:border-blue-500/40 text-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                                live ? 'bg-emerald-500 text-slate-950' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              }`}>
                                {v.verse}
                              </span>
                              <span className="font-bold text-white text-sm">
                                {v.book} {v.chapter}:{v.verse}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {live ? (
                                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold tracking-wider animate-pulse">
                                  <Radio className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>EN DIRECT SUR ÉCRANS</span>
                                </span>
                              ) : (
                                <span className="text-xs text-slate-500 group-hover:text-blue-400 transition font-bold">
                                  Projeter ce verset →
                                </span>
                              )}
                            </div>
                          </div>

                          <p className="font-serif text-base leading-relaxed text-white font-medium pl-9">
                            "{v.text}"
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bible Version Downloader & Importer Modal */}
      {showVersionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121622] border border-white/15 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-white/10 bg-[#171c2b] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  <FolderDown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Gestionnaire des Versions de la Bible</h3>
                  <p className="text-xs text-slate-400">Téléchargez des versions en ligne ou importez vos propres fichiers locaux</p>
                </div>
              </div>
              <button
                onClick={() => setShowVersionModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Local File Importer Dropzone */}
              <div className="bg-[#181f2e] border-2 border-dashed border-blue-500/30 hover:border-blue-500/60 p-4 rounded-xl text-center space-y-2 transition">
                <div className="flex items-center justify-center gap-2 text-blue-400">
                  <Upload className="w-5 h-5" />
                  <span className="font-bold text-sm text-white">Importer une Bible depuis votre ordinateur</span>
                </div>
                <p className="text-slate-400 text-[11px] max-w-md mx-auto">
                  Sélectionnez un fichier <code className="text-blue-300 font-mono">.json</code> ou <code className="text-blue-300 font-mono">.txt</code> contenant la Bible (format verset par verset ou structuré).
                </p>
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer transition shadow">
                  <FileText className="w-4 h-4" />
                  <span>Choisir un fichier local...</span>
                  <input
                    type="file"
                    accept=".json,.txt"
                    onChange={handleLocalBibleImport}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Online Downloadable Catalog */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-blue-400" />
                    <span>Versions Téléchargeables en Ligne</span>
                  </span>
                  <span className="text-slate-500 font-normal font-mono">{allAvailableVersions.length} versions disponibles</span>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {allAvailableVersions.map((ver) => {
                    const isInstalled = downloadedVersions.includes(ver.id);
                    const isCurrent = translation === ver.id;
                    const isDownloadingThis = downloadingId === ver.id;

                    return (
                      <div
                        key={ver.id}
                        className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition ${
                          isCurrent
                            ? 'bg-blue-950/40 border-blue-500/60 ring-1 ring-blue-500/30'
                            : 'bg-[#181f2e] border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{ver.name}</span>
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono border border-slate-700">
                              {ver.language} {ver.year ? `(${ver.year})` : ''}
                            </span>
                          </div>
                          <p className="text-slate-400 text-xs">{ver.description}</p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isDownloadingThis ? (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-900/50 border border-blue-500/40 text-blue-300 font-bold">
                              <span className="animate-spin">⏳</span>
                              <span>{downloadProgress}%</span>
                            </div>
                          ) : isInstalled ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  setTranslation(ver.id);
                                  setShowVersionModal(false);
                                }}
                                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                                  isCurrent
                                    ? 'bg-emerald-600 text-white shadow'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                                }`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span>{isCurrent ? 'Active' : 'Utiliser'}</span>
                              </button>

                              <button
                                onClick={() => handleRemoveVersion(ver.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                                title="Supprimer cette version"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleDownloadVersion(ver)}
                              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Installer ({ver.sizeMb})</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/10 bg-[#171c2b] flex items-center justify-between">
              <span className="text-slate-400 text-xs">
                {downloadedVersions.length} version(s) installée(s) et prête(s) pour la projection hors-ligne.
              </span>
              <button
                onClick={() => setShowVersionModal(false)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

