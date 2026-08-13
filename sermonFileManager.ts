import fs from 'fs';
import path from 'path';
import { getDataDir } from './dataConfig';

export interface SermonFileFormat {
  version: string;
  id: string;
  titre_francais: string;
  date_sermon?: string;
  lieu?: string;
  type_structure?: string;
  updated_at?: string;
  paragraphes: {
    numero_paragraphe: number;
    texte: string;
  }[];
}

export function ensureSermonsDataDir(): string {
  const baseDir = getDataDir();
  const dir = path.join(baseDir, 'brochures');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Dossier de stockage des brochures créé : ${dir}`);
  }
  return dir;
}

export function sanitizeSermonFilename(text: string): string {
  if (!text) return '';
  return text
    .replace(/[/\\?%*:|"<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getSermonFileName(id: string, titre?: string): string {
  const cleanId = sanitizeSermonFilename(id);
  const cleanTitle = titre ? sanitizeSermonFilename(titre).substring(0, 70) : '';
  if (cleanTitle) {
    return `${cleanId} - ${cleanTitle}.sermon`;
  }
  return `${cleanId}.sermon`;
}

export function getSermonFilePath(id: string, titre?: string): string {
  return path.join(ensureSermonsDataDir(), getSermonFileName(id, titre));
}

export function deleteSermonFile(id: string): boolean {
  let deleted = false;
  try {
    const dataDir = ensureSermonsDataDir();
    const cleanId = sanitizeSermonFilename(id);
    const files = fs.readdirSync(dataDir);

    for (const file of files) {
      if (file.endsWith('.sermon') || file.endsWith('.json')) {
        const fullPath = path.join(dataDir, file);
        if (
          file.startsWith(cleanId + ' -') ||
          file.startsWith(cleanId + '.') ||
          file === `${cleanId}.sermon` ||
          file === `${cleanId}.json`
        ) {
          fs.unlinkSync(fullPath);
          deleted = true;
          console.log(`🗑️ Fichier supprimé pour la brochure ${id} : ${file}`);
        } else {
          try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const parsed = JSON.parse(content);
            if (parsed && parsed.id === id) {
              fs.unlinkSync(fullPath);
              deleted = true;
              console.log(`🗑️ Fichier supprimé par ID interne (${id}) : ${file}`);
            }
          } catch {
            // Ignorer
          }
        }
      }
    }
  } catch (err) {
    console.error(`Erreur lors de la suppression du fichier de la brochure ${id}:`, err);
  }
  return deleted;
}

export function saveSermonToFile(sermonData: SermonFileFormat): string {
  ensureSermonsDataDir();
  
  // Supprimer tout ancien nom de fichier pour cette brochure avant d'écrire sous le nom enrichi (Code - Titre.sermon)
  deleteSermonFile(sermonData.id);

  const filePath = getSermonFilePath(sermonData.id, sermonData.titre_francais);
  const jsonContent = JSON.stringify({
    version: '1.0',
    id: sermonData.id,
    titre_francais: sermonData.titre_francais,
    date_sermon: sermonData.date_sermon || '',
    lieu: sermonData.lieu || '',
    type_structure: sermonData.type_structure || 'PARAGRAPHE',
    updated_at: new Date().toISOString(),
    paragraphes: sermonData.paragraphes || []
  }, null, 2);

  fs.writeFileSync(filePath, jsonContent, 'utf-8');
  console.log(`💾 Brochure sauvegardée : ${filePath}`);
  return filePath;
}

export function readSermonFile(filePath: string): SermonFileFormat | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(content) as SermonFileFormat;
    if (parsed && parsed.id && parsed.titre_francais && Array.isArray(parsed.paragraphes)) {
      return parsed;
    }
  } catch (err) {
    console.error(`❌ Fichier brochure invalide (${filePath}):`, err);
  }
  return null;
}

export function readAllSermonFiles(): SermonFileFormat[] {
  const dataDir = ensureSermonsDataDir();
  const files = fs.readdirSync(dataDir);
  const sermons: SermonFileFormat[] = [];

  for (const file of files) {
    if (file.endsWith('.sermon') || file.endsWith('.json')) {
      const fullPath = path.join(dataDir, file);
      const data = readSermonFile(fullPath);
      if (data) {
        sermons.push(data);
      }
    }
  }

  return sermons;
}
