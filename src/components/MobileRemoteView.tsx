import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  Tv, 
  BookOpen, 
  Music, 
  Book, 
  Search, 
  Smartphone, 
  Square, 
  LogOut, 
  ChevronLeft, 
  ChevronRight, 
  Wifi, 
  WifiOff, 
  Check, 
  Layers, 
  Sparkles, 
  Maximize2,
  Download,
  Info,
  X,
  RefreshCw,
  Zap,
  Sliders,
  Share2,
  Monitor,
  Hash,
  ArrowRight,
  Filter,
  ListFilter,
  CornerDownRight
} from 'lucide-react';
import { Sermon, Paragraphe, Recueil, Song, SongSection, BibleBook, BibleVerse, ProjectedData, ActiveModule } from '../types';
import { BIBLE_BOOKS, fetchRealBibleChapter, FEATURED_BIBLE_VERSES } from '../data/bibleLibrary';

// Common French Bible Book Abbreviations Mapping for Search-First Quick Jump
const BIBLE_ABBREVIATIONS: Record<string, string> = {
  'gen': 'genese', 'ge': 'genese', 'ex': 'exode', 'exo': 'exode', 'lev': 'levitique', 'le': 'levitique',
  'num': 'nombres', 'nom': 'nombres', 'deut': 'deuteronome', 'dt': 'deuteronome', 'jos': 'josue', 'jug': 'juges',
  'rt': 'ruth', '1sam': '1samuel', '2sam': '2samuel', '1rois': '1rois', '2rois': '2rois',
  '1chr': '1chroniques', '2chr': '2chroniques', 'esd': 'esdras', 'neh': 'nehemie', 'esth': 'esther',
  'ps': 'psaumes', 'psa': 'psaumes', 'psaume': 'psaumes', 'prov': 'proverbes', 'pr': 'proverbes',
  'eccl': 'ecclesiaste', 'ecc': 'ecclesiaste', 'cant': 'cantique', 'es': 'esaie', 'esa': 'esaie', 'isa': 'esaie',
  'jer': 'jeremie', 'lam': 'lamentations', 'eze': 'ezechiel', 'dan': 'daniel', 'dn': 'daniel',
  'ose': 'osee', 'joel': 'joel', 'am': 'amos', 'abd': 'abdias', 'jon': 'jonas', 'mich': 'michee',
  'nah': 'nahum', 'hab': 'habakuk', 'soph': 'sophonie', 'agg': 'aggee', 'zach': 'zacharie', 'mal': 'malachie',
  'mat': 'matthieu', 'mt': 'matthieu', 'mc': 'marc', 'mar': 'marc', 'lc': 'luc', 'lu': 'luc',
  'jn': 'jean', 'jhn': 'jean', 'act': 'actes', 'ac': 'actes', 'rom': 'romains', 'rm': 'romains',
  '1co': '1corinthiens', '1cor': '1corinthiens', '2co': '2corinthiens', '2cor': '2corinthiens',
  'gal': 'galates', 'eph': 'ephesiens', 'phil': 'philippiens', 'col': 'colossiens',
  '1th': '1thessaloniciens', '2th': '2thessaloniciens', '1tim': '1timothee', '2tim': '2timothee',
  'tit': 'tite', 'phlm': 'philemon', 'heb': 'hebreux', 'jac': 'jacques', '1p': '1pierre', '2p': '2pierre',
  '1jn': '1jean', '2jn': '2jean', '3jn': '3jean', 'jude': 'jude', 'apoc': 'apocalypse', 'rev': 'apocalypse'
};

// Helper to normalize strings (strips accents, punctuation, and handles case-insensitivity)
const normStr = (str?: string): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .replace(/['’\-–—.,!?:;()"]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

export const MobileRemoteView: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [projectedState, setProjectedState] = useState<ProjectedData | null>(null);

  // Active Remote Tab ('brochures' | 'lyrics' | 'bible')
  const [activeTab, setActiveTab] = useState<ActiveModule>('brochures');

  // --- MODULE 1: PRÉDICATIONS / BROCHURES ---
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [selectedSermon, setSelectedSermon] = useState<Sermon | null>(null);
  const [paragraphes, setParagraphes] = useState<Paragraphe[]>([]);
  const [sermonSearch, setSermonSearch] = useState('');
  const [paraTextSearch, setParaTextSearch] = useState('');
  const [paraJumpInput, setParaJumpInput] = useState('');
  const [loadingSermons, setLoadingSermons] = useState(false);
  const [loadingParas, setLoadingParas] = useState(false);

  // --- MODULE 2: CANTIQUES / LYRICS ---
  const [recueils, setRecueils] = useState<Recueil[]>([]);
  const [selectedRecueilId, setSelectedRecueilId] = useState<string>('ALL');
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [songSearch, setSongSearch] = useState('');
  const [songNumJumpInput, setSongNumJumpInput] = useState('');
  const [loadingSongs, setLoadingSongs] = useState(false);

  // --- MODULE 3: BIBLE ---
  const [selectedBook, setSelectedBook] = useState<BibleBook>(BIBLE_BOOKS.find(b => b.id === 'jean') || BIBLE_BOOKS[0]);
  const [selectedChapter, setSelectedChapter] = useState<number>(3);
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [loadingVerses, setLoadingVerses] = useState(false);
  const [bibleSmartQuery, setBibleSmartQuery] = useState('');
  const [bookSearchQuery, setBookSearchQuery] = useState('');
  const [verseJumpInput, setVerseJumpInput] = useState('');
  const [bibleTestamentFilter, setBibleTestamentFilter] = useState<'ALL' | 'OT' | 'NT'>('ALL');

  // Info Modal & Server LAN URL
  const [showPwaInfo, setShowPwaInfo] = useState(false);
  const [serverUrl, setServerUrl] = useState<string>(() => localStorage.getItem('maandiko_server_url') || '');
  const [editingServerUrl, setEditingServerUrl] = useState<string>(serverUrl);
  const [testingConnection, setTestingConnection] = useState<boolean>(false);
  const [connectionTestMsg, setConnectionTestMsg] = useState<{ success: boolean; text: string } | null>(null);
  const [networkIpAddresses, setNetworkIpAddresses] = useState<string[]>([]);

  // Dynamic URL Resolvers for LAN & APK
  const getApiUrl = (endpoint: string): string => {
    const target = serverUrl.trim();
    if (!target) return endpoint;
    const cleanServer = (target.startsWith('http://') || target.startsWith('https://')) ? target : `http://${target}`;
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${cleanServer.replace(/\/+$/, '')}${cleanEndpoint}`;
  };

  const getSocketUrl = (): string | undefined => {
    const target = serverUrl.trim();
    if (!target) return undefined;
    return (target.startsWith('http://') || target.startsWith('https://')) ? target : `http://${target}`;
  };

  // Socket Connection setup
  useEffect(() => {
    const targetUrl = getSocketUrl();
    const s = targetUrl 
      ? io(targetUrl, { transports: ['websocket', 'polling'], reconnectionAttempts: 10 }) 
      : io({ transports: ['websocket', 'polling'] });
    setSocket(s);

    s.on('connect', () => {
      setIsConnected(true);
      setConnectionTestMsg({ success: true, text: 'Connecté au serveur MaAndiko en temps réel !' });
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    s.on('connect_error', () => {
      setIsConnected(false);
    });

    s.on('afficher-paragraphe', (data: ProjectedData) => {
      setProjectedState(data);
    });

    return () => {
      s.disconnect();
    };
  }, [serverUrl]);

  // Fetch initial Sermons & Recueils
  useEffect(() => {
    fetchSermons();
    fetchRecueilsAndSongs();
  }, [serverUrl]);

  // Test Server LAN Connection
  const testServerConnection = async (urlToTest?: string) => {
    setTestingConnection(true);
    setConnectionTestMsg(null);
    const testUrl = urlToTest !== undefined ? urlToTest : editingServerUrl;
    
    let target = testUrl.trim();
    let fullUrl = '/api/network-info';
    if (target) {
      const cleanServer = (target.startsWith('http://') || target.startsWith('https://')) ? target : `http://${target}`;
      fullUrl = `${cleanServer.replace(/\/+$/, '')}/api/network-info`;
    }

    try {
      const res = await fetch(fullUrl, { method: 'GET', headers: { 'Accept': 'application/json' } });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.addresses)) {
          setNetworkIpAddresses(data.addresses);
        }
        setConnectionTestMsg({ 
          success: true, 
          text: `Connexion LAN réussie ! (Serveur: ${data.hostname || 'MaAndiko Studio'})` 
        });
      } else {
        setConnectionTestMsg({ success: false, text: `Serveur joint mais code retour ${res.status}` });
      }
    } catch (err: any) {
      setConnectionTestMsg({ 
        success: false, 
        text: `Échec : Impossible de joindre ${testUrl || 'ce serveur'}. Vérifiez votre réseau Wi-Fi LAN et le port 3000.` 
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const saveServerUrl = (newUrl: string) => {
    const trimmed = newUrl.trim();
    setServerUrl(trimmed);
    setEditingServerUrl(trimmed);
    localStorage.setItem('maandiko_server_url', trimmed);
  };

  // Load sermon paragraphs when a sermon is selected
  useEffect(() => {
    if (selectedSermon) {
      fetchParagraphes(selectedSermon.id);
    }
  }, [selectedSermon]);

  // Load Bible Chapter when book or chapter changes
  useEffect(() => {
    loadBibleChapter(selectedBook.id, selectedChapter);
  }, [selectedBook, selectedChapter]);

  // Data Fetchers
  const fetchSermons = async () => {
    setLoadingSermons(true);
    try {
      const res = await fetch(getApiUrl('/api/sermons'));
      if (res.ok) {
        const data = await res.json();
        setSermons(data);
        if (data.length > 0 && !selectedSermon) {
          setSelectedSermon(data[0]);
        }
      }
    } catch (e) {
      console.error('Error fetching sermons:', e);
    } finally {
      setLoadingSermons(false);
    }
  };

  const fetchParagraphes = async (sermonId: string) => {
    setLoadingParas(true);
    try {
      const res = await fetch(getApiUrl(`/api/sermons/${sermonId}/paragraphes`));
      if (res.ok) {
        const data = await res.json();
        setParagraphes(data);
      }
    } catch (e) {
      console.error('Error fetching paragraphes:', e);
    } finally {
      setLoadingParas(false);
    }
  };

  const fetchRecueilsAndSongs = async () => {
    setLoadingSongs(true);
    try {
      const resRec = await fetch(getApiUrl('/api/recueils'));
      if (resRec.ok) {
        const dataRec = await resRec.json();
        setRecueils(dataRec);
      }
      const resSongs = await fetch(getApiUrl('/api/songs'));
      if (resSongs.ok) {
        const dataSongs = await resSongs.json();
        setSongs(dataSongs);
        if (dataSongs.length > 0 && !selectedSong) {
          setSelectedSong(dataSongs[0]);
        }
      }
    } catch (e) {
      console.error('Error fetching lyrics:', e);
    } finally {
      setLoadingSongs(false);
    }
  };

  const loadBibleChapter = async (bookId: string, chapterNum: number) => {
    setLoadingVerses(true);
    try {
      const chapterData = await fetchRealBibleChapter(bookId, chapterNum, 'LSG');
      setVerses(chapterData);
    } catch (e) {
      console.error('Error loading Bible chapter:', e);
    } finally {
      setLoadingVerses(false);
    }
  };

  // --- PROJECTION ACTION HANDLER ---
  const emitProjection = (
    sermonId: string, 
    numero: number | string, 
    texte: string, 
    titleOverride?: string,
    moduleName: ActiveModule = activeTab
  ) => {
    const payload: ProjectedData = {
      sermonId,
      numero,
      texte,
      titre_francais: titleOverride || 'Télécommande',
      module: moduleName,
      animPhase: 'ENTERING',
      timestamp: Date.now()
    };

    setProjectedState(payload);

    if (socket) {
      socket.emit('projeter-paragraphe', payload);
    }
  };

  const handleBlackout = () => {
    const payload: ProjectedData = {
      sermonId: 'BLACK',
      numero: 0,
      texte: '',
      animPhase: 'OUT',
      timestamp: Date.now()
    };
    setProjectedState(payload);
    if (socket) {
      socket.emit('projeter-paragraphe', payload);
    }
  };

  const handleOutAnimation = () => {
    if (!projectedState || projectedState.sermonId === 'BLACK') return;
    const payload: ProjectedData = {
      ...projectedState,
      animPhase: 'EXITING',
      timestamp: Date.now()
    };
    setProjectedState(payload);
    if (socket) {
      socket.emit('projeter-paragraphe', payload);
    }

    setTimeout(() => {
      const cleared: ProjectedData = {
        sermonId: 'BLACK',
        numero: 0,
        texte: '',
        animPhase: 'OUT',
        timestamp: Date.now()
      };
      setProjectedState(cleared);
      if (socket) {
        socket.emit('projeter-paragraphe', cleared);
      }
    }, 550);
  };

  // --- QUICK NEXT / PREVIOUS STEPPING LOGIC ---
  const handleNextItem = () => {
    if (!projectedState || projectedState.sermonId === 'BLACK') return;

    if (activeTab === 'brochures' && selectedSermon) {
      const currentNum = parseInt(String(projectedState.numero), 10);
      const nextP = paragraphes.find(p => p.numero_paragraphe === currentNum + 1);
      if (nextP) {
        emitProjection(selectedSermon.id, nextP.numero_paragraphe, nextP.texte, selectedSermon.titre_francais, 'brochures');
      }
    } else if (activeTab === 'lyrics' && selectedSong) {
      const currentCardNum = String(projectedState.numero); // e.g. "304-1"
      const parts = currentCardNum.split('-');
      if (parts.length === 2) {
        const nextIdx = parseInt(parts[1], 10);
        if (nextIdx < selectedSong.sections.length) {
          const sec = selectedSong.sections[nextIdx];
          const newCardNum = `${selectedSong.number}-${nextIdx + 1}`;
          emitProjection(`SONG-${selectedSong.id}`, newCardNum, sec.text, `N°${selectedSong.number} - ${selectedSong.title} (${sec.label})`, 'lyrics');
        }
      }
    } else if (activeTab === 'bible') {
      const currentV = parseInt(String(projectedState.numero), 10);
      const nextV = verses.find(v => v.verse === currentV + 1);
      if (nextV) {
        const verseId = `BIBLE-${selectedBook.id}-${selectedChapter}`;
        emitProjection(verseId, nextV.verse, nextV.text, `${selectedBook.name} ${selectedChapter}:${nextV.verse}`, 'bible');
      }
    }
  };

  const handlePrevItem = () => {
    if (!projectedState || projectedState.sermonId === 'BLACK') return;

    if (activeTab === 'brochures' && selectedSermon) {
      const currentNum = parseInt(String(projectedState.numero), 10);
      const prevP = paragraphes.find(p => p.numero_paragraphe === currentNum - 1);
      if (prevP) {
        emitProjection(selectedSermon.id, prevP.numero_paragraphe, prevP.texte, selectedSermon.titre_francais, 'brochures');
      }
    } else if (activeTab === 'lyrics' && selectedSong) {
      const currentCardNum = String(projectedState.numero);
      const parts = currentCardNum.split('-');
      if (parts.length === 2) {
        const currentIdx = parseInt(parts[1], 10) - 1;
        if (currentIdx > 0) {
          const sec = selectedSong.sections[currentIdx - 1];
          const newCardNum = `${selectedSong.number}-${currentIdx}`;
          emitProjection(`SONG-${selectedSong.id}`, newCardNum, sec.text, `N°${selectedSong.number} - ${selectedSong.title} (${sec.label})`, 'lyrics');
        }
      }
    } else if (activeTab === 'bible') {
      const currentV = parseInt(String(projectedState.numero), 10);
      const prevV = verses.find(v => v.verse === currentV - 1);
      if (prevV) {
        const verseId = `BIBLE-${selectedBook.id}-${selectedChapter}`;
        emitProjection(verseId, prevV.verse, prevV.text, `${selectedBook.name} ${selectedChapter}:${prevV.verse}`, 'bible');
      }
    }
  };

  // --- PARAGRAPH JUMP ACTION ---
  const handleParagraphJump = (targetNumStr?: string) => {
    const num = parseInt(targetNumStr || paraJumpInput, 10);
    if (!num || isNaN(num) || !selectedSermon) return;

    const matchedP = paragraphes.find(p => p.numero_paragraphe === num);
    if (matchedP) {
      emitProjection(selectedSermon.id, matchedP.numero_paragraphe, matchedP.texte, selectedSermon.titre_francais, 'brochures');
      const el = document.getElementById(`para-card-${num}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    setParaJumpInput('');
  };

  // --- SONG NUMBER QUICK DIAL JUMP ---
  const handleSongJumpByNumber = (numStr?: string) => {
    const target = normStr(numStr || songNumJumpInput);
    if (!target) return;

    const matchedSong = songs.find(s => 
      normStr(s.number) === target || 
      normStr(s.number) === normStr(target) || 
      normStr(s.title).startsWith(target)
    );
    if (matchedSong) {
      setSelectedSong(matchedSong);
      if (matchedSong.sections && matchedSong.sections.length > 0) {
        const sec = matchedSong.sections[0];
        const cardNum = `${matchedSong.number}-1`;
        emitProjection(`SONG-${matchedSong.id}`, cardNum, sec.text, `N°${matchedSong.number} - ${matchedSong.title} (${sec.label})`, 'lyrics');
      }
    }
    setSongNumJumpInput('');
  };

  // --- BIBLE SMART REFERENCE PARSER & SEARCH ---
  const handleBibleSmartSearch = (rawQuery: string) => {
    setBibleSmartQuery(rawQuery);
    if (!rawQuery || !rawQuery.trim()) return;

    const cleaned = normStr(rawQuery);

    // 1. Check direct book match e.g. "romains", "genese", "psaumes", "esaie", "matthieu", "apocalypse"
    const matchedBookByName = BIBLE_BOOKS.find(b => {
      const bNorm = normStr(b.name);
      return bNorm === cleaned || b.id === cleaned || (cleaned.length >= 3 && bNorm.startsWith(cleaned));
    });

    if (matchedBookByName) {
      setSelectedBook(matchedBookByName);
      setSelectedChapter(1);
      return;
    }

    // 2. Check reference pattern e.g. "jean 3:16", "jn 3", "2 cor 5:17", "ps 23", "genese 1", "1 jean 2 1"
    const match = cleaned.match(/^((?:\d\s*)?[a-z]+)\s*(\d+)?(?:\s+|\s*[:.v]\s*)?(\d+)?$/);

    if (match) {
      const rawBook = match[1].replace(/\s+/g, '');
      const chNum = match[2] ? parseInt(match[2], 10) : 1;
      const vNum = match[3] ? parseInt(match[3], 10) : null;

      let foundBook = BIBLE_BOOKS.find(b => 
        b.id === rawBook || 
        normStr(b.name).replace(/\s+/g, '') === rawBook
      );

      if (!foundBook && BIBLE_ABBREVIATIONS[rawBook]) {
        const bookId = BIBLE_ABBREVIATIONS[rawBook];
        foundBook = BIBLE_BOOKS.find(b => b.id === bookId);
      }

      if (!foundBook) {
        foundBook = BIBLE_BOOKS.find(b => 
          normStr(b.name).replace(/\s+/g, '').startsWith(rawBook)
        );
      }

      if (foundBook) {
        setSelectedBook(foundBook);
        const validCh = Math.max(1, Math.min(chNum, foundBook.chaptersCount));
        setSelectedChapter(validCh);

        if (vNum) {
          setVerseJumpInput(String(vNum));
          setTimeout(() => {
            const el = document.getElementById(`verse-card-${vNum}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 350);
        }
      }
    }
  };

  // --- FILTERING DATA FOR SEARCH-FIRST EXPERIENCE ---
  const filteredSermons = sermons.filter(s => {
    if (!sermonSearch.trim()) return true;
    const q = normStr(sermonSearch);
    return (
      normStr(s.titre_francais).includes(q) ||
      normStr(s.titre_original).includes(q) ||
      normStr(s.date_sermon).includes(q) ||
      normStr(s.id).includes(q) ||
      normStr(s.lieu).includes(q)
    );
  });

  const filteredParagraphes = paragraphes.filter(p => {
    if (!paraTextSearch.trim()) return true;
    const q = normStr(paraTextSearch);
    return String(p.numero_paragraphe) === q || normStr(p.texte).includes(q);
  });

  const filteredSongs = songs.filter(song => {
    const matchesRecueil = selectedRecueilId === 'ALL' || song.recueil_id === selectedRecueilId;
    if (!songSearch.trim()) return matchesRecueil;

    const q = normStr(songSearch);
    const matchesNum = normStr(song.number).includes(q);
    const matchesTitle = normStr(song.title).includes(q);
    const matchesText = song.sections ? song.sections.some(sec => normStr(sec.text).includes(q)) : false;

    return (matchesNum || matchesTitle || matchesText) && matchesRecueil;
  });

  // Auto-select first matching song if current selection is outside active search query
  useEffect(() => {
    if (songSearch.trim() && filteredSongs.length > 0) {
      if (!selectedSong || !filteredSongs.some(s => s.id === selectedSong.id)) {
        setSelectedSong(filteredSongs[0]);
      }
    }
  }, [songSearch, selectedRecueilId]);

  // Auto-select first matching sermon if current selection is outside active search query
  useEffect(() => {
    if (sermonSearch.trim() && filteredSermons.length > 0) {
      if (!selectedSermon || !filteredSermons.some(s => s.id === selectedSermon.id)) {
        setSelectedSermon(filteredSermons[0]);
      }
    }
  }, [sermonSearch]);

  const filteredBooks = BIBLE_BOOKS.filter(b => {
    const matchesTestament = bibleTestamentFilter === 'ALL' || b.testament === bibleTestamentFilter;
    if (!bookSearchQuery.trim()) return matchesTestament;

    const q = normStr(bookSearchQuery);
    const matchesSearch = normStr(b.name).includes(q) || b.id.includes(q);
    return matchesTestament && matchesSearch;
  });

  const filteredVerses = verses.filter(v => {
    if (!bibleSmartQuery.trim()) return true;
    const q = normStr(bibleSmartQuery);

    if (/^\d+$/.test(q)) {
      return String(v.verse) === q || normStr(v.text).includes(q);
    }

    if (q.includes(':') || q.includes('.')) {
      return true; // Reference mode
    }

    return normStr(v.text).includes(q);
  });

  const isCurrentLive = (sermonId: string, num: number | string) => {
    if (!projectedState || projectedState.sermonId === 'BLACK') return false;
    return projectedState.sermonId === sermonId && String(projectedState.numero) === String(num);
  };

  return (
    <div className="min-h-[100dvh] h-[100dvh] w-full bg-[#030509] flex flex-col items-center justify-start overflow-hidden font-sans select-none">
      <div className="w-full max-w-2xl h-full flex flex-col bg-[#070a12] sm:border-x sm:border-slate-800/80 sm:shadow-2xl overflow-hidden">
      
      {/* 1. TOP CONTROL BAR */}
      <header className="bg-slate-900/95 backdrop-blur border-b border-slate-800 p-2.5 sm:p-3 shrink-0 shadow-lg z-30">
        <div className="flex items-center justify-between gap-2">
          {/* App Title & Remote Badge */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-sky-500 text-white shadow-md">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold tracking-tight text-white leading-none">MaAndiko Remote</h1>
                <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${isConnected ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                  {isConnected ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
                  {isConnected ? 'Connecté' : 'Hors-ligne'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Télécommande Mobile Multi-Recherche</p>
            </div>
          </div>

          {/* Quick Action Info / Emergency Black / Studio */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleOutAnimation}
              disabled={!projectedState || projectedState.sermonId === 'BLACK'}
              className="px-2 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
              title="Animation de Sortie"
            >
              <LogOut className="w-3 h-3" />
              <span>OUT</span>
            </button>

            <button
              onClick={handleBlackout}
              className="px-2 py-1 rounded-md bg-red-600/30 hover:bg-red-600/50 text-red-300 border border-red-500/40 text-xs font-bold flex items-center gap-1 transition-all active:scale-95"
              title="Obscurcir l'écran immédiatement"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>NOIR</span>
            </button>

            <button 
              onClick={() => setShowPwaInfo(true)}
              className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs flex items-center gap-1 transition-colors"
              title="Informations Application Mobile / APK"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">APK</span>
            </button>

            <a 
              href="/?mode=studio"
              className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs flex items-center gap-1 transition-colors cursor-pointer"
              title="Ouvrir la Console Studio Principale"
            >
              <Monitor className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Studio</span>
            </a>
          </div>
        </div>
      </header>

      {/* 2. MODULE NAVIGATION TABS */}
      <nav className="flex items-center bg-slate-900 border-b border-slate-800 shrink-0">
        <button
          onClick={() => setActiveTab('brochures')}
          className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-2 text-xs font-bold transition-all relative ${
            activeTab === 'brochures' 
              ? 'text-sky-400 bg-slate-800/80 border-b-2 border-sky-500' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>PRÉDICATIONS</span>
          {sermons.length > 0 && (
            <span className="text-[10px] bg-slate-700/80 text-slate-300 px-1.5 py-0.2 rounded-full">
              {sermons.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('lyrics')}
          className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-2 text-xs font-bold transition-all relative ${
            activeTab === 'lyrics' 
              ? 'text-amber-400 bg-slate-800/80 border-b-2 border-amber-500' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Music className="w-4 h-4" />
          <span>CANTIQUES</span>
          {songs.length > 0 && (
            <span className="text-[10px] bg-slate-700/80 text-slate-300 px-1.5 py-0.2 rounded-full">
              {songs.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('bible')}
          className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-2 text-xs font-bold transition-all relative ${
            activeTab === 'bible' 
              ? 'text-emerald-400 bg-slate-800/80 border-b-2 border-emerald-500' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Book className="w-4 h-4" />
          <span>SAINTE BIBLE</span>
        </button>
      </nav>

      {/* 3. MAIN TAB CONTENT PANELS */}
      <main className="flex-1 overflow-hidden relative bg-[#070a12]">
        
        {/* ================= MODULE 1: PRÉDICATIONS / BROCHURES ================= */}
        {activeTab === 'brochures' && (
          <div className="flex flex-col h-full">
            
            {/* Top Search & Fast Paragraph Jump Bar */}
            <div className="p-2.5 bg-slate-900/80 border-b border-slate-800 flex flex-col gap-2 shrink-0">
              
              {/* Search Bar for Sermons */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Chercher par titre, date, code (ex: 63-0630, Chef-d'œuvre)..."
                    value={sermonSearch}
                    onChange={(e) => setSermonSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                  {sermonSearch && (
                    <button 
                      onClick={() => setSermonSearch('')}
                      className="absolute right-2.5 top-2.5 text-slate-500 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Sermon Selection Dropdown for instant access */}
                <select
                  value={selectedSermon?.id || ''}
                  onChange={(e) => {
                    const found = sermons.find(s => s.id === e.target.value);
                    if (found) setSelectedSermon(found);
                  }}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-xs font-bold text-sky-300 max-w-[140px] truncate focus:outline-none focus:border-sky-500"
                >
                  {filteredSermons.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.titre_francais}
                    </option>
                  ))}
                </select>
              </div>

              {/* Matching Sermons Quick Result Carousel when searching */}
              {sermonSearch.trim() && filteredSermons.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-slate-800/60">
                  <span className="text-[10px] text-sky-400 font-bold shrink-0">Résultats ({filteredSermons.length}):</span>
                  {filteredSermons.slice(0, 15).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSelectedSermon(s);
                      }}
                      className={`shrink-0 px-2.5 py-1 rounded-lg border text-xs font-semibold text-left transition ${
                        selectedSermon?.id === s.id
                          ? 'bg-sky-500/20 border-sky-500 text-sky-200'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className="truncate max-w-[130px] inline-block font-bold">{s.titre_francais}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Direct Paragraph Jump & In-Sermon Text Search */}
              <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60">
                {/* Direct Paragraph Number Input */}
                <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 shrink-0">
                  <Hash className="w-3.5 h-3.5 text-sky-400" />
                  <input
                    type="number"
                    placeholder="N° Para"
                    value={paraJumpInput}
                    onChange={(e) => setParaJumpInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleParagraphJump()}
                    className="w-16 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none font-mono font-bold"
                  />
                  <button
                    onClick={() => handleParagraphJump()}
                    className="px-2 py-0.5 rounded bg-sky-500 hover:bg-sky-400 text-slate-950 text-[11px] font-bold"
                  >
                    Sauter
                  </button>
                </div>

                {/* Filter Text within Selected Sermon */}
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Filtrer texte du paragraphe..."
                    value={paraTextSearch}
                    onChange={(e) => setParaTextSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                  {paraTextSearch && (
                    <button onClick={() => setParaTextSearch('')} className="absolute right-2 top-1.5 text-slate-500">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Fast Paragraph Number Jump Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
                <span className="text-[10px] text-slate-400 font-medium shrink-0">Saut Rapide:</span>
                {[1, 10, 25, 50, 75, 100, 150, 200].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleParagraphJump(String(num))}
                    className="shrink-0 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-[11px] font-mono font-semibold border border-slate-700"
                  >
                    #{num}
                  </button>
                ))}
              </div>

            </div>

            {/* Paragraph Cards List - Instant Tap Projection */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {loadingParas ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-sky-400" />
                  <span className="text-xs">Chargement des paragraphes...</span>
                </div>
              ) : selectedSermon && filteredParagraphes.length > 0 ? (
                <>
                  <div className="flex items-center justify-between text-xs text-slate-400 px-1 mb-1">
                    <span className="font-bold text-slate-200 truncate">{selectedSermon.titre_francais}</span>
                    <span className="shrink-0">{filteredParagraphes.length} / {paragraphes.length} Paragraphes</span>
                  </div>

                  {filteredParagraphes.map((p) => {
                    const isLive = selectedSermon && isCurrentLive(selectedSermon.id, p.numero_paragraphe);
                    return (
                      <div
                        id={`para-card-${p.numero_paragraphe}`}
                        key={p.numero_paragraphe}
                        onClick={() => emitProjection(
                          selectedSermon.id, 
                          p.numero_paragraphe, 
                          p.texte, 
                          selectedSermon.titre_francais,
                          'brochures'
                        )}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer active:scale-[0.98] shadow-sm relative group ${
                          isLive 
                            ? 'bg-gradient-to-r from-sky-950/90 to-slate-900 border-sky-500 ring-2 ring-sky-500/30' 
                            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-black tracking-wider ${
                            isLive ? 'bg-sky-500 text-slate-950 shadow' : 'bg-slate-800 text-slate-300'
                          }`}>
                            #{p.numero_paragraphe}
                          </span>

                          {isLive ? (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30 animate-pulse">
                              <Zap className="w-3 h-3" />
                              EN DIRECT
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                              Projeter <ArrowRight className="w-3 h-3" />
                            </span>
                          )}
                        </div>

                        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-serif">
                          {p.texte}
                        </p>
                      </div>
                    );
                  })}
                </>
              ) : (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Aucun paragraphe correspondant aux critères de recherche.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= MODULE 2: CANTIQUES ================= */}
        {activeTab === 'lyrics' && (
          <div className="flex flex-col h-full">
            
            {/* Direct Song Number Jump Dial & Multi-Field Search */}
            <div className="p-2.5 bg-slate-900/80 border-b border-slate-800 flex flex-col gap-2 shrink-0">
              
              <div className="flex items-center gap-2">
                {/* Quick Song Number Dial Input */}
                <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 shrink-0">
                  <span className="text-xs font-bold text-amber-400">N°</span>
                  <input
                    type="text"
                    placeholder="304..."
                    value={songNumJumpInput}
                    onChange={(e) => setSongNumJumpInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSongJumpByNumber()}
                    className="w-16 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none font-mono font-bold"
                  />
                  <button
                    onClick={() => handleSongJumpByNumber()}
                    className="px-2 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition cursor-pointer"
                  >
                    Go
                  </button>
                </div>

                {/* Global Song & Lyrics Multi-Search Box */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Chercher par titre, numéro ou paroles..."
                    value={songSearch}
                    onChange={(e) => setSongSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  {songSearch && (
                    <button onClick={() => setSongSearch('')} className="absolute right-2.5 top-2.5 text-slate-500">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Recueil Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
                <button
                  onClick={() => setSelectedRecueilId('ALL')}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition shrink-0 ${
                    selectedRecueilId === 'ALL'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  Tous ({songs.length})
                </button>
                {recueils.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRecueilId(r.id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition shrink-0 ${
                      selectedRecueilId === r.id
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {r.nom}
                  </button>
                ))}
              </div>

              {/* Filtered Songs Fast Carousel Selector */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-1 border-t border-slate-800/60">
                {filteredSongs.slice(0, 40).map((song) => {
                  const isSel = selectedSong?.id === song.id;
                  return (
                    <button
                      key={song.id}
                      onClick={() => setSelectedSong(song)}
                      className={`shrink-0 px-2.5 py-1 rounded-lg border text-xs font-medium text-left transition-all ${
                        isSel 
                          ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-md' 
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className="font-bold text-amber-400 mr-1">N°{song.number}</span>
                      <span className="truncate max-w-[120px] inline-block align-bottom">{song.title}</span>
                    </button>
                  );
                })}
              </div>

            </div>

            {/* Song Strophes Cards Container */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {selectedSong ? (
                <>
                  <div className="flex items-center justify-between text-xs text-slate-400 px-1 mb-1">
                    <span className="font-bold text-amber-300">N°{selectedSong.number} - {selectedSong.title}</span>
                    <span>{selectedSong.sections.length} Strophes / Refrains</span>
                  </div>

                  {selectedSong.sections.map((sec, idx) => {
                    const cardNum = `${selectedSong.number}-${idx + 1}`;
                    const isLive = isCurrentLive(`SONG-${selectedSong.id}`, cardNum);
                    
                    return (
                      <div
                        key={sec.id || idx}
                        onClick={() => emitProjection(
                          `SONG-${selectedSong.id}`,
                          cardNum,
                          sec.text,
                          `N°${selectedSong.number} - ${selectedSong.title} (${sec.label})`,
                          'lyrics'
                        )}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer active:scale-[0.98] shadow-sm relative ${
                          isLive 
                            ? 'bg-gradient-to-r from-amber-950/90 to-slate-900 border-amber-500 ring-2 ring-amber-500/30' 
                            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                            sec.type === 'Refrain'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-slate-800 text-slate-300'
                          }`}>
                            {sec.label}
                          </span>

                          {isLive ? (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30 animate-pulse">
                              <Zap className="w-3 h-3" />
                              EN DIRECT
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                              Projeter <ArrowRight className="w-3 h-3" />
                            </span>
                          )}
                        </div>

                        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-line">
                          {sec.text}
                        </p>
                      </div>
                    );
                  })}
                </>
              ) : (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Aucun cantique trouvé pour cette recherche.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= MODULE 3: SAINTE BIBLE ================= */}
        {activeTab === 'bible' && (
          <div className="flex flex-col h-full">
            
            {/* Smart Scripture Command Input & Book/Chapter Fast Selectors */}
            <div className="p-2.5 bg-slate-900/80 border-b border-slate-800 flex flex-col gap-2 shrink-0">
              
              {/* Smart Reference Parser Input */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-emerald-400" />
                <input
                  type="text"
                  placeholder='Recherche Intelligente (ex: "Jean 3:16", "2 Cor 5", "Ps 23", "Dieu a tant aimé")...'
                  value={bibleSmartQuery}
                  onChange={(e) => handleBibleSmartSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
                />
                {bibleSmartQuery && (
                  <button onClick={() => setBibleSmartQuery('')} className="absolute right-2.5 top-2.5 text-slate-500">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Book Search Combobox & Testament Filter */}
              <div className="flex items-center gap-1.5">
                
                {/* Testament Filter Pills */}
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 shrink-0">
                  <button
                    onClick={() => setBibleTestamentFilter('ALL')}
                    className={`px-1.5 py-1 rounded text-[10px] font-bold transition ${bibleTestamentFilter === 'ALL' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                  >
                    Tous
                  </button>
                  <button
                    onClick={() => setBibleTestamentFilter('OT')}
                    className={`px-1.5 py-1 rounded text-[10px] font-bold transition ${bibleTestamentFilter === 'OT' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                  >
                    A.T
                  </button>
                  <button
                    onClick={() => setBibleTestamentFilter('NT')}
                    className={`px-1.5 py-1 rounded text-[10px] font-bold transition ${bibleTestamentFilter === 'NT' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                  >
                    N.T
                  </button>
                </div>

                {/* Filter Input for Books */}
                <input
                  type="text"
                  placeholder="Livre (ex: Cor, Rom)..."
                  value={bookSearchQuery}
                  onChange={(e) => setBookSearchQuery(e.target.value)}
                  className="w-28 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-emerald-300 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
                />

                {/* Filterable Book Select */}
                <select
                  value={selectedBook.id}
                  onChange={(e) => {
                    const b = BIBLE_BOOKS.find(item => item.id === e.target.value);
                    if (b) {
                      setSelectedBook(b);
                      setSelectedChapter(1);
                    }
                  }}
                  className="flex-1 min-w-[120px] bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs font-bold text-emerald-300 focus:outline-none focus:border-emerald-500 truncate"
                >
                  {filteredBooks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.chaptersCount} ch)
                    </option>
                  ))}
                </select>
              </div>

              {/* Chapters Horizontal Scroll Bar */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1">
                <span className="text-[10px] font-bold text-emerald-400 shrink-0 mr-1">Chapitre:</span>
                {Array.from({ length: selectedBook.chaptersCount }, (_, i) => i + 1).map((ch) => (
                  <button
                    key={ch}
                    onClick={() => setSelectedChapter(ch)}
                    className={`w-7 h-7 rounded-md shrink-0 text-xs font-bold flex items-center justify-center transition-all ${
                      selectedChapter === ch 
                        ? 'bg-emerald-500 text-slate-950 shadow-md scale-105' 
                        : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {ch}
                  </button>
                ))}
              </div>

            </div>

            {/* Verses List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {loadingVerses ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                  <span className="text-xs">Chargement du chapitre {selectedBook.name} {selectedChapter}...</span>
                </div>
              ) : filteredVerses.length > 0 ? (
                <>
                  <div className="flex items-center justify-between text-xs text-slate-400 px-1 mb-1">
                    <span className="font-bold text-emerald-300">{selectedBook.name} {selectedChapter}</span>
                    <span>{filteredVerses.length} Versets</span>
                  </div>

                  {filteredVerses.map((v) => {
                    const verseId = `BIBLE-${selectedBook.id}-${selectedChapter}`;
                    const isLive = isCurrentLive(verseId, v.verse);

                    return (
                      <div
                        id={`verse-card-${v.verse}`}
                        key={v.verse}
                        onClick={() => emitProjection(
                          verseId,
                          v.verse,
                          v.text,
                          `${selectedBook.name} ${selectedChapter}:${v.verse}`,
                          'bible'
                        )}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer active:scale-[0.98] shadow-sm relative ${
                          isLive 
                            ? 'bg-gradient-to-r from-emerald-950/90 to-slate-900 border-emerald-500 ring-2 ring-emerald-500/30' 
                            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-black ${
                            isLive ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-emerald-400'
                          }`}>
                            V. {v.verse}
                          </span>

                          {isLive ? (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30 animate-pulse">
                              <Zap className="w-3 h-3" />
                              EN DIRECT
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                              Projeter <ArrowRight className="w-3 h-3" />
                            </span>
                          )}
                        </div>

                        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-serif">
                          {v.text}
                        </p>
                      </div>
                    );
                  })}
                </>
              ) : (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Aucun verset trouvé pour cette recherche.
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* 4. PWA / INSTALL / LAN CONFIG MODAL */}
      {showPwaInfo && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl relative max-h-[92vh] flex flex-col my-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 text-white shadow-lg">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Télécommande Mobile & Réseau LAN</h3>
                  <p className="text-[11px] text-slate-400">Configuration IP & Génération APK Android</p>
                </div>
              </div>
              <button
                onClick={() => setShowPwaInfo(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto pr-1 text-xs text-slate-300 leading-relaxed">
              
              {/* 1. LAN SERVER CONFIGURATION CARD */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sky-300 flex items-center gap-1.5 text-xs">
                    <Wifi className="w-4 h-4 text-sky-400" />
                    <span>Adresse du Serveur MaAndiko (LAN)</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isConnected ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {isConnected ? '✓ Connecté' : '✗ Déconnecté'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400">
                  Si l'application tourne sur un smartphone connecté au Wi-Fi de l'église, saisissez l'adresse IP de l'ordinateur MaAndiko Studio (ex: <code className="text-sky-300 font-mono">192.168.1.100:3000</code>).
                </p>

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="ex: 192.168.1.100:3000"
                      value={editingServerUrl}
                      onChange={(e) => setEditingServerUrl(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
                    />
                    <button
                      onClick={() => saveServerUrl(editingServerUrl)}
                      className="px-3 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-lg text-xs transition-colors shrink-0"
                    >
                      Enregistrer
                    </button>
                  </div>

                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <button
                      onClick={() => testServerConnection(editingServerUrl)}
                      disabled={testingConnection}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-[11px] font-semibold transition flex items-center gap-1.5"
                    >
                      {testingConnection ? <RefreshCw className="w-3 h-3 animate-spin text-sky-400" /> : <Zap className="w-3 h-3 text-amber-400" />}
                      <span>Tester la connexion</span>
                    </button>

                    {serverUrl && (
                      <button
                        onClick={() => saveServerUrl('')}
                        className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 rounded-lg text-[11px] font-medium transition"
                      >
                        Réinitialiser (Origine locale)
                      </button>
                    )}
                  </div>

                  {connectionTestMsg && (
                    <div className={`p-2 rounded-lg text-[11px] font-medium border ${
                      connectionTestMsg.success ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-red-500/10 text-red-300 border-red-500/30'
                    }`}>
                      {connectionTestMsg.text}
                    </div>
                  )}
                </div>
              </div>

              {/* 2. GITHUB ACTION APK BUILD INSTRUCTIONS */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                <div className="font-bold text-amber-300 flex items-center gap-1.5 text-xs">
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>Génération de l'APK Android (GitHub Actions)</span>
                </div>
                
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  L'intégration continue GitHub Actions est configurée dans votre dépôt <strong className="text-white">hopeconcept2026/maandiko</strong> (<code className="text-sky-300 font-mono">.github/workflows/build-apk.yml</code>).
                </p>

                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800/80 space-y-1.5 text-[11px]">
                  <div className="font-semibold text-slate-200">Comment télécharger l'APK compilé :</div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-400">
                    <li>Rendez-vous sur <a href="https://github.com/hopeconcept2026/maandiko/actions" target="_blank" rel="noopener noreferrer" className="text-sky-400 underline font-semibold">GitHub Actions - hopeconcept2026/maandiko</a>.</li>
                    <li>Cliquez sur le dernier workflow exécuté ("Build MaAndiko Remote Android APK").</li>
                    <li>Dans la section <strong className="text-white">Artifacts</strong> en bas de page, téléchargez le fichier <strong className="text-amber-300 font-mono">MaAndiko-Remote-APK</strong>.</li>
                    <li>Installez le fichier <code className="text-emerald-300 font-mono">app-debug.apk</code> sur votre téléphone Android !</li>
                  </ol>
                </div>
              </div>

              {/* 3. PWA DIRECT INSTALLATION CARD */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="font-bold text-emerald-300 flex items-center gap-1.5 text-xs">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Installation PWA Instantanée (Sans Téléchargement)</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Dans Google Chrome sur Android, appuyez sur le menu <strong className="text-white">⋮ (Trois points)</strong> en haut à droite puis choisissez <strong className="text-sky-300">"Ajouter à l'écran d'accueil"</strong>.
                </p>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-800 mt-3 flex justify-end shrink-0">
              <button
                onClick={() => setShowPwaInfo(false)}
                className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition-colors shadow-lg"
              >
                Fermer
              </button>
            </div>

          </div>
        </div>
      )}

      </div>
    </div>
  );
};
