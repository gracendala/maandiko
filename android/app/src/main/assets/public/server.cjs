var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_http = __toESM(require("http"), 1);
var import_socket = require("socket.io");
var import_path5 = __toESM(require("path"), 1);
var import_fs5 = __toESM(require("fs"), 1);
var import_os2 = __toESM(require("os"), 1);
var import_multer = __toESM(require("multer"), 1);
var import_googleapis = require("googleapis");
var pdfParseModule = __toESM(require("pdf-parse"), 1);
var import_pdf2json = __toESM(require("pdf2json"), 1);
var import_jszip = __toESM(require("jszip"), 1);

// db.ts
var import_sql = __toESM(require("sql.js"), 1);
var import_path4 = __toESM(require("path"), 1);
var import_fs4 = __toESM(require("fs"), 1);

// sermonFileManager.ts
var import_fs2 = __toESM(require("fs"), 1);
var import_path2 = __toESM(require("path"), 1);

// dataConfig.ts
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_os = __toESM(require("os"), 1);
var userAppDataDir = process.env.APPDATA ? import_path.default.join(process.env.APPDATA, "ProTextLive") : import_path.default.join(process.env.HOME || import_os.default.homedir(), ".protextlive");
if (!import_fs.default.existsSync(userAppDataDir)) {
  try {
    import_fs.default.mkdirSync(userAppDataDir, { recursive: true });
  } catch (err) {
    console.error("Erreur lors de la cr\xE9ation du dossier AppData:", err);
  }
}
var CONFIG_FILE = import_path.default.join(userAppDataDir, "config.json");
function loadConfig() {
  const defaultDataDir = import_path.default.join(userAppDataDir, "sermons_data");
  if (import_fs.default.existsSync(CONFIG_FILE)) {
    try {
      const content = import_fs.default.readFileSync(CONFIG_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed.dataDir === "string" && parsed.dataDir.trim()) {
        return { dataDir: parsed.dataDir.trim() };
      }
    } catch (err) {
      console.error("Erreur de lecture de config.json:", err);
    }
  }
  return { dataDir: defaultDataDir };
}
function saveConfig(config) {
  try {
    import_fs.default.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
  } catch (err) {
    console.error("Erreur d'\xE9criture de config.json:", err);
  }
}
function getDataDir() {
  const config = loadConfig();
  if (!import_fs.default.existsSync(config.dataDir)) {
    try {
      import_fs.default.mkdirSync(config.dataDir, { recursive: true });
    } catch (err) {
      console.error(`Impossible de cr\xE9er le dossier ${config.dataDir}, retour au dossier par d\xE9faut:`, err);
      const defaultDir = import_path.default.join(process.cwd(), "sermons_data");
      if (!import_fs.default.existsSync(defaultDir)) {
        import_fs.default.mkdirSync(defaultDir, { recursive: true });
      }
      return defaultDir;
    }
  }
  return config.dataDir;
}
function setDataDir(newPath, moveFiles = true) {
  try {
    const targetDir = import_path.default.resolve(newPath);
    if (!import_fs.default.existsSync(targetDir)) {
      import_fs.default.mkdirSync(targetDir, { recursive: true });
    }
    const currentDir2 = getDataDir();
    if (moveFiles && currentDir2 !== targetDir && import_fs.default.existsSync(currentDir2)) {
      const files = import_fs.default.readdirSync(currentDir2);
      for (const file of files) {
        const srcPath = import_path.default.join(currentDir2, file);
        const destPath = import_path.default.join(targetDir, file);
        if (import_fs.default.statSync(srcPath).isFile()) {
          import_fs.default.copyFileSync(srcPath, destPath);
        }
      }
      console.log(`\u{1F69A} Fichiers copi\xE9s de ${currentDir2} vers ${targetDir}`);
    }
    saveConfig({ dataDir: targetDir });
    return { success: true, message: `Dossier de donn\xE9es modifi\xE9 vers : ${targetDir}`, dataDir: targetDir };
  } catch (err) {
    console.error("Erreur lors de la modification du dossier de donn\xE9es:", err);
    return { success: false, message: err.message || "Erreur lors du changement de dossier", dataDir: getDataDir() };
  }
}
function getDbPath() {
  const dir = getDataDir();
  return import_path.default.join(dir, "sermons.db");
}

// sermonFileManager.ts
function ensureSermonsDataDir() {
  const baseDir = getDataDir();
  const dir = import_path2.default.join(baseDir, "brochures");
  if (!import_fs2.default.existsSync(dir)) {
    import_fs2.default.mkdirSync(dir, { recursive: true });
    console.log(`\u{1F4C1} Dossier de stockage des brochures cr\xE9\xE9 : ${dir}`);
  }
  return dir;
}
function sanitizeSermonFilename(text) {
  if (!text) return "";
  return text.replace(/[/\\?%*:|"<>]/g, " ").replace(/\s+/g, " ").trim();
}
function getSermonFileName(id, titre) {
  const cleanId = sanitizeSermonFilename(id);
  const cleanTitle = titre ? sanitizeSermonFilename(titre).substring(0, 70) : "";
  if (cleanTitle) {
    return `${cleanId} - ${cleanTitle}.sermon`;
  }
  return `${cleanId}.sermon`;
}
function getSermonFilePath(id, titre) {
  return import_path2.default.join(ensureSermonsDataDir(), getSermonFileName(id, titre));
}
function deleteSermonFile(id) {
  let deleted = false;
  try {
    const dataDir = ensureSermonsDataDir();
    const cleanId = sanitizeSermonFilename(id);
    const files = import_fs2.default.readdirSync(dataDir);
    for (const file of files) {
      if (file.endsWith(".sermon") || file.endsWith(".json")) {
        const fullPath = import_path2.default.join(dataDir, file);
        if (file.startsWith(cleanId + " -") || file.startsWith(cleanId + ".") || file === `${cleanId}.sermon` || file === `${cleanId}.json`) {
          import_fs2.default.unlinkSync(fullPath);
          deleted = true;
          console.log(`\u{1F5D1}\uFE0F Fichier supprim\xE9 pour la brochure ${id} : ${file}`);
        } else {
          try {
            const content = import_fs2.default.readFileSync(fullPath, "utf-8");
            const parsed = JSON.parse(content);
            if (parsed && parsed.id === id) {
              import_fs2.default.unlinkSync(fullPath);
              deleted = true;
              console.log(`\u{1F5D1}\uFE0F Fichier supprim\xE9 par ID interne (${id}) : ${file}`);
            }
          } catch {
          }
        }
      }
    }
  } catch (err) {
    console.error(`Erreur lors de la suppression du fichier de la brochure ${id}:`, err);
  }
  return deleted;
}
function saveSermonToFile(sermonData) {
  ensureSermonsDataDir();
  deleteSermonFile(sermonData.id);
  const filePath = getSermonFilePath(sermonData.id, sermonData.titre_francais);
  const jsonContent = JSON.stringify({
    version: "1.0",
    id: sermonData.id,
    titre_francais: sermonData.titre_francais,
    date_sermon: sermonData.date_sermon || "",
    lieu: sermonData.lieu || "",
    type_structure: sermonData.type_structure || "PARAGRAPHE",
    updated_at: (/* @__PURE__ */ new Date()).toISOString(),
    paragraphes: sermonData.paragraphes || []
  }, null, 2);
  import_fs2.default.writeFileSync(filePath, jsonContent, "utf-8");
  console.log(`\u{1F4BE} Brochure sauvegard\xE9e : ${filePath}`);
  return filePath;
}
function readSermonFile(filePath) {
  try {
    if (!import_fs2.default.existsSync(filePath)) return null;
    const content = import_fs2.default.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(content);
    if (parsed && parsed.id && parsed.titre_francais && Array.isArray(parsed.paragraphes)) {
      return parsed;
    }
  } catch (err) {
    console.error(`\u274C Fichier brochure invalide (${filePath}):`, err);
  }
  return null;
}
function readAllSermonFiles() {
  const dataDir = ensureSermonsDataDir();
  const files = import_fs2.default.readdirSync(dataDir);
  const sermons = [];
  for (const file of files) {
    if (file.endsWith(".sermon") || file.endsWith(".json")) {
      const fullPath = import_path2.default.join(dataDir, file);
      const data = readSermonFile(fullPath);
      if (data) {
        sermons.push(data);
      }
    }
  }
  return sermons;
}

// lyricsFileManager.ts
var import_fs3 = __toESM(require("fs"), 1);
var import_path3 = __toESM(require("path"), 1);
function getRecueilsBaseDir() {
  const base = getDataDir();
  const dir = import_path3.default.join(base, "recueils");
  if (!import_fs3.default.existsSync(dir)) {
    import_fs3.default.mkdirSync(dir, { recursive: true });
    console.log(`\u{1F4C1} Dossier racine des recueils de cantiques cr\xE9\xE9 : ${dir}`);
  }
  return dir;
}
function sanitizeFileName(text) {
  if (!text) return "sans_nom";
  return text.replace(/[/\\?%*:|"<>]/g, " ").replace(/\s+/g, " ").trim();
}
function sanitizeSlug(text) {
  if (!text) return "recueil";
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "recueil";
}
function getRecueilDir(recueilId) {
  const base = getRecueilsBaseDir();
  const slug = sanitizeSlug(recueilId);
  const dirPath = import_path3.default.join(base, slug);
  if (!import_fs3.default.existsSync(dirPath)) {
    import_fs3.default.mkdirSync(dirPath, { recursive: true });
  }
  return dirPath;
}
function saveRecueilToFile(recueil) {
  const recueilDir = getRecueilDir(recueil.id);
  const jsonPath = import_path3.default.join(recueilDir, "recueil.json");
  const data = {
    id: recueil.id,
    title: recueil.title,
    description: recueil.description || "",
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  import_fs3.default.writeFileSync(jsonPath, JSON.stringify(data, null, 2), "utf-8");
  console.log(`\u{1F4BE} Metadata du recueil sauvegard\xE9es : ${jsonPath}`);
  return jsonPath;
}
function saveSongToFile(song) {
  const recueilDir = getRecueilDir(song.recueil_id || "cantiques");
  deleteSongFile(song.recueil_id || "cantiques", song.id);
  const cleanNum = sanitizeFileName(song.number);
  const cleanTitle = sanitizeFileName(song.title).substring(0, 60);
  const fileName = `${cleanNum} - ${cleanTitle}.song`;
  const filePath = import_path3.default.join(recueilDir, fileName);
  const content = JSON.stringify({
    version: "1.0",
    id: song.id,
    recueil_id: song.recueil_id,
    number: song.number,
    title: song.title,
    category: song.category || "",
    author: song.author || "",
    keySignature: song.keySignature || "",
    sections: song.sections || [],
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }, null, 2);
  import_fs3.default.writeFileSync(filePath, content, "utf-8");
  console.log(`\u{1F3B5} Cantique sauvegard\xE9 dans ${song.recueil_id} : ${filePath}`);
  return filePath;
}
function deleteSongFile(recueilId, songId) {
  let deleted = false;
  try {
    const recueilDir = getRecueilDir(recueilId);
    if (import_fs3.default.existsSync(recueilDir)) {
      const files = import_fs3.default.readdirSync(recueilDir);
      for (const file of files) {
        if (file.endsWith(".song") || file.endsWith(".json") && file !== "recueil.json") {
          const fullPath = import_path3.default.join(recueilDir, file);
          try {
            const raw = import_fs3.default.readFileSync(fullPath, "utf-8");
            const parsed = JSON.parse(raw);
            if (parsed && parsed.id === songId) {
              import_fs3.default.unlinkSync(fullPath);
              deleted = true;
              console.log(`\u{1F5D1}\uFE0F Cantique supprim\xE9 (${songId}) : ${fullPath}`);
            }
          } catch {
          }
        }
      }
    }
  } catch (err) {
    console.error(`Erreur suppression fichier cantique ${songId}:`, err);
  }
  return deleted;
}
function deleteRecueilFolder(recueilId) {
  try {
    const recueilDir = getRecueilDir(recueilId);
    if (import_fs3.default.existsSync(recueilDir)) {
      import_fs3.default.rmSync(recueilDir, { recursive: true, force: true });
      console.log(`\u{1F5D1}\uFE0F Dossier du recueil supprim\xE9 : ${recueilDir}`);
      return true;
    }
  } catch (err) {
    console.error(`Erreur suppression dossier recueil ${recueilId}:`, err);
  }
  return false;
}
function readAllRecueilsAndSongsFromDisk() {
  const baseDir = getRecueilsBaseDir();
  const recueilsMap = /* @__PURE__ */ new Map();
  const songsList = [];
  if (!import_fs3.default.existsSync(baseDir)) return { recueils: [], songs: [] };
  const subdirs = import_fs3.default.readdirSync(baseDir, { withFileTypes: true });
  for (const dirent of subdirs) {
    if (dirent.isDirectory()) {
      const recueilSlug = dirent.name;
      const recueilDir = import_path3.default.join(baseDir, recueilSlug);
      const metaPath = import_path3.default.join(recueilDir, "recueil.json");
      let recueilObj = {
        id: recueilSlug,
        title: recueilSlug.replace(/-/g, " ").toUpperCase(),
        description: ""
      };
      if (import_fs3.default.existsSync(metaPath)) {
        try {
          const metaRaw = import_fs3.default.readFileSync(metaPath, "utf-8");
          const metaParsed = JSON.parse(metaRaw);
          if (metaParsed && metaParsed.title) {
            recueilObj = {
              id: metaParsed.id || recueilSlug,
              title: metaParsed.title,
              description: metaParsed.description || ""
            };
          }
        } catch {
        }
      }
      recueilsMap.set(recueilObj.id, recueilObj);
      const files = import_fs3.default.readdirSync(recueilDir);
      for (const file of files) {
        if (file === "recueil.json") continue;
        if (file.endsWith(".song") || file.endsWith(".json")) {
          const songPath = import_path3.default.join(recueilDir, file);
          try {
            const songRaw = import_fs3.default.readFileSync(songPath, "utf-8");
            const s = JSON.parse(songRaw);
            if (s && s.id && s.title && Array.isArray(s.sections)) {
              songsList.push({
                id: s.id,
                recueil_id: s.recueil_id || recueilObj.id,
                number: s.number || "0",
                title: s.title,
                category: s.category || recueilObj.title,
                author: s.author || "",
                keySignature: s.keySignature || "",
                sections: s.sections
              });
            }
          } catch (e) {
            console.error(`\u274C Erreur lecture cantique ${songPath}:`, e);
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

// src/data/lyricsLibrary.ts
var INITIAL_SONGS = [
  {
    id: "song-001",
    number: "001",
    title: "Crois Seulement",
    category: "Cantiques de l'\xC9pouse",
    author: "Paul Rader / W.M. Branham",
    keySignature: "F",
    sections: [
      {
        id: "s001-c1",
        label: "Couplet 1",
        type: "Couplet",
        text: "N\xE9 d'une humble foi, la crainte s'en va,\nQuand J\xE9sus s'approche, la gr\xE2ce survient.\nTous nos fardeaux tombent devant sa pr\xE9sence,\nCar son Saint-Esprit gu\xE9rit nos douleurs.",
        lines: [
          "N\xE9 d'une humble foi, la crainte s'en va,",
          "Quand J\xE9sus s'approche, la gr\xE2ce survient.",
          "Tous nos fardeaux tombent devant sa pr\xE9sence,",
          "Car son Saint-Esprit gu\xE9rit nos douleurs."
        ]
      },
      {
        id: "s001-ref",
        label: "Refrain",
        type: "Refrain",
        text: "Crois seulement, crois seulement,\nTout est possible, crois seulement !\nCrois seulement, crois seulement,\nTout est possible, crois seulement !",
        lines: [
          "Crois seulement, crois seulement,",
          "Tout est possible, crois seulement !",
          "Crois seulement, crois seulement,",
          "Tout est possible, crois seulement !"
        ]
      },
      {
        id: "s001-c2",
        label: "Couplet 2",
        type: "Couplet",
        text: "J\xE9sus est ici, J\xE9sus est ici,\nTout est possible, J\xE9sus est ici !\nJ\xE9sus est ici, J\xE9sus est ici,\nTout est possible, J\xE9sus est ici !",
        lines: [
          "J\xE9sus est ici, J\xE9sus est ici,",
          "Tout est possible, J\xE9sus est ici !",
          "J\xE9sus est ici, J\xE9sus est ici,",
          "Tout est possible, J\xE9sus est ici !"
        ]
      },
      {
        id: "s001-c3",
        label: "Couplet 3",
        type: "Couplet",
        text: "Le Crois-tu maintenant, le crois-tu maintenant ?\nTout est possible, le crois-tu maintenant ?\nOui, je crois maintenant, oui, je crois maintenant,\nTout est possible, oui, je crois maintenant !",
        lines: [
          "Le Crois-tu maintenant, le crois-tu maintenant ?",
          "Tout est possible, le crois-tu maintenant ?",
          "Oui, je crois maintenant, oui, je crois maintenant,",
          "Tout est possible, oui, je crois maintenant !"
        ]
      }
    ]
  },
  {
    id: "song-002",
    number: "002",
    title: "Combien Tu Es Grand",
    category: "Sur les Ailes de la Foi",
    author: "Carl Boberg",
    keySignature: "A",
    sections: [
      {
        id: "s002-c1",
        label: "Couplet 1",
        type: "Couplet",
        text: "O Dieu d'amour, quand mon \xE2me contemple\nTout l'univers cr\xE9\xE9 par ton pouvoir,\nLe ciel d'azur, les \xE9clairs, le tonnerre,\nLe clair de lune et les soleils du soir.",
        lines: [
          "O Dieu d'amour, quand mon \xE2me contemple",
          "Tout l'univers cr\xE9\xE9 par ton pouvoir,",
          "Le ciel d'azur, les \xE9clairs, le tonnerre,",
          "Le clair de lune et les soleils du soir."
        ]
      },
      {
        id: "s002-ref",
        label: "Refrain",
        type: "Refrain",
        text: "De tout mon \xEAtre alors s'\xE9l\xE8ve un chant :\nCombien tu es grand ! Combien tu es grand !\nDe tout mon \xEAtre alors s'\xE9l\xE8ve un chant :\nCombien tu es grand ! Combien tu es grand !",
        lines: [
          "De tout mon \xEAtre alors s'\xE9l\xE8ve un chant :",
          "Combien tu es grand ! Combien tu es grand !",
          "De tout mon \xEAtre alors s'\xE9l\xE8ve un chant :",
          "Combien tu es grand ! Combien tu es grand !"
        ]
      },
      {
        id: "s002-c2",
        label: "Couplet 2",
        type: "Couplet",
        text: "Quand par les bois, le bocage ou la plaine,\nJ'entends l'oiseau chanter le Cr\xE9ateur,\nQuand je contemple les hauts sommets des montagnes,\nJe sens la paix de mon grand R\xE9dempteur.",
        lines: [
          "Quand par les bois, le bocage ou la plaine,",
          "J'entends l'oiseau chanter le Cr\xE9ateur,",
          "Quand je contemple les hauts sommets des montagnes,",
          "Je sens la paix de mon grand R\xE9dempteur."
        ]
      },
      {
        id: "s002-c3",
        label: "Couplet 3",
        type: "Couplet",
        text: "Quand le Seigneur, clart\xE9 de notre vie,\nReviendra du ciel pour me prendre avec Lui,\nJe m'\xE9crierai dans la gloire infinie :\nCombien Tu es grand, \xF4 mon Dieu, mon Appui !",
        lines: [
          "Quand le Seigneur, clart\xE9 de notre vie,",
          "Reviendra du ciel pour me prendre avec Lui,",
          "Je m'\xE9crierai dans la gloire infinie :",
          "Combien Tu es grand, \xF4 mon Dieu, mon Appui !"
        ]
      }
    ]
  },
  {
    id: "song-003",
    number: "003",
    title: "Gr\xE2ce \xC9tonnante (Amazing Grace)",
    category: "Sur les Ailes de la Foi",
    author: "John Newton",
    keySignature: "G",
    sections: [
      {
        id: "s003-c1",
        label: "Couplet 1",
        type: "Couplet",
        text: "Gr\xE2ce \xE9tonnante ! Au son si doux,\nQui sauva un mis\xE9rable comme moi !\nJ'\xE9tais perdu, mais maintenant je suis trouv\xE9,\nJ'\xE9tais aveugle, mais maintenant je vois.",
        lines: [
          "Gr\xE2ce \xE9tonnante ! Au son si doux,",
          "Qui sauva un mis\xE9rable comme moi !",
          "J'\xE9tais perdu, mais maintenant je suis trouv\xE9,",
          "J'\xE9tais aveugle, mais maintenant je vois."
        ]
      },
      {
        id: "s003-c2",
        label: "Couplet 2",
        type: "Couplet",
        text: "C'est la gr\xE2ce qui a enseign\xE9 \xE0 mon c\u0153ur \xE0 craindre,\nEt la gr\xE2ce mes craintes a soulag\xE9es ;\nCombien pr\xE9cieuse cette gr\xE2ce est apparue\nL'heure o\xF9 j'ai cru pour la premi\xE8re fois !",
        lines: [
          "C'est la gr\xE2ce qui a enseign\xE9 \xE0 mon c\u0153ur \xE0 craindre,",
          "Et la gr\xE2ce mes craintes a soulag\xE9es ;",
          "Combien pr\xE9cieuse cette gr\xE2ce est apparue",
          "L'heure o\xF9 j'ai cru pour la premi\xE8re fois !"
        ]
      },
      {
        id: "s003-c3",
        label: "Couplet 3",
        type: "Couplet",
        text: "Quand nous serons l\xE0 depuis dix mille ans,\nBrillants comme le soleil d'un jour parfait,\nNous n'aurons pas moins de jours pour chanter sa louange\nQue lorsque nous avons commenc\xE9 !",
        lines: [
          "Quand nous serons l\xE0 depuis dix mille ans,",
          "Brillants comme le soleil d'un jour parfait,",
          "Nous n'aurons pas moins de jours pour chanter sa louange",
          "Que lorsque nous avons commenc\xE9 !"
        ]
      }
    ]
  },
  {
    id: "song-004",
    number: "004",
    title: "Sur Le Chemin Du Ciel",
    category: "Chants de Victoire",
    author: "Traditionnel",
    keySignature: "D",
    sections: [
      {
        id: "s004-c1",
        label: "Couplet 1",
        type: "Couplet",
        text: "Je marche sur le chemin du Ciel, l'Esprit me conduit,\nLa lumi\xE8re de sa Parole \xE9claire mes pas nuit et jour.\nChaque jour J\xE9sus marche pr\xE8s de moi, je n'ai aucun effroi,\nCar sa promesse est \xE9ternelle pour son \xC9pouse en joie.",
        lines: [
          "Je marche sur le chemin du Ciel, l'Esprit me conduit,",
          "La lumi\xE8re de sa Parole \xE9claire mes pas nuit et jour.",
          "Chaque jour J\xE9sus marche pr\xE8s de moi, je n'ai aucun effroi,",
          "Car sa promesse est \xE9ternelle pour son \xC9pouse en joie."
        ]
      },
      {
        id: "s004-ref",
        label: "Refrain",
        type: "Refrain",
        text: "Gl\xF3ria, Hallelujah ! J\xE9sus est le Roi des rois !\nMon \xE2me est d\xE9livr\xE9e, je chante avec foi !\nGl\xF3ria, Hallelujah ! Bient\xF4t dans la cit\xE9 de paix,\nNous r\xE9gnerons avec J\xE9sus pour l'\xE9ternit\xE9 !",
        lines: [
          "Gl\xF3ria, Hallelujah ! J\xE9sus est le Roi des rois !",
          "Mon \xE2me est d\xE9livr\xE9e, je chante avec foi !",
          "Gl\xF3ria, Hallelujah ! Bient\xF4t dans la cit\xE9 de paix,",
          "Nous r\xE9gnerons avec J\xE9sus pour l'\xE9ternit\xE9 !"
        ]
      },
      {
        id: "s004-c2",
        label: "Couplet 2",
        type: "Couplet",
        text: "A la voix du septi\xE8me ange, le myst\xE8re est accompli,\nLa Parole de Dieu r\xE9v\xE9l\xE9e r\xE9veille nos esprits.\nLevons nos t\xEAtes chers p\xE8lerins, la r\xE9demption approche,\nLe Roi vient chercher ses \xE9lus sans tache et sans reproche !",
        lines: [
          "A la voix du septi\xE8me ange, le myst\xE8re est accompli,",
          "La Parole de Dieu r\xE9v\xE9l\xE9e r\xE9veille nos esprits.",
          "Levons nos t\xEAtes chers p\xE8lerins, la r\xE9demption approche,",
          "Le Roi vient chercher ses \xE9lus sans tache et sans reproche !"
        ]
      }
    ]
  },
  {
    id: "song-005",
    number: "005",
    title: "\xC0 la Croix o\xF9 mourut mon Sauveur",
    category: "Sur les Ailes de la Foi",
    author: "E.A. Hoffman",
    keySignature: "G",
    sections: [
      {
        id: "s005-c1",
        label: "Couplet 1",
        type: "Couplet",
        text: "\xC0 la croix o\xF9 mourut mon Sauveur,\nO\xF9 je criai pour laver mon c\u0153ur,\nO\xF9 le sang fut appliqu\xE9 \xE0 mon \xE2me,\nGloire \xE0 son Nom !",
        lines: [
          "\xC0 la croix o\xF9 mourut mon Sauveur,",
          "O\xF9 je criai pour laver mon c\u0153ur,",
          "O\xF9 le sang fut appliqu\xE9 \xE0 mon \xE2me,",
          "Gloire \xE0 son Nom !"
        ]
      },
      {
        id: "s005-ref",
        label: "Refrain",
        type: "Refrain",
        text: "Gloire \xE0 son Nom ! Gloire \xE0 son Nom !\nL\xE0 mon c\u0153ur fut purifi\xE9 du p\xE9ch\xE9,\nGloire \xE0 son Nom !",
        lines: [
          "Gloire \xE0 son Nom ! Gloire \xE0 son Nom !",
          "L\xE0 mon c\u0153ur fut purifi\xE9 du p\xE9ch\xE9,",
          "Gloire \xE0 son Nom !"
        ]
      },
      {
        id: "s005-c2",
        label: "Couplet 2",
        type: "Couplet",
        text: "Je suis si merveilleusement sauv\xE9 du p\xE9ch\xE9,\nJ\xE9sus demeure maintenant en moi ;\n\xC0 la croix o\xF9 Il me prit avec Lui,\nGloire \xE0 son Nom !",
        lines: [
          "Je suis si merveilleusement sauv\xE9 du p\xE9ch\xE9,",
          "J\xE9sus demeure maintenant en moi ;",
          "\xC0 la croix o\xF9 Il me prit avec Lui,",
          "Gloire \xE0 son Nom !"
        ]
      }
    ]
  },
  {
    id: "song-006",
    number: "006",
    title: "Quel Ami Fid\xE8le et Tendre",
    category: "Sur les Ailes de la Foi",
    author: "Joseph Scriven",
    keySignature: "F",
    sections: [
      {
        id: "s006-c1",
        label: "Couplet 1",
        type: "Couplet",
        text: "Quel ami fid\xE8le et tendre nous avons en J\xE9sus-Christ !\nToujours pr\xEAt \xE0 nous entendre, \xE0 r\xE9pondre \xE0 notre cri.\nAh ! quel repos nous perdons, quel soulagement exquis,\nQuand nous ne portons pas tout \xE0 Dieu dans la pri\xE8re !",
        lines: [
          "Quel ami fid\xE8le et tendre nous avons en J\xE9sus-Christ !",
          "Toujours pr\xEAt \xE0 nous entendre, \xE0 r\xE9pondre \xE0 notre cri.",
          "Ah ! quel repos nous perdons, quel soulagement exquis,",
          "Quand nous ne portons pas tout \xE0 Dieu dans la pri\xE8re !"
        ]
      },
      {
        id: "s006-c2",
        label: "Couplet 2",
        type: "Couplet",
        text: "S'il survient quelque \xE9preuve, si la tentation est l\xE0,\nQue jamais personne ne doute, la gr\xE2ce suffira.\nTrouverons-nous un ami plus fid\xE8le et plus puissant ?\nJ\xE9sus conna\xEEt nos faiblesses, portons-Lui tout en priant.",
        lines: [
          "S'il survient quelque \xE9preuve, si la tentation est l\xE0,",
          "Que jamais personne ne doute, la gr\xE2ce suffira.",
          "Trouverons-nous un ami plus fid\xE8le et plus puissant ?",
          "J\xE9sus conna\xEEt nos faiblesses, portons-Lui tout en priant."
        ]
      }
    ]
  }
];

// db.ts
var getDirname = () => {
  if (typeof __dirname !== "undefined" && __dirname) return __dirname;
  return process.cwd();
};
var currentDir = getDirname();
var SqliteAdapter = class {
  constructor() {
    this.inTransaction = false;
  }
  async init() {
    const dbPath = getDbPath();
    const locateFile = (file) => {
      const candidates = [
        import_path4.default.join(currentDir, file),
        import_path4.default.join(currentDir, "..", file),
        import_path4.default.join(currentDir, "..", "node_modules", "sql.js", "dist", file),
        import_path4.default.join(currentDir, "node_modules", "sql.js", "dist", file),
        import_path4.default.join(process.cwd(), "node_modules", "sql.js", "dist", file)
      ];
      for (const candidate of candidates) {
        if (import_fs4.default.existsSync(candidate)) return candidate;
      }
      return file;
    };
    let SQL;
    try {
      SQL = await (0, import_sql.default)({ locateFile });
    } catch {
      SQL = await (0, import_sql.default)();
    }
    if (import_fs4.default.existsSync(dbPath)) {
      try {
        const filebuffer = import_fs4.default.readFileSync(dbPath);
        const testDb = new SQL.Database(filebuffer);
        const check = testDb.exec("PRAGMA quick_check;");
        if (check && check.length > 0 && check[0].values[0][0] === "ok") {
          this.sqlDb = testDb;
          console.log(`\u2713 Connect\xE9 \xE0 la base de donn\xE9es SQLite (${dbPath}) via sql.js`);
        } else {
          throw new Error("Contr\xF4le d'int\xE9grit\xE9 de la base de donn\xE9es \xE9chou\xE9");
        }
      } catch (err) {
        console.warn(`\u26A0\uFE0F Base de donn\xE9es corrompue ou illisible (${dbPath}), r\xE9initialisation d'une base saine :`, err);
        try {
          if (import_fs4.default.existsSync(dbPath)) {
            import_fs4.default.unlinkSync(dbPath);
          }
        } catch {
        }
        this.sqlDb = new SQL.Database();
      }
    } else {
      this.sqlDb = new SQL.Database();
      console.log(`\u2713 Cr\xE9ation d'une nouvelle base de donn\xE9es SQLite (${dbPath}) via sql.js`);
    }
    this.initSchema();
  }
  getDatabaseBuffer() {
    const data = this.sqlDb.export();
    return Buffer.from(data);
  }
  async loadFromBuffer(buffer) {
    const locateFile = (file) => {
      return import_path4.default.join(process.cwd(), "node_modules", "sql.js", "dist", file);
    };
    const SQL = await (0, import_sql.default)({ locateFile });
    const testDb = new SQL.Database(buffer);
    const check = testDb.exec("PRAGMA quick_check;");
    if (check && check.length > 0 && check[0].values[0][0] === "ok") {
      this.sqlDb = testDb;
      this.saveDb();
      console.log("\u2713 Base de donn\xE9es SQLite recharg\xE9e avec succ\xE8s depuis un buffer");
      return true;
    } else {
      throw new Error("Le fichier fourni n'est pas une base de donn\xE9es SQLite valide.");
    }
  }
  saveDb() {
    try {
      const dbPath = getDbPath();
      const data = this.sqlDb.export();
      const buffer = Buffer.from(data);
      const tmpPath = `${dbPath}.tmp`;
      import_fs4.default.writeFileSync(tmpPath, buffer);
      import_fs4.default.renameSync(tmpPath, dbPath);
    } catch (err) {
      console.error("\u274C Erreur lors de la sauvegarde de sermons.db :", err);
    }
  }
  initSchema() {
    this.serialize(() => {
      try {
        this.sqlDb.run(`PRAGMA foreign_keys = ON;`);
      } catch {
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
  seedSampleData() {
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
        console.log("\u{1F331} Initialisation des brochures d'exemple dans la base de donn\xE9es...");
        const sampleSermons = [
          {
            id: "63-1128",
            title: "Le Signal Lumineux",
            date: "28/11/1963",
            lieu: "Jeffersonville, IN",
            type_structure: "PARAGRAPHE",
            paragraphs: [
              { num: 1, text: "Bonsoir, mes amis. C\u2019est un grand privil\xE8ge d\u2019\xEAtre de nouveau ici ce soir au Tabernacle Branham. Nous sommes si reconnaissants pour la gr\xE2ce de Dieu et Sa pr\xE9sence b\xE9nie parmi nous." },
              { num: 2, text: "Rappelez-vous le signal lumineux. Quand vous voyez un signal rouge sur la route ou sur la voie ferr\xE9e, cela signifie un danger imminent. Vous devez vous arr\xEAter et observer la lumi\xE8re avant de continuer." },
              { num: 3, text: "Dans ces derniers jours, Dieu a plac\xE9 Son signal d'avertissement. La Parole de Dieu est notre signal d'orientation immuable. Ne passez pas \xE0 c\xF4t\xE9 sans pr\xEAter attention." },
              { num: 4, text: "J\xE9sus a dit : 'Mes brebis entendent ma voix, et elles me suivent.' Quand le Saint-Esprit parle, l'\xC9pouse reconna\xEEt le signal et s'aligne sur la Parole r\xE9v\xE9l\xE9e." },
              { num: 5, text: "Que chacun de vous cherche le Seigneur de tout son c\u0153ur. Il n'y a pas de refuge en dehors de J\xE9sus-Christ." }
            ]
          },
          {
            id: "65-1207",
            title: "Leadership",
            date: "07/12/1965",
            lieu: "Covina, CA",
            type_structure: "PARAGRAPHE",
            paragraphs: [
              { num: 1, text: "Merci beaucoup. C\u2019est vraiment un grand honneur d\u2019\xEAtre avec vous tous ce soir \xE0 Covina. Nous demandons \xE0 Dieu de b\xE9nir cette pr\xE9cieuse assembl\xE9e." },
              { num: 2, text: "L'homme cherche toujours un leader \xE0 suivre. Il veut quelqu'un pour le conduire, mais trop souvent il choisit la conduite des hommes au lieu de Dieu." },
              { num: 3, text: "Il n'y a qu'un seul vrai Leader pour le croyant : c'est le Seigneur J\xE9sus-Christ par Son Saint-Esprit. Suivez la Colonne de Feu et la V\xE9rit\xE9 r\xE9v\xE9l\xE9e." },
              { num: 4, text: "Quand la Parole de Dieu est pr\xEAch\xE9e dans Sa puret\xE9, Elle am\xE8ne la vie \xE9ternelle. Laissez le Saint-Esprit conduire chaque \xE9tape de votre marche." },
              { num: 5, text: "Prions ensemble : P\xE8re c\xE9leste, guide Ton peuple ce soir par Ta gr\xE2ce et Ton Esprit Saint. Au nom de J\xE9sus. Amen." }
            ]
          },
          {
            id: "65-1127B",
            title: "La Nourriture Spirituelle au Temps Convenable",
            date: "27/11/1965",
            lieu: "Shreveport, LA",
            type_structure: "PARAGRAPHE",
            paragraphs: [
              { num: 1, text: "Que le Seigneur vous b\xE9nisse abondamment. C\u2019est une joie immense de me retrouver avec vous \xE0 Shreveport ce soir." },
              { num: 2, text: "Dieu a toujours pr\xE9par\xE9 une nourriture spirituelle emmagasin\xE9e pour Son peuple, adapt\xE9e \xE0 chaque \xE2ge et \xE0 chaque saison." },
              { num: 3, text: "Au temps du soir, la lumi\xE8re para\xEEtra. Dieu envoie la Manne fra\xEEche pour nourrir l'\xC9pouse avant le grand d\xE9part pour la Maison." },
              { num: 4, text: "La Parole r\xE9v\xE9l\xE9e est la vraie nourriture de l'\xE2me. Ceux qui ont faim et soif de justice seront pleinement rassasi\xE9s." },
              { num: 5, text: "Demeurez fid\xE8les \xE0 la Parole transmise aux saints. Dieu prend soin de Ses enfants en tout temps." }
            ]
          },
          {
            id: "63-0324M",
            title: "Le Septi\xE8me Sceau",
            date: "24/03/1963",
            lieu: "Jeffersonville, IN",
            type_structure: "PARAGRAPHE",
            paragraphs: [
              { num: 1, text: "Que Dieu vous b\xE9nisse ce matin. Nous terminons la s\xE9rie sur les Sept Sceaux avec ce glorieux myst\xE8re du Septi\xE8me Sceau." },
              { num: 2, text: "Quand le Septi\xE8me Sceau fut ouvert, il y eut un silence dans le ciel d'environ une demi-heure. C'\xE9tait un moment sacr\xE9 et solennel." },
              { num: 3, text: "Les myst\xE8res cach\xE9s depuis la fondation du monde sont maintenant r\xE9v\xE9l\xE9s pour pr\xE9parer l'\xC9pouse \xE0 l'Enl\xE8vement." },
              { num: 4, text: "Regardez \xE0 J\xE9sus, l'Auteur et le Consommateur de notre foi. Tout s'accomplit selon la promesse divine." }
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
        console.log("\u2713 Brochures d'exemple initialis\xE9es avec succ\xE8s dans la base de donn\xE9es.");
      }
      const stmtR = this.sqlDb.prepare("SELECT COUNT(*) as count FROM recueils");
      let countRecueils = 0;
      if (stmtR.step()) {
        countRecueils = Number(stmtR.getAsObject().count || 0);
      }
      stmtR.free();
      if (countRecueils === 0) {
        console.log("\u{1F331} Initialisation des recueils et cantiques d'exemple...");
        const defaultRecueils = [
          { id: "ce", title: "Cantiques de l'\xC9pouse", description: "Chants du Message et de l'\xC9pouse" },
          { id: "saf", title: "Sur les Ailes de la Foi", description: "Recueil classique \xE9vang\xE9lique" },
          { id: "cv", title: "Chants de Victoire", description: "Cantiques de louange et de victoire" }
        ];
        this.sqlDb.run("BEGIN TRANSACTION;");
        for (const r of defaultRecueils) {
          this.sqlDb.run("INSERT OR REPLACE INTO recueils (id, title, description) VALUES (?, ?, ?)", [r.id, r.title, r.description]);
        }
        for (const song of INITIAL_SONGS) {
          let recId = "ce";
          if (song.category === "Sur les Ailes de la Foi") recId = "saf";
          if (song.category === "Chants de Victoire") recId = "cv";
          this.sqlDb.run(
            `INSERT OR REPLACE INTO songs (id, recueil_id, number, title, category, author, key_signature, sections_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              song.id,
              recId,
              song.number,
              song.title,
              song.category || "",
              song.author || "",
              song.keySignature || "",
              JSON.stringify(song.sections)
            ]
          );
        }
        this.sqlDb.run("COMMIT;");
        this.saveDb();
        console.log("\u2713 Recueils et cantiques d'exemple initialis\xE9s avec succ\xE8s.");
      }
    } catch (e) {
      console.error("Erreur lors de l'initialisation des donn\xE9es d'exemple:", e);
    }
  }
  syncWithSermonFiles() {
    try {
      const sermonFiles = readAllSermonFiles();
      if (sermonFiles.length > 0) {
        console.log(`\u{1F4C1} ${sermonFiles.length} fichier(s) brochure(s) trouv\xE9(s) dans /sermons_data. Synchronisation vers la base de donn\xE9es...`);
        this.sqlDb.run("BEGIN TRANSACTION;");
        for (const s of sermonFiles) {
          this.sqlDb.run(
            `INSERT OR REPLACE INTO sermons (id, titre_francais, date_sermon, lieu, type_structure) VALUES (?, ?, ?, ?, ?)`,
            [s.id, s.titre_francais, s.date_sermon || "", s.lieu || "", s.type_structure || "PARAGRAPHE"]
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
        console.log(`\u2713 Synchronisation r\xE9ussie : ${sermonFiles.length} brochure(s) synchronis\xE9e(s) depuis leurs fichiers d\xE9di\xE9s (.sermon).`);
      } else {
        this.exportAllToFiles();
      }
    } catch (err) {
      console.error("Erreur lors de la synchronisation des fichiers de brochures :", err);
    }
  }
  exportAllToFiles() {
    try {
      this.all("SELECT * FROM sermons", [], (err, sermons) => {
        if (err || !sermons) return;
        for (const s of sermons) {
          this.all("SELECT numero_paragraphe, texte FROM paragraphes WHERE sermon_id = ? ORDER BY numero_paragraphe ASC", [s.id], (err2, paras) => {
            if (err2 || !paras) return;
            saveSermonToFile({
              version: "1.0",
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
  syncSingleSermonToFile(sermonId) {
    if (!sermonId) return;
    this.get("SELECT * FROM sermons WHERE id = ?", [sermonId], (err, s) => {
      if (err || !s) return;
      this.all("SELECT numero_paragraphe, texte FROM paragraphes WHERE sermon_id = ? ORDER BY numero_paragraphe ASC", [sermonId], (err2, paras) => {
        if (err2 || !paras) return;
        saveSermonToFile({
          version: "1.0",
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
  syncWithLyricsFiles() {
    try {
      const { recueils, songs } = readAllRecueilsAndSongsFromDisk();
      if (recueils.length > 0 || songs.length > 0) {
        console.log(`\u{1F4C1} ${recueils.length} recueil(s) et ${songs.length} cantique(s) trouv\xE9(s) sur le disque. Synchronisation DB...`);
        this.sqlDb.run("BEGIN TRANSACTION;");
        for (const r of recueils) {
          this.sqlDb.run(
            `INSERT OR REPLACE INTO recueils (id, title, description) VALUES (?, ?, ?)`,
            [r.id, r.title, r.description || ""]
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
              s.category || "",
              s.author || "",
              s.keySignature || "",
              JSON.stringify(s.sections)
            ]
          );
        }
        this.sqlDb.run("COMMIT;");
        this.saveDb();
        console.log(`\u2713 Synchronisation recueils/cantiques r\xE9ussie.`);
      } else {
        this.exportLyricsToFiles();
      }
    } catch (err) {
      console.error("Erreur synchronisation cantiques depuis le disque:", err);
    }
  }
  exportLyricsToFiles() {
    try {
      this.all("SELECT * FROM recueils", [], (err, recueils) => {
        if (err || !recueils) return;
        for (const r of recueils) {
          saveRecueilToFile({ id: r.id, title: r.title, description: r.description });
        }
        this.all("SELECT * FROM songs", [], (err2, songs) => {
          if (err2 || !songs) return;
          for (const s of songs) {
            let sections = [];
            try {
              sections = JSON.parse(s.sections_json);
            } catch {
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
  syncSingleSongToFile(songId) {
    if (!songId) return;
    this.get("SELECT * FROM songs WHERE id = ?", [songId], (err, s) => {
      if (err || !s) return;
      let sections = [];
      try {
        sections = JSON.parse(s.sections_json);
      } catch {
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
  serialize(callback) {
    callback();
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  run(sql, params, callback) {
    let actualParams = [];
    let actualCb = null;
    if (typeof params === "function") {
      actualCb = params;
    } else {
      if (Array.isArray(params)) {
        actualParams = params;
      } else if (params !== void 0 && params !== null) {
        actualParams = [params];
      }
      if (typeof callback === "function") {
        actualCb = callback;
      }
    }
    const trimmedSql = sql.trim().toUpperCase();
    if (trimmedSql.startsWith("BEGIN")) {
      this.inTransaction = true;
    }
    try {
      this.sqlDb.run(sql, actualParams);
      if (trimmedSql.startsWith("COMMIT") || trimmedSql.startsWith("ROLLBACK")) {
        this.inTransaction = false;
        this.saveDb();
      } else if (!this.inTransaction && !trimmedSql.startsWith("PRAGMA") && !trimmedSql.startsWith("SELECT")) {
        this.saveDb();
      }
      const context = { changes: this.sqlDb.getRowsModified() };
      if (actualCb) actualCb.call(context, null);
    } catch (err) {
      if (actualCb) actualCb(err);
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get(sql, params, callback) {
    let actualParams = [];
    let actualCb = null;
    if (typeof params === "function") {
      actualCb = params;
    } else {
      if (Array.isArray(params)) {
        actualParams = params;
      } else if (params !== void 0 && params !== null) {
        actualParams = [params];
      }
      if (typeof callback === "function") {
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
    } catch (err) {
      if (actualCb) actualCb(err, null);
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  all(sql, params, callback) {
    let actualParams = [];
    let actualCb = null;
    if (typeof params === "function") {
      actualCb = params;
    } else {
      if (Array.isArray(params)) {
        actualParams = params;
      } else if (params !== void 0 && params !== null) {
        actualParams = [params];
      }
      if (typeof callback === "function") {
        actualCb = callback;
      }
    }
    try {
      const stmt = this.sqlDb.prepare(sql);
      stmt.bind(actualParams);
      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      if (actualCb) actualCb(null, rows);
    } catch (err) {
      if (actualCb) actualCb(err, null);
    }
  }
  prepare(sql) {
    const self = this;
    const stmt = this.sqlDb.prepare(sql);
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      run(...args) {
        let callback = null;
        let params = [];
        if (args.length > 0 && typeof args[args.length - 1] === "function") {
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
          }
          stmt.run(params);
          if (callback) callback(null);
        } catch (err) {
          if (callback) callback(err);
        }
      },
      finalize(callback) {
        try {
          stmt.free();
          if (!self.inTransaction) {
            self.saveDb();
          }
          if (callback) callback(null);
        } catch (err) {
          if (callback) callback(err);
        }
      }
    };
  }
};
var db = new SqliteAdapter();

// server.ts
var app = (0, import_express.default)();
var server = import_http.default.createServer(app);
var io = new import_socket.Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
var userAppDataDir2 = process.env.APPDATA ? import_path5.default.join(process.env.APPDATA, "ProTextLive") : import_path5.default.join(process.env.HOME || (process.env.USERPROFILE || "."), ".protextlive");
var uploadDir = import_path5.default.join(userAppDataDir2, "uploads");
if (!import_fs5.default.existsSync(uploadDir)) {
  try {
    import_fs5.default.mkdirSync(uploadDir, { recursive: true });
  } catch (err) {
    console.error("Erreur de cr\xE9ation du dossier uploads:", err);
  }
}
var upload = (0, import_multer.default)({
  dest: uploadDir,
  limits: { fileSize: 50 * 1024 * 1024 }
});
app.use(import_express.default.json({ limit: "50mb" }));
app.use(import_express.default.urlencoded({ extended: true, limit: "50mb" }));
app.get("/favicon.ico", (_req, res) => res.status(204).end());
function decodeParam(param) {
  if (!param) return "";
  try {
    return decodeURIComponent(decodeURIComponent(param));
  } catch {
    try {
      return decodeURIComponent(param);
    } catch {
      return param;
    }
  }
}
function cleanPageHeadersAndFooters(pageText) {
  if (!pageText) return "";
  const lines = pageText.split(/\r?\n/);
  const filteredLines = lines.filter((line) => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    if (/^(https?:\/\/)?(www\.)?[a-z0-9\.\-]+\.(ch|ru|org|com|net|info|fr)(\/.*)?$/i.test(trimmed)) return false;
    if (/^(LETTRE\s+CIRCULAIRE|CIRCULAR\s+LETTER|SHEKINAH|VOICE\s+OF\s+GOD)/i.test(trimmed)) return false;
    if (/^\d{1,2}\.\d{2}\.\d{4}\s+\d{1,3}$/.test(trimmed)) return false;
    if (/^Page\s+\d+(\s*(of|\/)\s*\d+)?$/i.test(trimmed)) return false;
    return true;
  });
  return filteredLines.join("\n");
}
async function extractTextFromPDF(dataBuffer) {
  try {
    const pdfParseFunc = typeof pdfParseModule === "function" ? pdfParseModule : pdfParseModule.default || pdfParseModule;
    if (typeof pdfParseFunc === "function") {
      const parsed = await pdfParseFunc(dataBuffer, {
        pagerender: function(pageData) {
          return pageData.getTextContent({
            normalizeWhitespace: true,
            disableCombineTextItems: false
          }).then((textContent) => {
            let lastY = -1;
            let lastX = -1;
            let pageText = "";
            for (const item of textContent.items) {
              if (!item.str) continue;
              const x = item.transform[4];
              const y = item.transform[5];
              if (lastY !== -1 && Math.abs(y - lastY) > 5) {
                pageText += "\n";
              } else if (lastX !== -1) {
                const isEndSpace = pageText.endsWith(" ") || pageText.endsWith("\n");
                const isStartSpace = item.str.startsWith(" ");
                if (!isEndSpace && !isStartSpace) {
                  pageText += " ";
                }
              }
              pageText += item.str;
              lastY = y;
              lastX = x;
            }
            const cleanedPage = cleanPageHeadersAndFooters(pageText);
            return cleanedPage.trim();
          });
        }
      });
      if (parsed && parsed.text && parsed.text.trim().length > 20) {
        return parsed.text;
      }
    }
  } catch (pdfParseErr) {
    console.warn("\u26A0\uFE0F pdf-parse error, tentative avec pdf2json:", pdfParseErr?.message || pdfParseErr);
  }
  try {
    const textFromPdf2Json = await new Promise((resolve, reject) => {
      const pdfParser = new import_pdf2json.default();
      const timeout = setTimeout(() => {
        reject(new Error("Le traitement du PDF a d\xE9pass\xE9 le d\xE9lai imparti (30 secondes)."));
      }, 3e4);
      pdfParser.on("pdfParser_dataError", (errData) => {
        clearTimeout(timeout);
        reject(new Error(errData?.parserError || "Erreur lors de la lecture du fichier PDF."));
      });
      pdfParser.on("pdfParser_dataReady", (pdfData) => {
        clearTimeout(timeout);
        let fullText = "";
        if (pdfData && pdfData.Pages) {
          pdfData.Pages.forEach((page) => {
            if (page.Texts && page.Texts.length > 0) {
              let pageText = "";
              let lastY = -1;
              const sortedTexts = [...page.Texts].sort((a, b) => {
                if (Math.abs(a.y - b.y) > 0.3) return a.y - b.y;
                return a.x - b.x;
              });
              sortedTexts.forEach((t) => {
                let str = "";
                if (t.R) {
                  t.R.forEach((r) => {
                    if (r.T) {
                      let runText = "";
                      try {
                        runText = decodeURIComponent(r.T);
                      } catch {
                        runText = r.T;
                      }
                      if (runText) {
                        if (str && !str.endsWith(" ") && !runText.startsWith(" ")) {
                          str += " ";
                        }
                        str += runText;
                      }
                    }
                  });
                }
                if (!str.trim()) return;
                if (lastY >= 0 && t.y - lastY > 0.4) {
                  if (t.y - lastY > 1.15) {
                    pageText += "\n\n";
                  } else {
                    pageText += "\n";
                  }
                } else if (lastY >= 0) {
                  if (!pageText.endsWith(" ") && !pageText.endsWith("\n")) {
                    pageText += " ";
                  }
                }
                pageText += str.trim();
                lastY = t.y;
              });
              const cleanedPage = cleanPageHeadersAndFooters(pageText);
              if (cleanedPage.trim().length > 0) {
                fullText += cleanedPage.trim() + "\n--- PAGE_BREAK ---\n";
              }
            }
          });
        }
        if (!fullText.trim()) {
          fullText = pdfParser.getRawTextContent() || "";
        }
        resolve(fullText);
      });
      try {
        pdfParser.parseBuffer(dataBuffer);
      } catch (errParse) {
        clearTimeout(timeout);
        reject(errParse);
      }
    });
    if (textFromPdf2Json && textFromPdf2Json.trim().length > 10) {
      return textFromPdf2Json;
    }
  } catch (pdf2jsonErr) {
    console.warn("\u26A0\uFE0F pdf2json extraction error:", pdf2jsonErr?.message || pdf2jsonErr);
  }
  throw new Error("Impossible d'extraire le texte du PDF. Assurez-vous que le document contient du texte lisible.");
}
function formatExtractedParagraphText(rawChunk) {
  if (!rawChunk) return "";
  let text = rawChunk.replace(/--- PAGE_BREAK ---/g, "\n").replace(/Page\s+\d+(\s*(of|\/)\s*\d+)?/gi, "").replace(/^(LETTRE\s+CIRCULAIRE|CIRCULAR\s+LETTER|SHEKINAH|VOICE\s+OF\s+GOD).*/gim, "");
  text = text.replace(/([a-zA-ZáàâäéèêëíìîïóòôöúùûüçÇÁÀÂÄÉÈÊËÍÌÎÏÓÒÔÖÚÙÛÜ]{2,})[\-\u2010\u2013]\s*\r?\n\s*([a-zA-ZáàâäéèêëíìîïóòôöúùûüçÇÁÀÂÄÉÈÊËÍÌÎÏÓÒÔÖÚÙÛÜ]{2,})/g, "$1$2");
  text = text.replace(/([a-zA-ZáàâäéèêëíìîïóòôöúùûüçÇÁÀÂÄÉÈÊËÍÌÎÏÓÒÔÖÚÙÛÜ]{2,})[\-\u2010\u2013]\s+([a-zA-ZáàâäéèêëíìîïóòôöúùûüçÇÁÀÂÄÉÈÊËÍÌÎÏÓÒÔÖÚÙÛÜ]{2,})/g, "$1$2");
  text = text.replace(/(\b[ldcjnmstLDCJNMST])\s*['’`´]\s*([a-zA-ZáàâäéèêëíìîïóòôöúùûüçÇÁÀÂÄÉÈÊËÍÌÎÏÓÒÔÖÚÙÛÜ])/g, "$1'$2");
  const gluedPatterns = [
    [/nousnousattendonsapasserdesmoments/gi, "nous nous attendons \xE0 passer des moments "],
    [/nousattendonsaceque/gi, "nous attendons \xE0 ce que "],
    [/nousrencontrepourbenirnosamesetnousdonnerleschoses/gi, "nous rencontre pour b\xE9nir nos \xE2mes et nous donner les choses "],
    [/nousrencontrepourbénirnosâmesetnousdonnerleschoses/gi, "nous rencontre pour b\xE9nir nos \xE2mes et nous donner les choses "],
    [/dontnousavonsbesoin/gi, "dont nous avons besoin "],
    [/merveilleuxdansle/gi, "merveilleux dans le "],
    [/Enregardant/gi, "En regardant "],
    [/unpeupartout/gi, "un peu partout "],
    [/etenvoyant/gi, "et en voyant "],
    [/tantdemesamis/gi, "tant de mes amis "],
    [/cematin/gi, "ce matin"],
    [/jesuisvraimentravi/gi, "je suis vraiment ravi"],
    [/Jesuiscontent/gi, "Je suis content "],
    [/devoirFrereet/gi, "de voir Fr\xE8re et "],
    [/SœurDauchici/gi, "S\u0153ur Dauch ici"],
    [/del'Ohio/gi, "de l'Ohio"],
    [/Jevois/gi, "Je vois "],
    [/SœurArmstrong/gi, "S\u0153ur Armstrong "],
    [/labas/gi, "l\xE0-bas "],
    [/aufond/gi, "au fond "],
    [/quiontfait/gi, "qui ont fait "],
    [/letrajet/gi, "le trajet "],
    [/depuisl'Ohio/gi, "depuis l'Ohio"],
    [/QueDieuvous/gi, "Que Dieu vous "],
    [/benisseaussi/gi, "b\xE9nisse aussi"],
    [/bénisseaussi/gi, "b\xE9nisse aussi"],
    [/onenvoit/gi, "on en voit "],
    [/tantqu'ilseraitdifficiledelesnommertous/gi, "tant qu'il serait difficile de les nommer tous"],
    [/SceurHoover/gi, "S\u0153ur Hoover"],
    [/noussommescontentsdevousvoiricicematin/gi, "nous sommes contents de vous voir ici ce matin"],
    [/CharlieetNellie/gi, "Charlie et Nellie"],
    [/FrereJefferiesetsafamille/gi, "Fr\xE8re Jefferies et sa famille"],
    [/ettantd'autres/gi, "et tant d'autres"],
    [/quisontdel'exterieurdelaville/gi, "qui sont de l'ext\xE9rieur de la ville"],
    [/quisontde/gi, "qui sont de "],
    [/l'exterieurde/gi, "l'ext\xE9rieur de "],
    [/laville/gi, "la ville"]
  ];
  for (const [pat, rep] of gluedPatterns) {
    text = text.replace(pat, rep);
  }
  text = text.replace(/\b(nous|vous)(nous|vous)\b/gi, "$1 $2").replace(/\b(nous|vous)(attendons|attendez|attend|rencontre|rencontrent|avons|avez|sommes|êtes|etes)\b/gi, "$1 $2").replace(/\b(attendons|attendez|rencontre)(aceque|acequi|a|à)\b/gi, "$1 $2").replace(/\b(aceque|àceque)\b/gi, "\xE0 ce que").replace(/\b(acequi|àcequi)\b/gi, "\xE0 ce qui").replace(/\b(ceque|cequi)\b/gi, "ce que").replace(/\b(merveilleux|grand|petit|bon|mauvais|saint|sainte)(dans|sur|pour|avec|de|du|des|en|le|la|les)\b/gi, "$1 $2").replace(/\b(dans|sur|pour|avec|sous|vers|entre|sans|chez)(le|la|les|un|une|des|nos|vos|leurs|mon|ma|mes|ce|cet|cette|ces)\b/gi, "$1 $2").replace(/\b(pour|par|avec|dans|sur|sans)(benir|bénir|donner|passer|voir|prendre|faire|dire|aller|savoir)\b/gi, "$1 $2").replace(/\b(benir|bénir|donner|passer|voir|prendre|faire)(nos|vos|leurs|les|des|mes|tes|ses|un|une)\b/gi, "$1 $2").replace(/\b(nos|vos|leurs|mes|tes|ses)(ames|âmes|choses|coeurs|cœurs|vies|pensees|pensées)\b/gi, "$1 $2").replace(/\b(et|ou|mais|donc|car|ni)(nous|vous|il|elle|ils|elles|je|tu|on)\b/gi, "$1 $2").replace(/\b(dont|qui|que|quand|comme|si)(nous|vous|il|elle|ils|elles|je|tu|on)\b/gi, "$1 $2").replace(/\b(nous|vous|il|elle|ils|elles)(avons|avez|sommes|êtes|etes|sont|suis)\b/gi, "$1 $2").replace(/\b(avons|avez|sommes|sont)(besoin|confiance|peur|joie|paix)\b/gi, "$1 $2");
  text = text.replace(/([.,!?:;])([a-zA-ZáàâäéèêëíìîïóòôöúùûüçÇÁÀÂÄÉÈÊËÍÌÎÏÓÒÔÖÚÙÛÜ])/g, "$1 $2");
  text = text.replace(/([a-zàâäéèêëíìîïôöùûüç])([A-ZÉÈÀÂÊÎÔÛ])/g, "$1 $2");
  const gluedPrefixes = [
    "Je",
    "Tu",
    "Il",
    "Elle",
    "Nous",
    "Vous",
    "Ils",
    "Elles",
    "Que",
    "Qui",
    "Quoi",
    "Dont",
    "Quand",
    "Comme",
    "Si",
    "Mais",
    "Ou",
    "Et",
    "Donc",
    "Or",
    "Ni",
    "Car",
    "Pour",
    "Par",
    "Avec",
    "Dans",
    "Sur",
    "Sous",
    "Vers",
    "Entre",
    "Chez",
    "En",
    "De",
    "Du",
    "Des",
    "Au",
    "Aux",
    "Un",
    "Une",
    "Le",
    "La",
    "Les",
    "Ce",
    "Cet",
    "Cette",
    "Ces",
    "Mon",
    "Ma",
    "Mes",
    "Ton",
    "Ta",
    "Tes",
    "Son",
    "Sa",
    "Ses",
    "Notre",
    "Nos",
    "Votre",
    "Vos",
    "Leur",
    "Leurs",
    "Frere",
    "Fr\xE8re",
    "Soeur",
    "S\u0153ur",
    "Sceur",
    "Dieu",
    "Seigneur",
    "J\xE9sus",
    "Christ",
    "Pasteur"
  ];
  for (const prefix of gluedPrefixes) {
    const regex = new RegExp(`\\b(${prefix})([a-z\xE0\xE2\xE4\xE9\xE8\xEA\xEB\xED\xEC\xEE\xEF\xF4\xF6\xF9\xFB\xFC\xE7]{2,})\\b`, "g");
    text = text.replace(regex, (match, p1, p2) => {
      const lowerMatch = match.toLowerCase();
      const validSingleWords = ["cette", "notre", "votre", "leurs", "comme", "entre", "quand", "parce", "pourquoi", "toujours", "jamais", "encore", "depuis", "pendant", "devant", "derriere", "derri\xE8re", "frere", "fr\xE8re", "soeur", "s\u0153ur", "sceur", "seigneur", "pasteur", "certains", "plusieurs"];
      if (validSingleWords.includes(lowerMatch)) return match;
      return `${p1} ${p2}`;
    });
  }
  text = text.replace(/\s+([,.;:!?])/g, "$1");
  text = text.replace(/«\s+/g, "\xAB ").replace(/\s+»/g, " \xBB");
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  const blocks = [];
  let currentBlock = "";
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!currentBlock) {
      currentBlock = line;
    } else {
      const endsWithTerminal = /[.!?:"»”]$/.test(currentBlock);
      const startsWithCapOrQuote = /^[A-ZÉÈÀÂÊÎÔÛ«"“0-9]/.test(line);
      if (endsWithTerminal && startsWithCapOrQuote) {
        blocks.push(currentBlock);
        currentBlock = line;
      } else {
        currentBlock += " " + line;
      }
    }
  }
  if (currentBlock) {
    blocks.push(currentBlock);
  }
  return blocks.map((b) => b.replace(/\s+/g, " ").trim()).filter((b) => b.length > 0).join("\n\n");
}
function cleanPdfRawText(rawText) {
  if (!rawText) return "";
  let text = rawText;
  text = text.replace(/Page\s+\d+(\s*(of|\/)\s*\d+)?/gi, "");
  return text;
}
function parsePDFTextToParagraphs(rawText, modeDecoupage = "AUTO") {
  const cleanText = cleanPdfRawText(rawText);
  const items = [];
  if (modeDecoupage === "NUMEROTE" || modeDecoupage === "AUTO") {
    const candidateRegex = /(?:^|\r?\n)\s*(?:§\s*|p\.\s*|paragraphe\s*|\[)?(\d{1,4})(?:[\.\)\:\-\s\]]+|\r?\n)+(?=[^\s])/gi;
    const candidates = [];
    let m;
    while ((m = candidateRegex.exec(cleanText)) !== null) {
      const num = parseInt(m[1], 10);
      if (num > 0 && num < 2e3 && !(num >= 1900 && num <= 2099)) {
        candidates.push({
          num,
          matchIndex: m.index,
          matchLength: m[0].length
        });
      }
    }
    let bestSeq = [];
    for (let startIdx = 0; startIdx < Math.min(10, candidates.length); startIdx++) {
      const seq = [candidates[startIdx]];
      let currentNum = candidates[startIdx].num;
      let lastIndex = candidates[startIdx].matchIndex;
      for (let i = startIdx + 1; i < candidates.length; i++) {
        const cand = candidates[i];
        if (cand.matchIndex <= lastIndex) continue;
        if (cand.num === currentNum + 1) {
          seq.push(cand);
          currentNum = cand.num;
          lastIndex = cand.matchIndex;
        } else if (cand.num > currentNum + 1 && cand.num <= currentNum + 3) {
          const hasExactNext = candidates.slice(i).some((c) => c.num === currentNum + 1);
          if (!hasExactNext) {
            seq.push(cand);
            currentNum = cand.num;
            lastIndex = cand.matchIndex;
          }
        }
      }
      if (seq.length > bestSeq.length) {
        bestSeq = seq;
      }
    }
    if (bestSeq.length >= 2) {
      for (let i = 0; i < bestSeq.length; i++) {
        const curr = bestSeq[i];
        const next = bestSeq[i + 1];
        const start = curr.matchIndex + curr.matchLength;
        const end = next ? next.matchIndex : cleanText.length;
        const rawChunk = cleanText.substring(start, end);
        const formattedText = formatExtractedParagraphText(rawChunk);
        if (formattedText.length > 0) {
          items.push({ num: curr.num, text: formattedText });
        }
      }
      return { type_structure: "PARAGRAPHE", items };
    }
  }
  const pages = cleanText.split(/--- PAGE_BREAK ---/);
  let pageNum = 1;
  for (const pageRaw of pages) {
    const formattedPageText = formatExtractedParagraphText(pageRaw);
    if (formattedPageText.length > 0) {
      items.push({ num: pageNum++, text: formattedPageText });
    }
  }
  if (items.length > 0) {
    return { type_structure: "PAGE", items };
  }
  return { type_structure: "PAGE", items: [] };
}
var dernierParagrapheProjete = null;
var themesLibrary = [];
var DEFAULT_ECRANS = {
  "audience": {
    id: "audience",
    name: "\xC9cran Audience (HDMI / Projecteur)",
    outputType: "hdmi",
    description: "Sortie HDMI Principale Vid\xE9oprojecteur & Projection",
    enabled: true,
    defaultThemeId: "",
    moduleThemes: {
      brochures: "",
      lyrics: "",
      bible: ""
    },
    style: {
      mode: "CENTER_CARD",
      theme: "custom",
      bgType: "color",
      align: "center",
      fontFamily: "Inter",
      textColor: "#FFFFFF",
      containerBg: "rgba(8, 11, 18, 0.95)",
      containerBorderColor: "rgba(56, 189, 248, 0.25)",
      containerBorderWidth: 1,
      containerBorderRadius: 20,
      containerPadding: 36,
      showHeader: true,
      showBadge: true
    }
  },
  "stage": {
    id: "stage",
    name: "\xC9cran Stage / Prompteur (HDMI)",
    outputType: "stage",
    description: "Retour Sc\xE8ne & Teleprompter Orateur",
    enabled: true,
    defaultThemeId: "",
    moduleThemes: {
      brochures: "",
      lyrics: "",
      bible: ""
    },
    style: {
      mode: "TOP_BANNER",
      theme: "dark",
      align: "left",
      fontFamily: "Inter",
      textColor: "#FFEB3B",
      containerBg: "#000000",
      containerBorderColor: "#FFEB3B",
      containerBorderWidth: 2,
      containerBorderRadius: 8,
      containerPadding: 24,
      showHeader: true,
      showBadge: true
    }
  }
};
var ecransProjectionConfig = { ...DEFAULT_ECRANS };
function getProjectionConfigFile() {
  return import_path5.default.join(getDataDir(), "projection_config.json");
}
function loadProjectionConfigFromDisk() {
  try {
    const file = getProjectionConfigFile();
    if (import_fs5.default.existsSync(file)) {
      const content = import_fs5.default.readFileSync(file, "utf-8");
      const parsed = JSON.parse(content);
      if (parsed.ecrans && typeof parsed.ecrans === "object") {
        ecransProjectionConfig = parsed.ecrans;
      }
      if (Array.isArray(parsed.themes)) {
        themesLibrary = parsed.themes;
      }
      console.log("\u2713 Configuration des \xE9crans et th\xE8mes de projection charg\xE9e depuis le disque.");
    }
    delete ecransProjectionConfig["plein-ecran"];
    delete ecransProjectionConfig["lower-third"];
    delete ecransProjectionConfig["retour-scene"];
    if (!ecransProjectionConfig["audience"]) {
      ecransProjectionConfig["audience"] = DEFAULT_ECRANS["audience"];
    }
    if (!ecransProjectionConfig["stage"]) {
      ecransProjectionConfig["stage"] = DEFAULT_ECRANS["stage"];
    }
    saveProjectionConfigToDisk();
  } catch (err) {
    console.error("Erreur chargement projection_config.json:", err);
  }
}
function saveProjectionConfigToDisk() {
  try {
    const file = getProjectionConfigFile();
    import_fs5.default.writeFileSync(file, JSON.stringify({
      ecrans: ecransProjectionConfig,
      themes: themesLibrary
    }, null, 2), "utf-8");
  } catch (err) {
    console.error("Erreur sauvegarde projection_config.json:", err);
  }
}
loadProjectionConfigFromDisk();
io.on("connection", (socket) => {
  console.log("\u{1F50C} Client connect\xE9 (ID:", socket.id, ")");
  if (dernierParagrapheProjete) {
    socket.emit("afficher-paragraphe", dernierParagrapheProjete);
  }
  socket.emit("mise-a-jour-ecrans", {
    ecrans: Object.values(ecransProjectionConfig),
    themes: themesLibrary
  });
  if (ecransProjectionConfig["audience"]) {
    socket.emit("appliquer-style-projection", ecransProjectionConfig["audience"].style);
  }
  socket.on("projeter-paragraphe", (data) => {
    dernierParagrapheProjete = data;
    io.emit("afficher-paragraphe", data);
  });
  socket.on("update-screens-and-themes", ({ ecrans, themes }) => {
    if (Array.isArray(ecrans)) {
      const newMap = {};
      ecrans.forEach((scr) => {
        if (scr.id && scr.id !== "plein-ecran" && scr.id !== "lower-third" && scr.id !== "retour-scene") {
          newMap[scr.id] = scr;
        }
      });
      if (!newMap["audience"]) newMap["audience"] = DEFAULT_ECRANS["audience"];
      if (!newMap["stage"]) newMap["stage"] = DEFAULT_ECRANS["stage"];
      ecransProjectionConfig = newMap;
    }
    if (Array.isArray(themes)) {
      themesLibrary = themes;
    }
    saveProjectionConfigToDisk();
    io.emit("mise-a-jour-ecrans", {
      ecrans: Object.values(ecransProjectionConfig),
      themes: themesLibrary
    });
  });
  socket.on("changer-style-ecran", ({ screenId, styleData }) => {
    if (!screenId) return;
    if (!ecransProjectionConfig[screenId]) {
      ecransProjectionConfig[screenId] = {
        id: screenId,
        name: `\xC9cran ${screenId}`,
        enabled: true,
        defaultThemeId: "dark-fullscreen",
        moduleThemes: { brochures: "dark-fullscreen", lyrics: "dark-fullscreen", bible: "dark-fullscreen" },
        style: styleData
      };
    } else {
      ecransProjectionConfig[screenId].style = {
        ...ecransProjectionConfig[screenId].style,
        ...styleData
      };
    }
    if (screenId === "audience") {
      io.emit("appliquer-style-projection", ecransProjectionConfig[screenId].style);
    }
    saveProjectionConfigToDisk();
    io.emit("mise-a-jour-ecrans", {
      ecrans: Object.values(ecransProjectionConfig),
      themes: themesLibrary
    });
  });
  socket.on("ajouter-ecran", ({ id, name, mode, outputType, description }) => {
    if (!id && !name) return;
    const rawName = name || "Nouvel \xC9cran";
    const cleanId = (id || rawName).toLowerCase().trim().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
    const finalId = cleanId || `ecran-${Date.now()}`;
    ecransProjectionConfig[finalId] = {
      id: finalId,
      name: rawName,
      outputType: outputType || "custom",
      description: description || (outputType === "hdmi" ? "Sortie Second \xC9cran HDMI" : "\xC9cran de Sortie Personnalis\xE9"),
      enabled: true,
      defaultThemeId: "",
      moduleThemes: {
        brochures: "",
        lyrics: "",
        bible: ""
      },
      style: {
        mode: mode || "CENTER_CARD",
        theme: "custom",
        align: "center",
        containerBg: "rgba(13, 17, 23, 0.95)",
        containerBorderColor: "rgba(56, 189, 248, 0.25)",
        containerBorderWidth: 1,
        containerBorderRadius: 16,
        containerPadding: 24,
        textColor: "#ffffff",
        showHeader: true,
        showBadge: true
      }
    };
    saveProjectionConfigToDisk();
    io.emit("mise-a-jour-ecrans", {
      ecrans: Object.values(ecransProjectionConfig),
      themes: themesLibrary
    });
  });
  socket.on("supprimer-ecran", ({ screenId }) => {
    if (screenId && screenId !== "audience" && screenId !== "stage" && ecransProjectionConfig[screenId]) {
      delete ecransProjectionConfig[screenId];
      saveProjectionConfigToDisk();
      io.emit("mise-a-jour-ecrans", {
        ecrans: Object.values(ecransProjectionConfig),
        themes: themesLibrary
      });
    }
  });
  socket.on("changer-style-projection", (styleData) => {
    const targetId = styleData?.screenId || "audience";
    if (ecransProjectionConfig[targetId]) {
      ecransProjectionConfig[targetId].style = {
        ...ecransProjectionConfig[targetId].style,
        ...styleData
      };
    } else if (ecransProjectionConfig["audience"]) {
      ecransProjectionConfig["audience"].style = {
        ...ecransProjectionConfig["audience"].style,
        ...styleData
      };
    }
    saveProjectionConfigToDisk();
    io.emit("appliquer-style-projection", styleData);
    io.emit("mise-a-jour-ecrans", {
      ecrans: Object.values(ecransProjectionConfig),
      themes: themesLibrary
    });
  });
  socket.on("disconnect", () => {
    console.log("\u274C Client d\xE9connect\xE9 (ID:", socket.id, ")");
  });
});
app.get("/api/recueils", (_req, res) => {
  db.all(`
    SELECT r.*, COUNT(s.id) as songsCount 
    FROM recueils r 
    LEFT JOIN songs s ON r.id = s.recueil_id 
    GROUP BY r.id 
    ORDER BY r.title ASC
  `, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});
app.post("/api/recueils", (req, res) => {
  const { title, description } = req.body || {};
  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Le titre du recueil est obligatoire." });
  }
  const cleanTitle = title.trim();
  const id = sanitizeSlug(cleanTitle);
  const desc = description ? description.trim() : "";
  db.run(
    "INSERT OR REPLACE INTO recueils (id, title, description) VALUES (?, ?, ?)",
    [id, cleanTitle, desc],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      saveRecueilToFile({ id, title: cleanTitle, description: desc });
      res.json({ success: true, recueil: { id, title: cleanTitle, description: desc, songsCount: 0 } });
    }
  );
});
app.put("/api/recueils/:id", (req, res) => {
  const id = req.params.id;
  const { title, description } = req.body || {};
  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Le titre du recueil est obligatoire." });
  }
  db.run(
    "UPDATE recueils SET title = ?, description = ? WHERE id = ?",
    [title.trim(), description || "", id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      saveRecueilToFile({ id, title: title.trim(), description: description || "" });
      res.json({ success: true });
    }
  );
});
app.delete("/api/recueils/:id", (req, res) => {
  const id = req.params.id;
  db.serialize(() => {
    db.run("DELETE FROM songs WHERE recueil_id = ?", [id]);
    db.run("DELETE FROM recueils WHERE id = ?", [id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      deleteRecueilFolder(id);
      res.json({ success: true, id });
    });
  });
});
app.get("/api/songs", (req, res) => {
  const recueilId = req.query.recueil_id;
  let sql = "SELECT * FROM songs ORDER BY CAST(number AS INTEGER) ASC, number ASC";
  let params = [];
  if (recueilId) {
    sql = "SELECT * FROM songs WHERE recueil_id = ? ORDER BY CAST(number AS INTEGER) ASC, number ASC";
    params = [recueilId];
  }
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const formatted = (rows || []).map((r) => {
      let sections = [];
      try {
        sections = JSON.parse(r.sections_json);
      } catch {
      }
      return {
        id: r.id,
        recueil_id: r.recueil_id,
        number: r.number,
        title: r.title,
        category: r.category,
        author: r.author,
        keySignature: r.key_signature,
        sections
      };
    });
    res.json(formatted);
  });
});
app.post("/api/songs", (req, res) => {
  const { id, recueil_id, number, title, category, author, keySignature, sections } = req.body || {};
  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Le titre du cantique est obligatoire." });
  }
  const songId = id || `song-${Date.now()}`;
  const recId = recueil_id || "ce";
  const num = number ? `${number}`.trim() : "001";
  const cleanTitle = title.trim();
  const cat = category || "";
  const aut = author || "";
  const keySig = keySignature || "";
  const sectionsArr = Array.isArray(sections) ? sections : [];
  db.run(
    `INSERT OR REPLACE INTO songs (id, recueil_id, number, title, category, author, key_signature, sections_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [songId, recId, num, cleanTitle, cat, aut, keySig, JSON.stringify(sectionsArr)],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      const newSong = {
        id: songId,
        recueil_id: recId,
        number: num,
        title: cleanTitle,
        category: cat,
        author: aut,
        keySignature: keySig,
        sections: sectionsArr
      };
      saveSongToFile(newSong);
      res.json({ success: true, song: newSong });
    }
  );
});
app.delete("/api/songs/:id", (req, res) => {
  const songId = req.params.id;
  db.get("SELECT recueil_id FROM songs WHERE id = ?", [songId], (err, row) => {
    const recId = row ? row.recueil_id : "ce";
    db.run("DELETE FROM songs WHERE id = ?", [songId], function(err2) {
      if (err2) return res.status(500).json({ error: err2.message });
      deleteSongFile(recId, songId);
      res.json({ success: true, id: songId });
    });
  });
});
app.get("/api/sermons", (_req, res) => {
  db.all("SELECT * FROM sermons ORDER BY id ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});
app.get("/api/sermons/:id", (req, res) => {
  const sermonId = decodeParam(req.params.id);
  db.get("SELECT * FROM sermons WHERE id = ?", [sermonId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Brochure introuvable." });
    res.json(row);
  });
});
app.put("/api/sermons/:id", (req, res) => {
  const sermonId = decodeParam(req.params.id);
  const { titre_francais, date_sermon, lieu } = req.body;
  db.run(
    "UPDATE sermons SET titre_francais = ?, date_sermon = ?, lieu = ? WHERE id = ?",
    [titre_francais, date_sermon, lieu, sermonId],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      db.syncSingleSermonToFile(sermonId);
      res.json({ success: true });
    }
  );
});
app.get("/api/sermons/:id/export-file", (req, res) => {
  const sermonId = decodeParam(req.params.id);
  db.get("SELECT * FROM sermons WHERE id = ?", [sermonId], (err, sermon) => {
    if (err || !sermon) return res.status(404).json({ error: "Brochure introuvable." });
    db.all("SELECT numero_paragraphe, texte FROM paragraphes WHERE sermon_id = ? ORDER BY numero_paragraphe ASC", [sermonId], (err2, paras) => {
      if (err2) return res.status(500).json({ error: err2.message });
      const sermonObj = {
        version: "1.0",
        id: sermon.id,
        titre_francais: sermon.titre_francais,
        date_sermon: sermon.date_sermon || "",
        lieu: sermon.lieu || "",
        type_structure: sermon.type_structure || "PARAGRAPHE",
        updated_at: (/* @__PURE__ */ new Date()).toISOString(),
        paragraphes: paras || []
      };
      const filename = getSermonFileName(sermon.id, sermon.titre_francais);
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(JSON.stringify(sermonObj, null, 2));
    });
  });
});
app.post("/api/sermons/import-file", (req, res, next) => {
  upload.single("sermonFile")(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, (req, res) => {
  try {
    let sermonData = null;
    if (req.file) {
      const content = import_fs5.default.readFileSync(req.file.path, "utf-8");
      sermonData = JSON.parse(content);
      if (import_fs5.default.existsSync(req.file.path)) import_fs5.default.unlinkSync(req.file.path);
    } else if (req.body && req.body.id && req.body.titre_francais) {
      sermonData = req.body;
    }
    if (!sermonData || !sermonData.id || !sermonData.titre_francais) {
      return res.status(400).json({ error: "Fichier brochure (.sermon) invalide ou informations manquantes." });
    }
    const sermonId = sermonData.id.trim();
    const title = sermonData.titre_francais.trim();
    const dateSermon = sermonData.date_sermon || "";
    const lieu = sermonData.lieu || "";
    const typeStructure = sermonData.type_structure || "PARAGRAPHE";
    const paragraphes = Array.isArray(sermonData.paragraphes) ? sermonData.paragraphes : [];
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");
      db.run(
        `INSERT OR REPLACE INTO sermons (id, titre_francais, date_sermon, lieu, type_structure) VALUES (?, ?, ?, ?, ?)`,
        [sermonId, title, dateSermon, lieu, typeStructure]
      );
      db.run("DELETE FROM paragraphes WHERE sermon_id = ?", [sermonId]);
      for (const p of paragraphes) {
        db.run(
          "INSERT OR REPLACE INTO paragraphes (sermon_id, numero_paragraphe, texte) VALUES (?, ?, ?)",
          [sermonId, p.numero_paragraphe, p.texte]
        );
      }
      db.run("COMMIT", (err) => {
        if (err) return res.status(500).json({ error: err.message });
        saveSermonToFile({
          version: "1.0",
          id: sermonId,
          titre_francais: title,
          date_sermon: dateSermon,
          lieu,
          type_structure: typeStructure,
          paragraphes
        });
        res.json({ success: true, id: sermonId, title, count: paragraphes.length });
      });
    });
  } catch (err) {
    res.status(400).json({ error: "Erreur d'importation de la brochure : " + (err?.message || err) });
  }
});
app.get("/api/sermons/export-zip", async (_req, res) => {
  try {
    const dataDir = ensureSermonsDataDir();
    let files = import_fs5.default.readdirSync(dataDir).filter((f) => f.endsWith(".sermon") || f.endsWith(".json"));
    if (files.length === 0) {
      db.exportAllToFiles();
      files = import_fs5.default.readdirSync(dataDir).filter((f) => f.endsWith(".sermon") || f.endsWith(".json"));
    }
    const zip = new import_jszip.default();
    for (const file of files) {
      const filePath = import_path5.default.join(dataDir, file);
      const content = import_fs5.default.readFileSync(filePath);
      zip.file(file, content);
    }
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", 'attachment; filename="toutes_les_brochures_sermons.zip"');
    res.send(zipBuffer);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la cr\xE9ation de l'archive ZIP : " + (err?.message || err) });
  }
});
app.post("/api/sermons/delete", (req, res) => {
  const { id } = req.body || {};
  const sermonId = typeof id === "string" ? id.trim() : "";
  if (!sermonId) {
    return res.status(400).json({ error: "Identifiant de brochure manquant." });
  }
  db.serialize(() => {
    db.run("DELETE FROM paragraphes WHERE sermon_id = ? OR LOWER(TRIM(sermon_id)) = LOWER(TRIM(?))", [sermonId, sermonId]);
    db.run("DELETE FROM sermons WHERE id = ? OR LOWER(TRIM(id)) = LOWER(TRIM(?))", [sermonId, sermonId], function(err) {
      if (err) {
        console.error("Erreur suppression DB:", err);
        return res.status(500).json({ error: "Erreur lors de la suppression : " + err.message });
      }
      deleteSermonFile(sermonId);
      res.json({ success: true, id: sermonId });
    });
  });
});
app.delete("/api/sermons/:id", (req, res) => {
  const sermonIdRaw = decodeParam(req.params.id);
  const sermonId = sermonIdRaw.trim();
  if (!sermonId) {
    return res.status(400).json({ error: "Identifiant de brochure manquant." });
  }
  db.serialize(() => {
    db.run("DELETE FROM paragraphes WHERE sermon_id = ? OR LOWER(TRIM(sermon_id)) = LOWER(TRIM(?))", [sermonId, sermonIdRaw]);
    db.run("DELETE FROM sermons WHERE id = ? OR LOWER(TRIM(id)) = LOWER(TRIM(?))", [sermonId, sermonIdRaw], function(err) {
      if (err) {
        console.error("Erreur suppression DB:", err);
        return res.status(500).json({ error: "Erreur lors de la suppression : " + err.message });
      }
      deleteSermonFile(sermonId);
      res.json({ success: true, id: sermonId });
    });
  });
});
app.get("/api/sermons/:id/paragraphes", (req, res) => {
  const sermonId = decodeParam(req.params.id);
  db.all(
    "SELECT * FROM paragraphes WHERE sermon_id = ? ORDER BY numero_paragraphe ASC",
    [sermonId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows || []);
    }
  );
});
app.post("/api/sermons/:id/paragraphes", (req, res) => {
  const sermonId = decodeParam(req.params.id);
  const { numero_paragraphe, texte } = req.body;
  db.run(
    "INSERT OR REPLACE INTO paragraphes (sermon_id, numero_paragraphe, texte) VALUES (?, ?, ?)",
    [sermonId, numero_paragraphe, texte],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      db.syncSingleSermonToFile(sermonId);
      res.json({ success: true });
    }
  );
});
app.put("/api/sermons/:id/paragraphes/:num", (req, res) => {
  const sermonId = decodeParam(req.params.id);
  const oldNum = parseInt(req.params.num, 10);
  const { nouveau_numero, texte } = req.body;
  db.run(
    "UPDATE paragraphes SET numero_paragraphe = ?, texte = ? WHERE sermon_id = ? AND numero_paragraphe = ?",
    [nouveau_numero, texte, sermonId, oldNum],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      db.syncSingleSermonToFile(sermonId);
      res.json({ success: true });
    }
  );
});
app.delete("/api/sermons/:id/paragraphes/:num", (req, res) => {
  const sermonId = decodeParam(req.params.id);
  const num = parseInt(req.params.num, 10);
  db.run("DELETE FROM paragraphes WHERE sermon_id = ? AND numero_paragraphe = ?", [sermonId, num], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    db.syncSingleSermonToFile(sermonId);
    res.json({ success: true });
  });
});
app.post("/api/sermons/:id/paragraphes/:num/scinder", (req, res) => {
  const sermonId = decodeParam(req.params.id);
  const num = parseInt(req.params.num, 10);
  const { position } = req.body;
  db.get("SELECT texte FROM paragraphes WHERE sermon_id = ? AND numero_paragraphe = ?", [sermonId, num], (err, row) => {
    if (err || !row) return res.status(404).json({ error: "Paragraphe introuvable" });
    const fullText = row.texte;
    const part1 = fullText.substring(0, position).trim();
    const part2 = fullText.substring(position).trim();
    db.serialize(() => {
      db.run("UPDATE paragraphes SET numero_paragraphe = numero_paragraphe + 1 WHERE sermon_id = ? AND numero_paragraphe > ?", [sermonId, num]);
      db.run("UPDATE paragraphes SET texte = ? WHERE sermon_id = ? AND numero_paragraphe = ?", [part1, sermonId, num]);
      db.run("INSERT INTO paragraphes (sermon_id, numero_paragraphe, texte) VALUES (?, ?, ?)", [part2, sermonId, num + 1], (err2) => {
        if (err2) return res.status(500).json({ error: err2.message });
        db.syncSingleSermonToFile(sermonId);
        res.json({ success: true });
      });
    });
  });
});
app.post("/api/sermons/:id/paragraphes/:num/fusionner", (req, res) => {
  const sermonId = decodeParam(req.params.id);
  const num = parseInt(req.params.num, 10);
  db.all("SELECT numero_paragraphe, texte FROM paragraphes WHERE sermon_id = ? AND numero_paragraphe IN (?, ?) ORDER BY numero_paragraphe ASC", [sermonId, num, num + 1], (err, rows) => {
    if (err || rows.length < 2) return res.status(400).json({ error: "Fusion impossible." });
    const nouveauTexte = rows[0].texte + " " + rows[1].texte;
    db.serialize(() => {
      db.run("UPDATE paragraphes SET texte = ? WHERE sermon_id = ? AND numero_paragraphe = ?", [nouveauTexte, sermonId, num]);
      db.run("DELETE FROM paragraphes WHERE sermon_id = ? AND numero_paragraphe = ?", [sermonId, num + 1]);
      db.run("UPDATE paragraphes SET numero_paragraphe = numero_paragraphe - 1 WHERE sermon_id = ? AND numero_paragraphe > ?", [sermonId, num + 1], (err2) => {
        if (err2) return res.status(500).json({ error: err2.message });
        db.syncSingleSermonToFile(sermonId);
        res.json({ success: true });
      });
    });
  });
});
app.post("/api/sermons/:id/paragraphes/:num/permuter", (req, res) => {
  const sermonId = decodeParam(req.params.id);
  const num = parseInt(req.params.num, 10);
  const { direction } = req.body;
  const targetNum = direction === "up" ? num - 1 : num + 1;
  db.all("SELECT numero_paragraphe, texte FROM paragraphes WHERE sermon_id = ? AND numero_paragraphe IN (?, ?)", [sermonId, num, targetNum], (err, rows) => {
    if (err || rows.length < 2) return res.status(400).json({ error: "Permutation impossible." });
    const p1 = rows.find((r) => r.numero_paragraphe === num);
    const p2 = rows.find((r) => r.numero_paragraphe === targetNum);
    if (!p1 || !p2) return res.status(400).json({ error: "Paragraphes introuvables." });
    db.serialize(() => {
      db.run("UPDATE paragraphes SET texte = ? WHERE sermon_id = ? AND numero_paragraphe = ?", [p2.texte, sermonId, num]);
      db.run("UPDATE paragraphes SET texte = ? WHERE sermon_id = ? AND numero_paragraphe = ?", [p1.texte, sermonId, targetNum], (err2) => {
        if (err2) return res.status(500).json({ error: err2.message });
        db.syncSingleSermonToFile(sermonId);
        res.json({ success: true, nouveauNumero: targetNum });
      });
    });
  });
});
app.post("/api/sermons/:id/renumeroter", (req, res) => {
  const sermonId = decodeParam(req.params.id);
  db.all("SELECT rowid, numero_paragraphe FROM paragraphes WHERE sermon_id = ? ORDER BY numero_paragraphe ASC", [sermonId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");
      const stmt = db.prepare("UPDATE paragraphes SET numero_paragraphe = ? WHERE sermon_id = ? AND rowid = ?");
      rows.forEach((row, idx) => {
        stmt.run(idx + 1, sermonId, row.rowid);
      });
      stmt.finalize(() => {
        db.run("COMMIT", (errCommit) => {
          if (errCommit) return res.status(500).json({ error: errCommit.message });
          db.syncSingleSermonToFile(sermonId);
          res.json({ success: true });
        });
      });
    });
  });
});
app.post("/api/sermons/:id/remplacer", (req, res) => {
  const sermonId = decodeParam(req.params.id);
  const { recherche, remplacement } = req.body;
  if (!recherche) return res.status(400).json({ error: "Terme de recherche vide" });
  db.all("SELECT numero_paragraphe, texte FROM paragraphes WHERE sermon_id = ? AND texte LIKE ?", [sermonId, `%${recherche}%`], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    let count = 0;
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");
      const stmt = db.prepare("UPDATE paragraphes SET texte = ? WHERE sermon_id = ? AND numero_paragraphe = ?");
      rows.forEach((r) => {
        const newText = r.texte.replaceAll(recherche, remplacement || "");
        stmt.run(newText, sermonId, r.numero_paragraphe);
        count++;
      });
      stmt.finalize(() => {
        db.run("COMMIT", () => {
          res.json({ success: true, count });
        });
      });
    });
  });
});
app.get("/api/db/export", (_req, res) => {
  try {
    const buffer = db.getDatabaseBuffer();
    res.setHeader("Content-Type", "application/x-sqlite3");
    res.setHeader("Content-Disposition", 'attachment; filename="sermons_backup.db"');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: "Erreur d'exportation de la base de donn\xE9es : " + err.message });
  }
});
app.post("/api/db/import", (req, res, next) => {
  upload.single("db")(req, res, (err) => {
    if (err) return res.status(400).json({ error: "Erreur de t\xE9l\xE9versement : " + err.message });
    next();
  });
}, async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Aucun fichier de base de donn\xE9es (.db) fourni." });
  try {
    const buffer = import_fs5.default.readFileSync(req.file.path);
    await db.loadFromBuffer(buffer);
    if (import_fs5.default.existsSync(req.file.path)) import_fs5.default.unlinkSync(req.file.path);
    res.json({ success: true, message: "Base de donn\xE9es restaur\xE9e avec succ\xE8s !" });
  } catch (err) {
    if (req.file?.path && import_fs5.default.existsSync(req.file.path)) import_fs5.default.unlinkSync(req.file.path);
    res.status(400).json({ error: err.message || "Fichier invalide." });
  }
});
app.post("/api/sermons/reclean", (_req, res) => {
  db.all("SELECT sermon_id, numero_paragraphe, texte FROM paragraphes", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    let count = 0;
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");
      const stmt = db.prepare("UPDATE paragraphes SET texte = ? WHERE sermon_id = ? AND numero_paragraphe = ?");
      for (const r of rows) {
        const cleaned = formatExtractedParagraphText(r.texte);
        if (cleaned !== r.texte) {
          stmt.run(cleaned, r.sermon_id, r.numero_paragraphe);
          count++;
        }
      }
      stmt.finalize(() => {
        db.run("COMMIT", (errCommit) => {
          if (errCommit) return res.status(500).json({ error: errCommit.message });
          res.json({ success: true, count });
        });
      });
    });
  });
});
app.get("/api/recherche", (req, res) => {
  const query = req.query.q ? req.query.q.trim() : "";
  const sermonId = req.query.sermon_id ? decodeParam(req.query.sermon_id) : null;
  if (!query || query.length < 1) return res.json({ sermons: [], paragraphes: [] });
  const searchPattern = `%${query}%`;
  const sqlSermons = `
    SELECT * FROM sermons 
    WHERE id LIKE ? OR titre_francais LIKE ? OR date_sermon LIKE ? OR lieu LIKE ?
    ORDER BY id ASC LIMIT 20
  `;
  db.all(sqlSermons, [searchPattern, searchPattern, searchPattern, searchPattern], (errS, matchingSermons) => {
    if (errS) return res.status(500).json({ error: errS.message });
    const sqlPara = sermonId ? `SELECT p.sermon_id, p.numero_paragraphe, p.texte, s.titre_francais 
       FROM paragraphes p JOIN sermons s ON p.sermon_id = s.id
       WHERE p.sermon_id = ? AND p.texte LIKE ? ORDER BY p.numero_paragraphe ASC LIMIT 100` : `SELECT p.sermon_id, p.numero_paragraphe, p.texte, s.titre_francais 
       FROM paragraphes p JOIN sermons s ON p.sermon_id = s.id
       WHERE p.texte LIKE ? ORDER BY p.sermon_id ASC, p.numero_paragraphe ASC LIMIT 60`;
    const paramsPara = sermonId ? [sermonId, searchPattern] : [searchPattern];
    db.all(sqlPara, paramsPara, (errP, matchingParagraphes) => {
      if (errP) return res.status(500).json({ error: errP.message });
      res.json({ sermons: matchingSermons || [], paragraphes: matchingParagraphes || [] });
    });
  });
});
app.post("/api/import-pdf", (req, res, next) => {
  upload.single("pdf")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: "Erreur de t\xE9l\xE9versement : " + (err.message || "Fichier trop lourd ou invalide") });
    }
    next();
  });
}, async (req, res) => {
  let filePath = null;
  try {
    if (!req.file) return res.status(400).json({ error: "Aucun fichier PDF t\xE9l\xE9vers\xE9." });
    filePath = req.file.path;
    const { id, titre_francais, date_sermon, lieu, mode_decoupage } = req.body;
    if (!id || !titre_francais) {
      if (import_fs5.default.existsSync(filePath)) import_fs5.default.unlinkSync(filePath);
      return res.status(400).json({ error: "Le code brochure et le titre sont obligatoires." });
    }
    const dataBuffer = import_fs5.default.readFileSync(filePath);
    let rawText = "";
    try {
      rawText = await extractTextFromPDF(dataBuffer);
    } catch (pdfErr) {
      return res.status(400).json({ error: pdfErr.message });
    } finally {
      if (filePath && import_fs5.default.existsSync(filePath)) import_fs5.default.unlinkSync(filePath);
    }
    if (!rawText || !rawText.trim()) {
      return res.status(400).json({ error: "Aucun texte lisible extrait du PDF." });
    }
    const parsed = parsePDFTextToParagraphs(rawText, mode_decoupage || "AUTO");
    const { type_structure, items } = parsed;
    if (items.length === 0) {
      return res.status(400).json({ error: "Impossible de structurer le texte avec ce mode." });
    }
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");
      let insertError = null;
      db.run(
        `INSERT OR REPLACE INTO sermons (id, titre_francais, date_sermon, lieu, type_structure) VALUES (?, ?, ?, ?, ?)`,
        [id.trim(), titre_francais.trim(), date_sermon ? date_sermon.trim() : "", lieu ? lieu.trim() : "", type_structure],
        (err) => {
          if (err && !insertError) insertError = err;
        }
      );
      db.run("DELETE FROM paragraphes WHERE sermon_id = ?", [id.trim()], (err) => {
        if (err && !insertError) insertError = err;
      });
      for (const it of items) {
        db.run(
          "INSERT OR REPLACE INTO paragraphes (sermon_id, numero_paragraphe, texte) VALUES (?, ?, ?)",
          [id.trim(), it.num, it.text],
          (err) => {
            if (err && !insertError) insertError = err;
          }
        );
      }
      db.run("COMMIT", (errCommit) => {
        if (errCommit || insertError) {
          console.error("Import PDF DB Commit Error:", errCommit || insertError);
          db.run("ROLLBACK");
          return res.status(500).json({
            error: "Erreur lors de l'enregistrement en base de donn\xE9es : " + ((errCommit || insertError)?.message || "\xC9chec de la sauvegarde")
          });
        }
        db.syncSingleSermonToFile(id.trim());
        res.json({ success: true, count: items.length, id: id.trim(), type_structure });
      });
    });
  } catch (err) {
    if (filePath && import_fs5.default.existsSync(filePath)) import_fs5.default.unlinkSync(filePath);
    res.status(500).json({ error: "Erreur serveur import : " + err.message });
  }
});
app.get("/api/gdrive/files", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Non autoris\xE9. Jeton OAuth manquant." });
    }
    const token = authHeader.replace("Bearer ", "");
    const oauth2Client = new import_googleapis.google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: token });
    const drive = import_googleapis.google.drive({ version: "v3", auth: oauth2Client });
    const q = req.query.q ? `mimeType='application/pdf' and name contains '${req.query.q.replace(/'/g, "\\'")}' and trashed=false` : `mimeType='application/pdf' and trashed=false`;
    const response = await drive.files.list({
      q,
      pageSize: 30,
      fields: "files(id, name, mimeType, size, modifiedTime, iconLink, webViewLink)",
      orderBy: "modifiedTime desc"
    });
    res.json({ files: response.data.files || [] });
  } catch (err) {
    res.status(500).json({ error: "Erreur Google Drive: " + err.message });
  }
});
app.post("/api/gdrive/import", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const { fileId, fileName, customId, customTitle, date_sermon, lieu, mode_decoupage } = req.body;
    if (!fileId) {
      return res.status(400).json({ error: "Identifiant de fichier Google Drive manquant." });
    }
    if (!authHeader) {
      return res.status(401).json({ error: "Jeton OAuth manquant pour Google Drive." });
    }
    const token = authHeader.replace("Bearer ", "");
    const oauth2Client = new import_googleapis.google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: token });
    const drive = import_googleapis.google.drive({ version: "v3", auth: oauth2Client });
    const response = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "arraybuffer" }
    );
    const dataBuffer = Buffer.from(response.data);
    const rawText = await extractTextFromPDF(dataBuffer);
    if (!rawText || !rawText.trim()) {
      return res.status(400).json({ error: "Impossible d'extraire le texte du PDF Google Drive." });
    }
    const nameWithoutExt = (fileName || "Brochure_Drive").replace(/\.pdf$/i, "");
    const codeMatch = nameWithoutExt.match(/\b(\d{2,4}-\d{4}[A-Za-z]?)\b/);
    const finalId = (customId || (codeMatch ? codeMatch[1] : nameWithoutExt.replace(/[^a-zA-Z0-9-]/g, "-").substring(0, 20))).trim();
    let title = customTitle || nameWithoutExt;
    if (!customTitle && codeMatch) {
      title = title.replace(codeMatch[0], "");
    }
    const finalTitle = title.replace(/^[\s\-_]+|[\s\-_]+$/g, "").replace(/[\-_]+/g, " ").trim() || finalId;
    const parsed = parsePDFTextToParagraphs(rawText, mode_decoupage || "AUTO");
    const { type_structure, items } = parsed;
    if (items.length === 0) {
      return res.status(400).json({ error: "Aucun paragraphe extrait du document." });
    }
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");
      let insertError = null;
      db.run(
        `INSERT OR REPLACE INTO sermons (id, titre_francais, date_sermon, lieu, type_structure) VALUES (?, ?, ?, ?, ?)`,
        [finalId, finalTitle, date_sermon ? date_sermon.trim() : "", lieu ? lieu.trim() : "", type_structure],
        (err) => {
          if (err && !insertError) insertError = err;
        }
      );
      db.run("DELETE FROM paragraphes WHERE sermon_id = ?", [finalId], (err) => {
        if (err && !insertError) insertError = err;
      });
      for (const it of items) {
        db.run(
          "INSERT OR REPLACE INTO paragraphes (sermon_id, numero_paragraphe, texte) VALUES (?, ?, ?)",
          [finalId, it.num, it.text],
          (err) => {
            if (err && !insertError) insertError = err;
          }
        );
      }
      db.run("COMMIT", (errCommit) => {
        if (errCommit || insertError) {
          console.error("GDrive Import DB Commit Error:", errCommit || insertError);
          db.run("ROLLBACK");
          return res.status(500).json({
            error: "Erreur lors de l'enregistrement en base de donn\xE9es : " + ((errCommit || insertError)?.message || "\xC9chec de la sauvegarde")
          });
        }
        db.syncSingleSermonToFile(finalId);
        res.json({ success: true, count: items.length, id: finalId, title: finalTitle, type_structure });
      });
    });
  } catch (err) {
    res.status(500).json({ error: "Erreur d'importation Google Drive : " + err.message });
  }
});
app.get("/api/settings/data-dir", (req, res) => {
  try {
    const currentDataDir = getDataDir();
    let sermonFilesCount = 0;
    if (import_fs5.default.existsSync(currentDataDir)) {
      sermonFilesCount = import_fs5.default.readdirSync(currentDataDir).filter((f) => f.endsWith(".sermon") || f.endsWith(".json")).length;
    }
    res.json({
      dataDir: currentDataDir,
      sermonFilesCount,
      dbPath: import_path5.default.join(currentDataDir, "sermons.db")
    });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la lecture du dossier de donn\xE9es : " + err.message });
  }
});
app.get("/api/network-info", (_req, res) => {
  try {
    const interfaces = import_os2.default.networkInterfaces();
    const addresses = [];
    for (const name of Object.keys(interfaces)) {
      const ifaceList = interfaces[name];
      if (!ifaceList) continue;
      for (const iface of ifaceList) {
        if (iface.family === "IPv4" && !iface.internal) {
          addresses.push(iface.address);
        }
      }
    }
    const port = 3e3;
    res.json({
      addresses,
      port,
      hostname: import_os2.default.hostname(),
      urls: addresses.map((ip) => `http://${ip}:${port}`)
    });
  } catch (err) {
    res.status(500).json({ error: "Erreur r\xE9seau : " + err.message });
  }
});
app.post("/api/settings/data-dir", async (req, res) => {
  const { newPath, moveExisting = true } = req.body;
  if (!newPath || typeof newPath !== "string" || !newPath.trim()) {
    return res.status(400).json({ error: "Chemin de dossier invalide" });
  }
  const result = setDataDir(newPath.trim(), moveExisting);
  if (result.success) {
    try {
      await db.init();
      db.syncWithSermonFiles();
      res.json({ success: true, message: result.message, dataDir: result.dataDir });
    } catch (err) {
      res.status(500).json({ error: "Dossier modifi\xE9 mais erreur lors de la r\xE9initialisation de la DB : " + err.message });
    }
  } else {
    res.status(500).json({ error: result.message });
  }
});
async function startServer() {
  try {
    await db.init();
    console.log("\u2713 Base de donn\xE9es initialis\xE9e avec succ\xE8s");
  } catch (err) {
    console.error("\u26A0\uFE0F Erreur lors de l'initialisation de la base de donn\xE9es :", err);
  }
  const PORT = 3e3;
  if (process.env.NODE_ENV !== "production") {
    console.log("\u26A1 D\xE9marrage en mode d\xE9veloppement avec Vite middleware");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    console.log("\u{1F4E6} D\xE9marrage en mode production (fichiers statiques dist/)");
    let distPath = import_path5.default.join(__dirname);
    if (!import_fs5.default.existsSync(import_path5.default.join(distPath, "index.html"))) {
      distPath = import_path5.default.join(__dirname, "..", "dist");
    }
    if (!import_fs5.default.existsSync(import_path5.default.join(distPath, "index.html"))) {
      distPath = import_path5.default.join(process.cwd(), "dist");
    }
    console.log(`\u{1F4C2} Fichiers statiques servis depuis : ${distPath}`);
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api") || req.path.startsWith("/socket.io")) {
        return next();
      }
      res.sendFile(import_path5.default.join(distPath, "index.html"));
    });
  }
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`\u{1F680} Serveur R\xE9gie & Studio Pro actif sur http://0.0.0.0:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("\u274C \xC9chec lors du d\xE9marrage du serveur :", err);
});
//# sourceMappingURL=server.cjs.map
