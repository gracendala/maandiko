import fs from 'fs';
import path from 'path';
import { getDataDir } from './dataConfig';
import { Song, Recueil, SongSection } from './src/types';

export function getRecueilsBaseDir(): string {
  const base = getDataDir();
  const dir = path.join(base, 'recueils');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Dossier racine des recueils de cantiques créé : ${dir}`);
  }
  return dir;
}

export function sanitizeFileName(text: string): string {
  if (!text) return 'sans_nom';
  return text
    .replace(/[/\\?%*:|"<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function sanitizeSlug(text: string): string {
  if (!text) return 'recueil';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'recueil';
}

export function getRecueilDir(recueilId: string): string {
  const base = getRecueilsBaseDir();
  const slug = sanitizeSlug(recueilId);
  const dirPath = path.join(base, slug);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  return dirPath;
}

export function saveRecueilToFile(recueil: { id: string; title: string; description?: string }): string {
  const recueilDir = getRecueilDir(recueil.id);
  const jsonPath = path.join(recueilDir, 'recueil.json');
  const data = {
    id: recueil.id,
    title: recueil.title,
    description: recueil.description || '',
    updated_at: new Date().toISOString()
  };
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`💾 Metadata du recueil sauvegardées : ${jsonPath}`);
  return jsonPath;
}

export function saveSongToFile(song: Song): string {
  const recueilDir = getRecueilDir(song.recueil_id || 'cantiques');
  
  // Clean old song file if renamed
  deleteSongFile(song.recueil_id || 'cantiques', song.id);

  const cleanNum = sanitizeFileName(song.number);
  const cleanTitle = sanitizeFileName(song.title).substring(0, 60);
  const fileName = `${cleanNum} - ${cleanTitle}.song`;
  const filePath = path.join(recueilDir, fileName);

  const content = JSON.stringify({
    version: '1.0',
    id: song.id,
    recueil_id: song.recueil_id,
    number: song.number,
    title: song.title,
    category: song.category || '',
    author: song.author || '',
    keySignature: song.keySignature || '',
    sections: song.sections || [],
    updated_at: new Date().toISOString()
  }, null, 2);

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`🎵 Cantique sauvegardé dans ${song.recueil_id} : ${filePath}`);
  return filePath;
}

export function deleteSongFile(recueilId: string, songId: string): boolean {
  let deleted = false;
  try {
    const recueilDir = getRecueilDir(recueilId);
    if (fs.existsSync(recueilDir)) {
      const files = fs.readdirSync(recueilDir);
      for (const file of files) {
        if (file.endsWith('.song') || (file.endsWith('.json') && file !== 'recueil.json')) {
          const fullPath = path.join(recueilDir, file);
          try {
            const raw = fs.readFileSync(fullPath, 'utf-8');
            const parsed = JSON.parse(raw);
            if (parsed && parsed.id === songId) {
              fs.unlinkSync(fullPath);
              deleted = true;
              console.log(`🗑️ Cantique supprimé (${songId}) : ${fullPath}`);
            }
          } catch {
            // ignore invalid
          }
        }
      }
    }
  } catch (err) {
    console.error(`Erreur suppression fichier cantique ${songId}:`, err);
  }
  return deleted;
}

export function deleteRecueilFolder(recueilId: string): boolean {
  try {
    const recueilDir = getRecueilDir(recueilId);
    if (fs.existsSync(recueilDir)) {
      fs.rmSync(recueilDir, { recursive: true, force: true });
      console.log(`🗑️ Dossier du recueil supprimé : ${recueilDir}`);
      return true;
    }
  } catch (err) {
    console.error(`Erreur suppression dossier recueil ${recueilId}:`, err);
  }
  return false;
}

export function readAllRecueilsAndSongsFromDisk(): { recueils: Recueil[]; songs: Song[] } {
  const baseDir = getRecueilsBaseDir();
  const recueilsMap: Map<string, Recueil> = new Map();
  const songsList: Song[] = [];

  if (!fs.existsSync(baseDir)) return { recueils: [], songs: [] };

  const subdirs = fs.readdirSync(baseDir, { withFileTypes: true });

  for (const dirent of subdirs) {
    if (dirent.isDirectory()) {
      const recueilSlug = dirent.name;
      const recueilDir = path.join(baseDir, recueilSlug);

      // Check recueil.json
      const metaPath = path.join(recueilDir, 'recueil.json');
      let recueilObj: Recueil = {
        id: recueilSlug,
        title: recueilSlug.replace(/-/g, ' ').toUpperCase(),
        description: ''
      };

      if (fs.existsSync(metaPath)) {
        try {
          const metaRaw = fs.readFileSync(metaPath, 'utf-8');
          const metaParsed = JSON.parse(metaRaw);
          if (metaParsed && metaParsed.title) {
            recueilObj = {
              id: metaParsed.id || recueilSlug,
              title: metaParsed.title,
              description: metaParsed.description || ''
            };
          }
        } catch {
          // fallback to directory name
        }
      }

      recueilsMap.set(recueilObj.id, recueilObj);

      // Read songs in this recueil folder
      const files = fs.readdirSync(recueilDir);
      for (const file of files) {
        if (file === 'recueil.json') continue;
        if (file.endsWith('.song') || file.endsWith('.json')) {
          const songPath = path.join(recueilDir, file);
          try {
            const songRaw = fs.readFileSync(songPath, 'utf-8');
            const s = JSON.parse(songRaw);
            if (s && s.id && s.title && Array.isArray(s.sections)) {
              songsList.push({
                id: s.id,
                recueil_id: s.recueil_id || recueilObj.id,
                number: s.number || '0',
                title: s.title,
                category: s.category || recueilObj.title,
                author: s.author || '',
                keySignature: s.keySignature || '',
                sections: s.sections
              });
            }
          } catch (e) {
            console.error(`❌ Erreur lecture cantique ${songPath}:`, e);
          }
        }
      }
    }
  }

  return {
    recueils: Array.from(recueilsMap.values()),
    songs: songsList
  };
}
