import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import path from 'path';
import fs from 'fs';
import {
  saveSermonToFile,
  readAllSermonFiles,
  deleteSermonFile,
  getSermonFilePath
} from './sermonFileManager';
import {
  saveRecueilToFile,
  saveSongToFile,
  readAllRecueilsAndSongsFromDisk
} from './lyricsFileManager';
import { getDbPath } from './dataConfig';
import { INITIAL_SONGS } from './src/data/lyricsLibrary';

const getDirname = (): string => {
  if (typeof __dirname !== 'undefined' && __dirname) return __dirname;
  return process.cwd();
};
const currentDir = getDirname();

export class SqliteAdapter {
  private sqlDb!: SqlJsDatabase;
  private inTransaction = false;

  public async init() {
    const dbPath = getDbPath();
    const locateFile = (file: string) => {
      const candidates = [
        path.join(currentDir, file),
        path.join(currentDir, '..', file),
        path.join(currentDir, '..', 'node_modules', 'sql.js', 'dist', file),
        path.join(currentDir, 'node_modules', 'sql.js', 'dist', file),
        path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', file)
      ];
      for (const candidate of candidates) {
        if (fs.existsSync(candidate)) return candidate;
      }
      return file;
    };
    let SQL: any;
    try {
      SQL = await initSqlJs({ locateFile });
    } catch {
      SQL = await initSqlJs();
    }

    if (fs.existsSync(dbPath)) {
      try {
        const filebuffer = fs.readFileSync(dbPath);
        const testDb = new SQL.Database(filebuffer);
        // Verify database integrity
        const check = testDb.exec("PRAGMA quick_check;");
        if (check && check.length > 0 && check[0].values[0][0] === 'ok') {
          this.sqlDb = testDb;
          console.log(`✓ Connecté à la base de données SQLite (${dbPath}) via sql.js`);
        } else {
          throw new Error("Contrôle d'intégrité de la base de données échoué");
        }
      } catch (err) {
        console.warn(`⚠️ Base de données corrompue ou illisible (${dbPath}), réinitialisation d'une base saine :`, err);
        try {
          if (fs.existsSync(dbPath)) {
            fs.unlinkSync(dbPath);
          }
        } catch {
          // ignore
        }
        this.sqlDb = new SQL.Database();
      }
    } else {
      this.sqlDb = new SQL.Database();
      console.log(`✓ Création d'une nouvelle base de données SQLite (${dbPath}) via sql.js`);
    }

    this.initSchema();
  }

  public getDatabaseBuffer(): Buffer {
    const data = this.sqlDb.export();
    return Buffer.from(data);
  }

  public async loadFromBuffer(buffer: Buffer): Promise<boolean> {
    const locateFile = (file: string) => {
      return path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', file);
    };
    const SQL = await initSqlJs({ locateFile });
    const testDb = new SQL.Database(buffer);
    const check = testDb.exec("PRAGMA quick_check;");
    if (check && check.length > 0 && check[0].values[0][0] === 'ok') {
      this.sqlDb = testDb;
      this.saveDb();
      console.log("✓ Base de données SQLite rechargée avec succès depuis un buffer");
      return true;
    } else {
      throw new Error("Le fichier fourni n'est pas une base de données SQLite valide.");
    }
  }

  private saveDb() {
    try {
      const dbPath = getDbPath();
      const data = this.sqlDb.export();
      const buffer = Buffer.from(data);
      const tmpPath = `${dbPath}.tmp`;
      fs.writeFileSync(tmpPath, buffer);
      fs.renameSync(tmpPath, dbPath);
    } catch (err) {
      console.error("❌ Erreur lors de la sauvegarde de sermons.db :", err);
    }
  }

  private initSchema() {
    this.serialize(() => {
      try {
        this.sqlDb.run(`PRAGMA foreign_keys = ON;`);
      } catch {
        // ignore
      }

      try {
        this.sqlDb.run(`
          CREATE TABLE IF NOT EXISTS sermons (
            id TEXT PRIMARY KEY,
            titre_francais TEXT NOT NULL,
            date_sermon TEXT,
            lieu TEXT,
            type_structure TEXT DEFAULT 'PARAGRAPHE'
          )
        `);
      } catch (e) {
        console.error("Error creating sermons table:", e);
      }

      try {
        this.sqlDb.run(`ALTER TABLE sermons ADD COLUMN type_structure TEXT DEFAULT 'PARAGRAPHE'`);
      } catch {
        // column already exists
      }

      try {
        this.sqlDb.run(`
          CREATE TABLE IF NOT EXISTS paragraphes (
            sermon_id TEXT,
            numero_paragraphe INTEGER,
            texte TEXT NOT NULL,
            PRIMARY KEY (sermon_id, numero_paragraphe),
            FOREIGN KEY (sermon_id) REFERENCES sermons(id) ON DELETE CASCADE
          )
        `);
      } catch (e) {
        console.error("Error creating paragraphes table:", e);
      }

      try {
        this.sqlDb.run(`CREATE INDEX IF NOT EXISTS idx_paragraphes_sermon ON paragraphes(sermon_id)`);
      } catch (e) {
        console.error("Error creating index:", e);
      }

      try {
        this.sqlDb.run(`
          CREATE TABLE IF NOT EXISTS recueils (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT
          )
        `);
      } catch (e) {
        console.error("Error creating recueils table:", e);
      }

      try {
        this.sqlDb.run(`
          CREATE TABLE IF NOT EXISTS songs (
            id TEXT PRIMARY KEY,
            recueil_id TEXT NOT NULL,
            number TEXT NOT NULL,
            title TEXT NOT NULL,
            category TEXT,
            author TEXT,
            key_signature TEXT,
            sections_json TEXT NOT NULL,
            FOREIGN KEY (recueil_id) REFERENCES recueils(id) ON DELETE CASCADE
          )
        `);
      } catch (e) {
        console.error("Error creating songs table:", e);
      }

      try {
        this.sqlDb.run(`CREATE INDEX IF NOT EXISTS idx_songs_recueil ON songs(recueil_id)`);
      } catch (e) {
        console.error("Error creating songs index:", e);
      }

      this.saveDb();
      this.seedSampleData();
      this.syncWithSermonFiles();
      this.syncWithLyricsFiles();
    });
  }

  private seedSampleData() {
    try {
      const stmt = this.sqlDb.prepare("SELECT COUNT(*) as count FROM sermons");
      let countSermons = 0;
      if (stmt.step()) {
        const row = stmt.getAsObject();
        countSermons = Number(row.count || 0);
      }
      stmt.free();

      const stmtP = this.sqlDb.prepare("SELECT COUNT(*) as count FROM paragraphes");
      let countParagraphes = 0;
      if (stmtP.step()) {
        const rowP = stmtP.getAsObject();
        countParagraphes = Number(rowP.count || 0);
      }
      stmtP.free();

      if (countSermons === 0 || countParagraphes === 0) {
        console.log("🌱 Initialisation des brochures d'exemple dans la base de données...");

        const sampleSermons = [
          {
            id: '63-1128',
            title: 'Le Signal Lumineux',
            date: '28/11/1963',
            lieu: 'Jeffersonville, IN',
            type_structure: 'PARAGRAPHE',
            paragraphs: [
              { num: 1, text: "Bonsoir, mes amis. C’est un grand privilège d’être de nouveau ici ce soir au Tabernacle Branham. Nous sommes si reconnaissants pour la grâce de Dieu et Sa présence bénie parmi nous." },
              { num: 2, text: "Rappelez-vous le signal lumineux. Quand vous voyez un signal rouge sur la route ou sur la voie ferrée, cela signifie un danger imminent. Vous devez vous arrêter et observer la lumière avant de continuer." },
              { num: 3, text: "Dans ces derniers jours, Dieu a placé Son signal d'avertissement. La Parole de Dieu est notre signal d'orientation immuable. Ne passez pas à côté sans prêter attention." },
              { num: 4, text: "Jésus a dit : 'Mes brebis entendent ma voix, et elles me suivent.' Quand le Saint-Esprit parle, l'Épouse reconnaît le signal et s'aligne sur la Parole révélée." },
              { num: 5, text: "Que chacun de vous cherche le Seigneur de tout son cœur. Il n'y a pas de refuge en dehors de Jésus-Christ." }
            ]
          },
          {
            id: '65-1207',
            title: 'Leadership',
            date: '07/12/1965',
            lieu: 'Covina, CA',
            type_structure: 'PARAGRAPHE',
            paragraphs: [
              { num: 1, text: "Merci beaucoup. C’est vraiment un grand honneur d’être avec vous tous ce soir à Covina. Nous demandons à Dieu de bénir cette précieuse assemblée." },
              { num: 2, text: "L'homme cherche toujours un leader à suivre. Il veut quelqu'un pour le conduire, mais trop souvent il choisit la conduite des hommes au lieu de Dieu." },
              { num: 3, text: "Il n'y a qu'un seul vrai Leader pour le croyant : c'est le Seigneur Jésus-Christ par Son Saint-Esprit. Suivez la Colonne de Feu et la Vérité révélée." },
              { num: 4, text: "Quand la Parole de Dieu est prêchée dans Sa pureté, Elle amène la vie éternelle. Laissez le Saint-Esprit conduire chaque étape de votre marche." },
              { num: 5, text: "Prions ensemble : Père céleste, guide Ton peuple ce soir par Ta grâce et Ton Esprit Saint. Au nom de Jésus. Amen." }
            ]
          },
          {
            id: '65-1127B',
            title: 'La Nourriture Spirituelle au Temps Convenable',
            date: '27/11/1965',
            lieu: 'Shreveport, LA',
            type_structure: 'PARAGRAPHE',
            paragraphs: [
              { num: 1, text: "Que le Seigneur vous bénisse abondamment. C’est une joie immense de me retrouver avec vous à Shreveport ce soir." },
              { num: 2, text: "Dieu a toujours préparé une nourriture spirituelle emmagasinée pour Son peuple, adaptée à chaque âge et à chaque saison." },
              { num: 3, text: "Au temps du soir, la lumière paraîtra. Dieu envoie la Manne fraîche pour nourrir l'Épouse avant le grand départ pour la Maison." },
              { num: 4, text: "La Parole révélée est la vraie nourriture de l'âme. Ceux qui ont faim et soif de justice seront pleinement rassasiés." },
              { num: 5, text: "Demeurez fidèles à la Parole transmise aux saints. Dieu prend soin de Ses enfants en tout temps." }
            ]
          },
          {
            id: '63-0324M',
            title: 'Le Septième Sceau',
            date: '24/03/1963',
            lieu: 'Jeffersonville, IN',
            type_structure: 'PARAGRAPHE',
            paragraphs: [
              { num: 1, text: "Que Dieu vous bénisse ce matin. Nous terminons la série sur les Sept Sceaux avec ce glorieux mystère du Septième Sceau." },
              { num: 2, text: "Quand le Septième Sceau fut ouvert, il y eut un silence dans le ciel d'environ une demi-heure. C'était un moment sacré et solennel." },
              { num: 3, text: "Les mystères cachés depuis la fondation du monde sont maintenant révélés pour préparer l'Épouse à l'Enlèvement." },
              { num: 4, text: "Regardez à Jésus, l'Auteur et le Consommateur de notre foi. Tout s'accomplit selon la promesse divine." }
            ]
          }
        ];

        this.sqlDb.run("BEGIN TRANSACTION;");
        for (const s of sampleSermons) {
          this.sqlDb.run(
            `INSERT OR REPLACE INTO sermons (id, titre_francais, date_sermon, lieu, type_structure) VALUES (?, ?, ?, ?, ?)`,
            [s.id, s.title, s.date, s.lieu, s.type_structure]
          );
          for (const p of s.paragraphs) {
            this.sqlDb.run(
              `INSERT OR REPLACE INTO paragraphes (sermon_id, numero_paragraphe, texte) VALUES (?, ?, ?)`,
              [s.id, p.num, p.text]
            );
          }
        }
        this.sqlDb.run("COMMIT;");
        this.saveDb();
        console.log("✓ Brochures d'exemple initialisées avec succès dans la base de données.");
      }

      // Check recueils count
      const stmtR = this.sqlDb.prepare("SELECT COUNT(*) as count FROM recueils");
      let countRecueils = 0;
      if (stmtR.step()) {
        countRecueils = Number(stmtR.getAsObject().count || 0);
      }
      stmtR.free();

      if (countRecueils === 0) {
        console.log("🌱 Initialisation des recueils et cantiques d'exemple...");
        const defaultRecueils = [
          { id: 'ce', title: "Cantiques de l'Épouse", description: "Chants du Message et de l'Épouse" },
          { id: 'saf', title: "Sur les Ailes de la Foi", description: "Recueil classique évangélique" },
          { id: 'cv', title: "Chants de Victoire", description: "Cantiques de louange et de victoire" }
        ];

        this.sqlDb.run("BEGIN TRANSACTION;");
        for (const r of defaultRecueils) {
          this.sqlDb.run("INSERT OR REPLACE INTO recueils (id, title, description) VALUES (?, ?, ?)", [r.id, r.title, r.description]);
        }

        for (const song of INITIAL_SONGS) {
          let recId = 'ce';
          if (song.category === 'Sur les Ailes de la Foi') recId = 'saf';
          if (song.category === 'Chants de Victoire') recId = 'cv';

          this.sqlDb.run(
            `INSERT OR REPLACE INTO songs (id, recueil_id, number, title, category, author, key_signature, sections_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              song.id,
              recId,
              song.number,
              song.title,
              song.category || '',
              song.author || '',
              song.keySignature || '',
              JSON.stringify(song.sections)
            ]
          );
        }
        this.sqlDb.run("COMMIT;");
        this.saveDb();
        console.log("✓ Recueils et cantiques d'exemple initialisés avec succès.");
      }
    } catch (e) {
      console.error("Erreur lors de l'initialisation des données d'exemple:", e);
    }
  }

  public syncWithSermonFiles() {
    try {
      const sermonFiles = readAllSermonFiles();
      if (sermonFiles.length > 0) {
        console.log(`📁 ${sermonFiles.length} fichier(s) brochure(s) trouvé(s) dans /sermons_data. Synchronisation vers la base de données...`);
        this.sqlDb.run("BEGIN TRANSACTION;");
        for (const s of sermonFiles) {
          this.sqlDb.run(
            `INSERT OR REPLACE INTO sermons (id, titre_francais, date_sermon, lieu, type_structure) VALUES (?, ?, ?, ?, ?)`,
            [s.id, s.titre_francais, s.date_sermon || '', s.lieu || '', s.type_structure || 'PARAGRAPHE']
          );
          this.sqlDb.run(`DELETE FROM paragraphes WHERE sermon_id = ?`, [s.id]);
          for (const p of s.paragraphes) {
            this.sqlDb.run(
              `INSERT OR REPLACE INTO paragraphes (sermon_id, numero_paragraphe, texte) VALUES (?, ?, ?)`,
              [s.id, p.numero_paragraphe, p.texte]
            );
          }
        }
        this.sqlDb.run("COMMIT;");
        this.saveDb();
        console.log(`✓ Synchronisation réussie : ${sermonFiles.length} brochure(s) synchronisée(s) depuis leurs fichiers dédiés (.sermon).`);
      } else {
        this.exportAllToFiles();
      }
    } catch (err) {
      console.error("Erreur lors de la synchronisation des fichiers de brochures :", err);
    }
  }

  public exportAllToFiles() {
    try {
      this.all("SELECT * FROM sermons", [], (err, sermons: { id: string; titre_francais: string; date_sermon: string; lieu: string; type_structure: string }[]) => {
        if (err || !sermons) return;
        for (const s of sermons) {
          this.all("SELECT numero_paragraphe, texte FROM paragraphes WHERE sermon_id = ? ORDER BY numero_paragraphe ASC", [s.id], (err2, paras: { numero_paragraphe: number; texte: string }[]) => {
            if (err2 || !paras) return;
            saveSermonToFile({
              version: '1.0',
              id: s.id,
              titre_francais: s.titre_francais,
              date_sermon: s.date_sermon,
              lieu: s.lieu,
              type_structure: s.type_structure,
              paragraphes: paras
            });
          });
        }
      });
    } catch (e) {
      console.error("Erreur d'exportation vers les fichiers de brochures :", e);
    }
  }

  public syncSingleSermonToFile(sermonId: string) {
    if (!sermonId) return;
    this.get("SELECT * FROM sermons WHERE id = ?", [sermonId], (err, s: { id: string; titre_francais: string; date_sermon: string; lieu: string; type_structure: string }) => {
      if (err || !s) return;
      this.all("SELECT numero_paragraphe, texte FROM paragraphes WHERE sermon_id = ? ORDER BY numero_paragraphe ASC", [sermonId], (err2, paras: { numero_paragraphe: number; texte: string }[]) => {
        if (err2 || !paras) return;
        saveSermonToFile({
          version: '1.0',
          id: s.id,
          titre_francais: s.titre_francais,
          date_sermon: s.date_sermon,
          lieu: s.lieu,
          type_structure: s.type_structure,
          paragraphes: paras
        });
      });
    });
  }

  public syncWithLyricsFiles() {
    try {
      const { recueils, songs } = readAllRecueilsAndSongsFromDisk();
      if (recueils.length > 0 || songs.length > 0) {
        console.log(`📁 ${recueils.length} recueil(s) et ${songs.length} cantique(s) trouvé(s) sur le disque. Synchronisation DB...`);
        this.sqlDb.run("BEGIN TRANSACTION;");
        for (const r of recueils) {
          this.sqlDb.run(
            `INSERT OR REPLACE INTO recueils (id, title, description) VALUES (?, ?, ?)`,
            [r.id, r.title, r.description || '']
          );
        }
        for (const s of songs) {
          this.sqlDb.run(
            `INSERT OR REPLACE INTO songs (id, recueil_id, number, title, category, author, key_signature, sections_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              s.id,
              s.recueil_id,
              s.number,
              s.title,
              s.category || '',
              s.author || '',
              s.keySignature || '',
              JSON.stringify(s.sections)
            ]
          );
        }
        this.sqlDb.run("COMMIT;");
        this.saveDb();
        console.log(`✓ Synchronisation recueils/cantiques réussie.`);
      } else {
        this.exportLyricsToFiles();
      }
    } catch (err) {
      console.error("Erreur synchronisation cantiques depuis le disque:", err);
    }
  }

  public exportLyricsToFiles() {
    try {
      this.all("SELECT * FROM recueils", [], (err, recueils: { id: string; title: string; description: string }[]) => {
        if (err || !recueils) return;
        for (const r of recueils) {
          saveRecueilToFile({ id: r.id, title: r.title, description: r.description });
        }
        this.all("SELECT * FROM songs", [], (err2, songs: any[]) => {
          if (err2 || !songs) return;
          for (const s of songs) {
            let sections = [];
            try {
              sections = JSON.parse(s.sections_json);
            } catch {
              // ignore
            }
            saveSongToFile({
              id: s.id,
              recueil_id: s.recueil_id,
              number: s.number,
              title: s.title,
              category: s.category,
              author: s.author,
              keySignature: s.key_signature,
              sections
            });
          }
        });
      });
    } catch (e) {
      console.error("Erreur exportation des cantiques vers le disque:", e);
    }
  }

  public syncSingleSongToFile(songId: string) {
    if (!songId) return;
    this.get("SELECT * FROM songs WHERE id = ?", [songId], (err, s: any) => {
      if (err || !s) return;
      let sections = [];
      try {
        sections = JSON.parse(s.sections_json);
      } catch {
        // ignore
      }
      saveSongToFile({
        id: s.id,
        recueil_id: s.recueil_id,
        number: s.number,
        title: s.title,
        category: s.category,
        author: s.author,
        keySignature: s.key_signature,
        sections
      });
    });
  }

  public serialize(callback: () => void) {
    callback();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public run(sql: string, params?: any, callback?: any) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let actualParams: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let actualCb: any = null;

    if (typeof params === 'function') {
      actualCb = params;
    } else {
      if (Array.isArray(params)) {
        actualParams = params;
      } else if (params !== undefined && params !== null) {
        actualParams = [params];
      }
      if (typeof callback === 'function') {
        actualCb = callback;
      }
    }

    const trimmedSql = sql.trim().toUpperCase();
    if (trimmedSql.startsWith('BEGIN')) {
      this.inTransaction = true;
    }

    try {
      this.sqlDb.run(sql, actualParams);

      if (trimmedSql.startsWith('COMMIT') || trimmedSql.startsWith('ROLLBACK')) {
        this.inTransaction = false;
        this.saveDb();
      } else if (!this.inTransaction && !trimmedSql.startsWith('PRAGMA') && !trimmedSql.startsWith('SELECT')) {
        this.saveDb();
      }

      const context = { changes: this.sqlDb.getRowsModified() };
      if (actualCb) actualCb.call(context, null);
    } catch (err: unknown) {
      if (actualCb) actualCb(err as Error);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public get(sql: string, params?: any, callback?: any) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let actualParams: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let actualCb: any = null;

    if (typeof params === 'function') {
      actualCb = params;
    } else {
      if (Array.isArray(params)) {
        actualParams = params;
      } else if (params !== undefined && params !== null) {
        actualParams = [params];
      }
      if (typeof callback === 'function') {
        actualCb = callback;
      }
    }

    try {
      const stmt = this.sqlDb.prepare(sql);
      stmt.bind(actualParams);
      let row = null;
      if (stmt.step()) {
        row = stmt.getAsObject();
      }
      stmt.free();
      if (actualCb) actualCb(null, row);
    } catch (err: unknown) {
      if (actualCb) actualCb(err as Error, null);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public all(sql: string, params?: any, callback?: any) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let actualParams: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let actualCb: any = null;

    if (typeof params === 'function') {
      actualCb = params;
    } else {
      if (Array.isArray(params)) {
        actualParams = params;
      } else if (params !== undefined && params !== null) {
        actualParams = [params];
      }
      if (typeof callback === 'function') {
        actualCb = callback;
      }
    }

    try {
      const stmt = this.sqlDb.prepare(sql);
      stmt.bind(actualParams);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows: any[] = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      if (actualCb) actualCb(null, rows);
    } catch (err: unknown) {
      if (actualCb) actualCb(err as Error, null);
    }
  }

  public prepare(sql: string) {
    const self = this;
    const stmt = this.sqlDb.prepare(sql);

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      run(...args: any[]) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let callback: any = null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let params: any[] = [];

        if (args.length > 0 && typeof args[args.length - 1] === 'function') {
          callback = args.pop();
        }

        if (args.length === 1 && Array.isArray(args[0])) {
          params = args[0];
        } else {
          params = args;
        }

        try {
          try {
            stmt.reset();
          } catch {
            // ignore if not running
          }
          stmt.run(params);
          if (callback) callback(null);
        } catch (err: unknown) {
          if (callback) callback(err as Error);
        }
      },
      finalize(callback?: (err?: Error | null) => void) {
        try {
          stmt.free();
          if (!self.inTransaction) {
            self.saveDb();
          }
          if (callback) callback(null);
        } catch (err: unknown) {
          if (callback) callback(err as Error);
        }
      }
    };
  }
}

export const db = new SqliteAdapter();
