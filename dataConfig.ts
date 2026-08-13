import path from 'path';
import fs from 'fs';
import os from 'os';

const userAppDataDir = process.env.APPDATA 
  ? path.join(process.env.APPDATA, 'ProTextLive') 
  : path.join(process.env.HOME || os.homedir(), '.protextlive');

if (!fs.existsSync(userAppDataDir)) {
  try {
    fs.mkdirSync(userAppDataDir, { recursive: true });
  } catch (err) {
    console.error('Erreur lors de la création du dossier AppData:', err);
  }
}

const CONFIG_FILE = path.join(userAppDataDir, 'config.json');

export interface AppConfig {
  dataDir: string;
}

export function loadConfig(): AppConfig {
  const defaultDataDir = path.join(userAppDataDir, 'sermons_data');
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed.dataDir === 'string' && parsed.dataDir.trim()) {
        return { dataDir: parsed.dataDir.trim() };
      }
    } catch (err) {
      console.error('Erreur de lecture de config.json:', err);
    }
  }
  return { dataDir: defaultDataDir };
}

export function saveConfig(config: AppConfig): void {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erreur d\'écriture de config.json:', err);
  }
}

export function getDataDir(): string {
  const config = loadConfig();
  if (!fs.existsSync(config.dataDir)) {
    try {
      fs.mkdirSync(config.dataDir, { recursive: true });
    } catch (err) {
      console.error(`Impossible de créer le dossier ${config.dataDir}, retour au dossier par défaut:`, err);
      const defaultDir = path.join(process.cwd(), 'sermons_data');
      if (!fs.existsSync(defaultDir)) {
        fs.mkdirSync(defaultDir, { recursive: true });
      }
      return defaultDir;
    }
  }
  return config.dataDir;
}

export function setDataDir(newPath: string, moveFiles = true): { success: boolean; message: string; dataDir: string } {
  try {
    const targetDir = path.resolve(newPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const currentDir = getDataDir();
    
    if (moveFiles && currentDir !== targetDir && fs.existsSync(currentDir)) {
      const files = fs.readdirSync(currentDir);
      for (const file of files) {
        const srcPath = path.join(currentDir, file);
        const destPath = path.join(targetDir, file);
        if (fs.statSync(srcPath).isFile()) {
          fs.copyFileSync(srcPath, destPath);
        }
      }
      console.log(`🚚 Fichiers copiés de ${currentDir} vers ${targetDir}`);
    }

    saveConfig({ dataDir: targetDir });
    return { success: true, message: `Dossier de données modifié vers : ${targetDir}`, dataDir: targetDir };
  } catch (err: any) {
    console.error('Erreur lors de la modification du dossier de données:', err);
    return { success: false, message: err.message || 'Erreur lors du changement de dossier', dataDir: getDataDir() };
  }
}

export function getDbPath(): string {
  const dir = getDataDir();
  return path.join(dir, 'sermons.db');
}
