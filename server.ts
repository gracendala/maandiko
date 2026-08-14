import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import fs from 'fs';
import os from 'os';
import multer from 'multer';
import { google } from 'googleapis';
import * as pdfParseModule from 'pdf-parse';
import PDFParser from 'pdf2json';
import JSZip from 'jszip';
import { db } from './db';
import { getDataDir, setDataDir } from './dataConfig';
import {
  saveSermonToFile,
  deleteSermonFile,
  readSermonFile,
  getSermonFilePath,
  getSermonFileName,
  ensureSermonsDataDir,
  sanitizeSermonFilename,
  SermonFileFormat
} from './sermonFileManager';
import {
  saveRecueilToFile,
  saveSongToFile,
  deleteSongFile,
  deleteRecueilFolder,
  sanitizeSlug
} from './lyricsFileManager';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const userAppDataDir = process.env.APPDATA 
  ? path.join(process.env.APPDATA, 'ProTextLive') 
  : path.join(process.env.HOME || (process.env.USERPROFILE || '.'), '.protextlive');

const uploadDir = path.join(userAppDataDir, 'uploads');
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch (err) {
    console.error('Erreur de création du dossier uploads:', err);
  }
}
const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 50 * 1024 * 1024 }
});

// CORS middleware for development origins (e.g. http://localhost:5173), mobile remotes, and local network
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));
app.options('*', cors());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.get('/favicon.ico', (_req, res) => res.status(204).end());

// Connexion SQLite via db.ts adapter

function decodeParam(param: string): string {
  if (!param) return '';
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

// Extraction du texte via pdf2json
function cleanPageHeadersAndFooters(pageText: string): string {
  if (!pageText) return '';
  const lines = pageText.split(/\r?\n/);

  const filteredLines = lines.filter((line) => {
    const trimmed = line.trim();
    if (!trimmed) return false;

    // Filter website URLs
    if (/^(https?:\/\/)?(www\.)?[a-z0-9\.\-]+\.(ch|ru|org|com|net|info|fr)(\/.*)?$/i.test(trimmed)) return false;

    // Filter explicit header/footer labels
    if (/^(LETTRE\s+CIRCULAIRE|CIRCULAR\s+LETTER|SHEKINAH|VOICE\s+OF\s+GOD)/i.test(trimmed)) return false;
    if (/^\d{1,2}\.\d{2}\.\d{4}\s+\d{1,3}$/.test(trimmed)) return false;
    if (/^Page\s+\d+(\s*(of|\/)\s*\d+)?$/i.test(trimmed)) return false;

    return true;
  });

  return filteredLines.join('\n');
}

async function extractTextFromPDF(dataBuffer: Buffer): Promise<string> {
  // 1. Essai prioritaire avec pdf-parse
  try {
    const pdfParseFunc = typeof pdfParseModule === 'function' ? pdfParseModule : ((pdfParseModule as any).default || pdfParseModule);
    if (typeof pdfParseFunc === 'function') {
      const parsed = await pdfParseFunc(dataBuffer, {
        pagerender: function(pageData: any) {
          return pageData.getTextContent({
            normalizeWhitespace: true,
            disableCombineTextItems: false
          }).then((textContent: any) => {
            let lastY = -1;
            let lastX = -1;
            let pageText = '';

            for (const item of textContent.items) {
              if (!item.str) continue;

              const x = item.transform[4];
              const y = item.transform[5];

              if (lastY !== -1 && Math.abs(y - lastY) > 5) {
                pageText += '\n';
              } else if (lastX !== -1) {
                const isEndSpace = pageText.endsWith(' ') || pageText.endsWith('\n');
                const isStartSpace = item.str.startsWith(' ');
                if (!isEndSpace && !isStartSpace) {
                  pageText += ' ';
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
    console.warn("⚠️ pdf-parse error, tentative avec pdf2json:", (pdfParseErr as Error)?.message || pdfParseErr);
  }

  // 2. Fallback pdf2json avec calcul de disposition complète
  try {
    const textFromPdf2Json = await new Promise<string>((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfParser = new (PDFParser as any)();

      const timeout = setTimeout(() => {
        reject(new Error("Le traitement du PDF a dépassé le délai imparti (30 secondes)."));
      }, 30000);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pdfParser.on('pdfParser_dataError', (errData: any) => {
        clearTimeout(timeout);
        reject(new Error(errData?.parserError || "Erreur lors de la lecture du fichier PDF."));
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
        clearTimeout(timeout);
        let fullText = '';
        if (pdfData && pdfData.Pages) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          pdfData.Pages.forEach((page: any) => {
            if (page.Texts && page.Texts.length > 0) {
              let pageText = '';
              let lastY = -1;

              // Sort texts vertically then horizontally
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const sortedTexts = [...page.Texts].sort((a: any, b: any) => {
                if (Math.abs(a.y - b.y) > 0.3) return a.y - b.y;
                return a.x - b.x;
              });

              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              sortedTexts.forEach((t: any) => {
                let str = '';
                if (t.R) {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  t.R.forEach((r: any) => {
                    if (r.T) {
                      let runText = '';
                      try {
                        runText = decodeURIComponent(r.T);
                      } catch {
                        runText = r.T;
                      }
                      if (runText) {
                        if (str && !str.endsWith(' ') && !runText.startsWith(' ')) {
                          str += ' ';
                        }
                        str += runText;
                      }
                    }
                  });
                }
                if (!str.trim()) return;

                if (lastY >= 0 && (t.y - lastY) > 0.4) {
                  if ((t.y - lastY) > 1.15) {
                    pageText += '\n\n';
                  } else {
                    pageText += '\n';
                  }
                } else if (lastY >= 0) {
                  if (!pageText.endsWith(' ') && !pageText.endsWith('\n')) {
                    pageText += ' ';
                  }
                }
                pageText += str.trim();
                lastY = t.y;
              });

              const cleanedPage = cleanPageHeadersAndFooters(pageText);
              if (cleanedPage.trim().length > 0) {
                fullText += cleanedPage.trim() + '\n--- PAGE_BREAK ---\n';
              }
            }
          });
        }
        if (!fullText.trim()) {
          fullText = pdfParser.getRawTextContent() || '';
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
  } catch (pdf2jsonErr: unknown) {
    console.warn("⚠️ pdf2json extraction error:", (pdf2jsonErr as Error)?.message || pdf2jsonErr);
  }

  throw new Error("Impossible d'extraire le texte du PDF. Assurez-vous que le document contient du texte lisible.");
}

// Nettoyage intelligent et mise en forme du texte extrait avec décollagede mots
function formatExtractedParagraphText(rawChunk: string): string {
  if (!rawChunk) return '';

  let text = rawChunk
    .replace(/--- PAGE_BREAK ---/g, '\n')
    .replace(/Page\s+\d+(\s*(of|\/)\s*\d+)?/gi, '')
    .replace(/^(LETTRE\s+CIRCULAIRE|CIRCULAR\s+LETTER|SHEKINAH|VOICE\s+OF\s+GOD).*/gim, '');

  // 1. Corriger les mots coupés par un tiret à la ligne ou un espace (ex: "particu- lièrement" -> "particulièrement")
  text = text.replace(/([a-zA-ZáàâäéèêëíìîïóòôöúùûüçÇÁÀÂÄÉÈÊËÍÌÎÏÓÒÔÖÚÙÛÜ]{2,})[\-\u2010\u2013]\s*\r?\n\s*([a-zA-ZáàâäéèêëíìîïóòôöúùûüçÇÁÀÂÄÉÈÊËÍÌÎÏÓÒÔÖÚÙÛÜ]{2,})/g, '$1$2');
  text = text.replace(/([a-zA-ZáàâäéèêëíìîïóòôöúùûüçÇÁÀÂÄÉÈÊËÍÌÎÏÓÒÔÖÚÙÛÜ]{2,})[\-\u2010\u2013]\s+([a-zA-ZáàâäéèêëíìîïóòôöúùûüçÇÁÀÂÄÉÈÊËÍÌÎÏÓÒÔÖÚÙÛÜ]{2,})/g, '$1$2');

  // 2. Corriger les apostrophes détachées (ex: "l ' Épouse", "d ' un", "c ' est", "qu ' il", "n ' est")
  text = text.replace(/(\b[ldcjnmstLDCJNMST])\s*['’`´]\s*([a-zA-ZáàâäéèêëíìîïóòôöúùûüçÇÁÀÂÄÉÈÊËÍÌÎÏÓÒÔÖÚÙÛÜ])/g, "$1'$2");

  // 3. Découpage des mots collés (ex: "Enregardantunpeupartout" -> "En regardant un peu partout")
  const gluedPatterns: [RegExp, string][] = [
    [/nousnousattendonsapasserdesmoments/gi, 'nous nous attendons à passer des moments '],
    [/nousattendonsaceque/gi, 'nous attendons à ce que '],
    [/nousrencontrepourbenirnosamesetnousdonnerleschoses/gi, 'nous rencontre pour bénir nos âmes et nous donner les choses '],
    [/nousrencontrepourbénirnosâmesetnousdonnerleschoses/gi, 'nous rencontre pour bénir nos âmes et nous donner les choses '],
    [/dontnousavonsbesoin/gi, 'dont nous avons besoin '],
    [/merveilleuxdansle/gi, 'merveilleux dans le '],
    [/Enregardant/gi, 'En regardant '],
    [/unpeupartout/gi, 'un peu partout '],
    [/etenvoyant/gi, 'et en voyant '],
    [/tantdemesamis/gi, 'tant de mes amis '],
    [/cematin/gi, 'ce matin'],
    [/jesuisvraimentravi/gi, 'je suis vraiment ravi'],
    [/Jesuiscontent/gi, 'Je suis content '],
    [/devoirFrereet/gi, 'de voir Frère et '],
    [/SœurDauchici/gi, 'Sœur Dauch ici'],
    [/del'Ohio/gi, "de l'Ohio"],
    [/Jevois/gi, 'Je vois '],
    [/SœurArmstrong/gi, 'Sœur Armstrong '],
    [/labas/gi, 'là-bas '],
    [/aufond/gi, 'au fond '],
    [/quiontfait/gi, 'qui ont fait '],
    [/letrajet/gi, 'le trajet '],
    [/depuisl'Ohio/gi, "depuis l'Ohio"],
    [/QueDieuvous/gi, 'Que Dieu vous '],
    [/benisseaussi/gi, 'bénisse aussi'],
    [/bénisseaussi/gi, 'bénisse aussi'],
    [/onenvoit/gi, 'on en voit '],
    [/tantqu'ilseraitdifficiledelesnommertous/gi, "tant qu'il serait difficile de les nommer tous"],
    [/SceurHoover/gi, 'Sœur Hoover'],
    [/noussommescontentsdevousvoiricicematin/gi, 'nous sommes contents de vous voir ici ce matin'],
    [/CharlieetNellie/gi, 'Charlie et Nellie'],
    [/FrereJefferiesetsafamille/gi, 'Frère Jefferies et sa famille'],
    [/ettantd'autres/gi, "et tant d'autres"],
    [/quisontdel'exterieurdelaville/gi, "qui sont de l'extérieur de la ville"],
    [/quisontde/gi, 'qui sont de '],
    [/l'exterieurde/gi, "l'extérieur de "],
    [/laville/gi, 'la ville']
  ];

  for (const [pat, rep] of gluedPatterns) {
    text = text.replace(pat, rep);
  }

  // 3b. Règles génériques de séparation de mots collés fréquents
  text = text
    .replace(/\b(nous|vous)(nous|vous)\b/gi, '$1 $2')
    .replace(/\b(nous|vous)(attendons|attendez|attend|rencontre|rencontrent|avons|avez|sommes|êtes|etes)\b/gi, '$1 $2')
    .replace(/\b(attendons|attendez|rencontre)(aceque|acequi|a|à)\b/gi, '$1 $2')
    .replace(/\b(aceque|àceque)\b/gi, 'à ce que')
    .replace(/\b(acequi|àcequi)\b/gi, 'à ce qui')
    .replace(/\b(ceque|cequi)\b/gi, 'ce que')
    .replace(/\b(merveilleux|grand|petit|bon|mauvais|saint|sainte)(dans|sur|pour|avec|de|du|des|en|le|la|les)\b/gi, '$1 $2')
    .replace(/\b(dans|sur|pour|avec|sous|vers|entre|sans|chez)(le|la|les|un|une|des|nos|vos|leurs|mon|ma|mes|ce|cet|cette|ces)\b/gi, '$1 $2')
    .replace(/\b(pour|par|avec|dans|sur|sans)(benir|bénir|donner|passer|voir|prendre|faire|dire|aller|savoir)\b/gi, '$1 $2')
    .replace(/\b(benir|bénir|donner|passer|voir|prendre|faire)(nos|vos|leurs|les|des|mes|tes|ses|un|une)\b/gi, '$1 $2')
    .replace(/\b(nos|vos|leurs|mes|tes|ses)(ames|âmes|choses|coeurs|cœurs|vies|pensees|pensées)\b/gi, '$1 $2')
    .replace(/\b(et|ou|mais|donc|car|ni)(nous|vous|il|elle|ils|elles|je|tu|on)\b/gi, '$1 $2')
    .replace(/\b(dont|qui|que|quand|comme|si)(nous|vous|il|elle|ils|elles|je|tu|on)\b/gi, '$1 $2')
    .replace(/\b(nous|vous|il|elle|ils|elles)(avons|avez|sommes|êtes|etes|sont|suis)\b/gi, '$1 $2')
    .replace(/\b(avons|avez|sommes|sont)(besoin|confiance|peur|joie|paix)\b/gi, '$1 $2');

  // 4. Ponctuation collée au mot suivant sans espace (ex: "ici,cematin" -> "ici, ce matin", "fond,quiont" -> "fond, qui ont")
  text = text.replace(/([.,!?:;])([a-zA-ZáàâäéèêëíìîïóòôöúùûüçÇÁÀÂÄÉÈÊËÍÌÎÏÓÒÔÖÚÙÛÜ])/g, '$1 $2');

  // 5. Separer les minuscules collées à une Majuscule (ex: "SœurDauch" -> "Sœur Dauch", "Frereet" -> "Frere et", "SœurArmstrong" -> "Sœur Armstrong")
  text = text.replace(/([a-zàâäéèêëíìîïôöùûüç])([A-ZÉÈÀÂÊÎÔÛ])/g, '$1 $2');

  // 6. Décoller les préfixes français courants collés à des mots
  const gluedPrefixes = [
    'Je', 'Tu', 'Il', 'Elle', 'Nous', 'Vous', 'Ils', 'Elles',
    'Que', 'Qui', 'Quoi', 'Dont', 'Quand', 'Comme', 'Si', 'Mais', 'Ou', 'Et', 'Donc', 'Or', 'Ni', 'Car',
    'Pour', 'Par', 'Avec', 'Dans', 'Sur', 'Sous', 'Vers', 'Entre', 'Chez', 'En', 'De', 'Du', 'Des',
    'Au', 'Aux', 'Un', 'Une', 'Le', 'La', 'Les', 'Ce', 'Cet', 'Cette', 'Ces',
    'Mon', 'Ma', 'Mes', 'Ton', 'Ta', 'Tes', 'Son', 'Sa', 'Ses', 'Notre', 'Nos', 'Votre', 'Vos', 'Leur', 'Leurs',
    'Frere', 'Frère', 'Soeur', 'Sœur', 'Sceur', 'Dieu', 'Seigneur', 'Jésus', 'Christ', 'Pasteur'
  ];

  for (const prefix of gluedPrefixes) {
    const regex = new RegExp(`\\b(${prefix})([a-zàâäéèêëíìîïôöùûüç]{2,})\\b`, 'g');
    text = text.replace(regex, (match, p1, p2) => {
      const lowerMatch = match.toLowerCase();
      const validSingleWords = ['cette', 'notre', 'votre', 'leurs', 'comme', 'entre', 'quand', 'parce', 'pourquoi', 'toujours', 'jamais', 'encore', 'depuis', 'pendant', 'devant', 'derriere', 'derrière', 'frere', 'frère', 'soeur', 'sœur', 'sceur', 'seigneur', 'pasteur', 'certains', 'plusieurs'];
      if (validSingleWords.includes(lowerMatch)) return match;
      return `${p1} ${p2}`;
    });
  }

  // 7. Corriger les espaces superflus avant la ponctuation
  text = text.replace(/\s+([,.;:!?])/g, '$1');

  // 8. Nettoyer les guillemets français
  text = text.replace(/«\s+/g, '« ').replace(/\s+»/g, ' »');

  // 8. Assemblage intelligent des lignes
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  const blocks: string[] = [];
  let currentBlock = '';

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
        currentBlock += ' ' + line;
      }
    }
  }

  if (currentBlock) {
    blocks.push(currentBlock);
  }

  return blocks
    .map(b => b.replace(/\s+/g, ' ').trim())
    .filter(b => b.length > 0)
    .join('\n\n');
}

// Nettoyage intelligent du texte
function cleanPdfRawText(rawText: string): string {
  if (!rawText) return '';
  let text = rawText;

  text = text.replace(/Page\s+\d+(\s*(of|\/)\s*\d+)?/gi, '');

  return text;
}

// Moteur de découpage paramétrable et résilient
function parsePDFTextToParagraphs(rawText: string, modeDecoupage = 'AUTO') {
  const cleanText = cleanPdfRawText(rawText);
  const items: { num: number; text: string }[] = [];

  // 1. Détection des paragraphes numérotés (Ex: Sermons WMB : 1, 2, 3...)
  if (modeDecoupage === 'NUMEROTE' || modeDecoupage === 'AUTO') {
    const candidateRegex = /(?:^|\r?\n)\s*(?:§\s*|p\.\s*|paragraphe\s*|\[)?(\d{1,4})(?:[\.\)\:\-\s\]]+|\r?\n)+(?=[^\s])/gi;
    const candidates: { num: number; matchIndex: number; matchLength: number }[] = [];
    let m: RegExpExecArray | null;

    while ((m = candidateRegex.exec(cleanText)) !== null) {
      const num = parseInt(m[1], 10);
      if (num > 0 && num < 2000 && !(num >= 1900 && num <= 2099)) {
        candidates.push({
          num,
          matchIndex: m.index,
          matchLength: m[0].length
        });
      }
    }

    // Trouver la plus longue séquence strictement croissante de paragraphes
    let bestSeq: typeof candidates = [];
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
          const hasExactNext = candidates.slice(i).some(c => c.num === currentNum + 1);
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
      return { type_structure: 'PARAGRAPHE', items };
    }
  }

  // 2. Mode Pagination / Secours pour les brochures sans paragraphes numérotés (Ex: Lettres Circulaires)
  const pages = cleanText.split(/--- PAGE_BREAK ---/);
  let pageNum = 1;

  for (const pageRaw of pages) {
    const formattedPageText = formatExtractedParagraphText(pageRaw);
    if (formattedPageText.length > 0) {
      items.push({ num: pageNum++, text: formattedPageText });
    }
  }

  if (items.length > 0) {
    return { type_structure: 'PAGE', items };
  }

  return { type_structure: 'PAGE', items: [] };
}

// Fonction de réparation automatique des brochures existantes mal découpées
function autoRepairSermons() {
  db.all("SELECT id, titre_francais, type_structure FROM sermons", [], (err, sermons: { id: string; titre_francais: string; type_structure: string }[]) => {
    if (err || !sermons) return;

    for (const sermon of sermons) {
      db.all("SELECT numero_paragraphe, texte FROM paragraphes WHERE sermon_id = ? ORDER BY numero_paragraphe ASC", [sermon.id], (err2, paras: { numero_paragraphe: number; texte: string }[]) => {
        if (err2 || !paras || paras.length === 0) return;

        const combinedText = paras.map(p => p.texte).join('\n\n');
        const parsed = parsePDFTextToParagraphs(combinedText, 'AUTO');

        if (parsed.type_structure === 'PARAGRAPHE' && parsed.items.length >= 2 && (sermon.type_structure === 'PAGE' || parsed.items.length > paras.length)) {
          console.log(`🔧 Reparsage automatique de la brochure "${sermon.id}" : ${parsed.items.length} paragraphes extraits (anciennement ${paras.length}).`);

          db.serialize(() => {
            db.run("BEGIN TRANSACTION");
            db.run("UPDATE sermons SET type_structure = 'PARAGRAPHE' WHERE id = ?", [sermon.id]);
            db.run("DELETE FROM paragraphes WHERE sermon_id = ?", [sermon.id]);

            for (const it of parsed.items) {
              db.run("INSERT INTO paragraphes (sermon_id, numero_paragraphe, texte) VALUES (?, ?, ?)", [sermon.id, it.num, it.text]);
            }

            db.run("COMMIT", (errCommit) => {
              if (errCommit) console.error("Erreur commit repair:", errCommit);
              else console.log(`✓ Brochure "${sermon.id}" réparée avec succès (${parsed.items.length} paragraphes).`);
            });
          });
        }
      });
    }
  });
}

// Socket.io Realtime State
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let dernierParagrapheProjete: any = null;

// Built-In Themes Library
let themesLibrary: any[] = [];

// Multi-Screen Output Configurations (Default audience & stage setup)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DEFAULT_ECRANS: Record<string, any> = {
  'audience': {
    id: 'audience',
    name: 'Écran Audience (HDMI / Projecteur)',
    outputType: 'hdmi',
    description: 'Sortie HDMI Principale Vidéoprojecteur & Projection',
    enabled: true,
    defaultThemeId: '',
    moduleThemes: {
      brochures: '',
      lyrics: '',
      bible: ''
    },
    style: {
      mode: 'CENTER_CARD',
      theme: 'custom',
      bgType: 'color',
      align: 'center',
      fontFamily: 'Inter',
      textColor: '#FFFFFF',
      containerBg: 'rgba(8, 11, 18, 0.95)',
      containerBorderColor: 'rgba(56, 189, 248, 0.25)',
      containerBorderWidth: 1,
      containerBorderRadius: 20,
      containerPadding: 36,
      showHeader: true,
      showBadge: true
    }
  },
  'stage': {
    id: 'stage',
    name: 'Écran Stage / Prompteur (HDMI)',
    outputType: 'stage',
    description: 'Retour Scène & Teleprompter Orateur',
    enabled: true,
    defaultThemeId: '',
    moduleThemes: {
      brochures: '',
      lyrics: '',
      bible: ''
    },
    style: {
      mode: 'TOP_BANNER',
      theme: 'dark',
      align: 'left',
      fontFamily: 'Inter',
      textColor: '#FFEB3B',
      containerBg: '#000000',
      containerBorderColor: '#FFEB3B',
      containerBorderWidth: 2,
      containerBorderRadius: 8,
      containerPadding: 24,
      showHeader: true,
      showBadge: true
    }
  }
};

let ecransProjectionConfig: Record<string, any> = { ...DEFAULT_ECRANS };

// Persistence functions for projection config
function getProjectionConfigFile() {
  return path.join(getDataDir(), 'projection_config.json');
}

function loadProjectionConfigFromDisk() {
  try {
    const file = getProjectionConfigFile();
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed.ecrans && typeof parsed.ecrans === 'object') {
        ecransProjectionConfig = parsed.ecrans;
      }
      if (Array.isArray(parsed.themes)) {
        themesLibrary = parsed.themes;
      }
      console.log('✓ Configuration des écrans et thèmes de projection chargée depuis le disque.');
    }
    // Clean up legacy screens if present in saved configuration
    delete ecransProjectionConfig['plein-ecran'];
    delete ecransProjectionConfig['lower-third'];
    delete ecransProjectionConfig['retour-scene'];

    // Ensure default core screens always exist
    if (!ecransProjectionConfig['audience']) {
      ecransProjectionConfig['audience'] = DEFAULT_ECRANS['audience'];
    }
    if (!ecransProjectionConfig['stage']) {
      ecransProjectionConfig['stage'] = DEFAULT_ECRANS['stage'];
    }

    saveProjectionConfigToDisk();
  } catch (err) {
    console.error('Erreur chargement projection_config.json:', err);
  }
}

function saveProjectionConfigToDisk() {
  try {
    const file = getProjectionConfigFile();
    fs.writeFileSync(file, JSON.stringify({
      ecrans: ecransProjectionConfig,
      themes: themesLibrary
    }, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erreur sauvegarde projection_config.json:', err);
  }
}

// Initial load on server start
loadProjectionConfigFromDisk();

io.on('connection', (socket) => {
  console.log('🔌 Client connecté (ID:', socket.id, ')');

  if (dernierParagrapheProjete) {
    socket.emit('afficher-paragraphe', dernierParagrapheProjete);
  }

  // Envoyer la liste de tous les écrans et thèmes configurés
  socket.emit('mise-a-jour-ecrans', {
    ecrans: Object.values(ecransProjectionConfig),
    themes: themesLibrary
  });
  
  // Style initial pour la projection active
  if (ecransProjectionConfig['audience']) {
    socket.emit('appliquer-style-projection', ecransProjectionConfig['audience'].style);
  }

  socket.on('projeter-paragraphe', (data) => {
    dernierParagrapheProjete = data;
    io.emit('afficher-paragraphe', data);
  });

  socket.on('update-screens-and-themes', ({ ecrans, themes }: { ecrans?: any[]; themes?: any[] }) => {
    if (Array.isArray(ecrans)) {
      const newMap: Record<string, any> = {};
      ecrans.forEach(scr => {
        if (scr.id && scr.id !== 'plein-ecran' && scr.id !== 'lower-third' && scr.id !== 'retour-scene') {
          newMap[scr.id] = scr;
        }
      });
      // Always ensure audience & stage exist
      if (!newMap['audience']) newMap['audience'] = DEFAULT_ECRANS['audience'];
      if (!newMap['stage']) newMap['stage'] = DEFAULT_ECRANS['stage'];
      ecransProjectionConfig = newMap;
    }
    if (Array.isArray(themes)) {
      themesLibrary = themes;
    }
    saveProjectionConfigToDisk();
    io.emit('mise-a-jour-ecrans', {
      ecrans: Object.values(ecransProjectionConfig),
      themes: themesLibrary
    });
  });

  socket.on('changer-style-ecran', ({ screenId, styleData }: { screenId: string; styleData: any }) => {
    if (!screenId) return;
    if (!ecransProjectionConfig[screenId]) {
      ecransProjectionConfig[screenId] = {
        id: screenId,
        name: `Écran ${screenId}`,
        enabled: true,
        defaultThemeId: 'dark-fullscreen',
        moduleThemes: { brochures: 'dark-fullscreen', lyrics: 'dark-fullscreen', bible: 'dark-fullscreen' },
        style: styleData
      };
    } else {
      ecransProjectionConfig[screenId].style = {
        ...ecransProjectionConfig[screenId].style,
        ...styleData
      };
    }

    if (screenId === 'audience') {
      io.emit('appliquer-style-projection', ecransProjectionConfig[screenId].style);
    }

    saveProjectionConfigToDisk();
    io.emit('mise-a-jour-ecrans', {
      ecrans: Object.values(ecransProjectionConfig),
      themes: themesLibrary
    });
  });

  socket.on('ajouter-ecran', ({ id, name, mode, outputType, description }: { id: string; name: string; mode?: string; outputType?: string; description?: string }) => {
    if (!id && !name) return;
    const rawName = name || 'Nouvel Écran';
    const cleanId = (id || rawName).toLowerCase().trim().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
    const finalId = cleanId || `ecran-${Date.now()}`;

    ecransProjectionConfig[finalId] = {
      id: finalId,
      name: rawName,
      outputType: outputType || 'custom',
      description: description || (outputType === 'hdmi' ? 'Sortie Second Écran HDMI' : 'Écran de Sortie Personnalisé'),
      enabled: true,
      defaultThemeId: '',
      moduleThemes: {
        brochures: '',
        lyrics: '',
        bible: ''
      },
      style: {
        mode: mode || 'CENTER_CARD',
        theme: 'custom',
        align: 'center',
        containerBg: 'rgba(13, 17, 23, 0.95)',
        containerBorderColor: 'rgba(56, 189, 248, 0.25)',
        containerBorderWidth: 1,
        containerBorderRadius: 16,
        containerPadding: 24,
        textColor: '#ffffff',
        showHeader: true,
        showBadge: true
      }
    };
    saveProjectionConfigToDisk();
    io.emit('mise-a-jour-ecrans', {
      ecrans: Object.values(ecransProjectionConfig),
      themes: themesLibrary
    });
  });

  socket.on('supprimer-ecran', ({ screenId }: { screenId: string }) => {
    // Audience and Stage are core screens and cannot be deleted
    if (screenId && screenId !== 'audience' && screenId !== 'stage' && ecransProjectionConfig[screenId]) {
      delete ecransProjectionConfig[screenId];
      saveProjectionConfigToDisk();
      io.emit('mise-a-jour-ecrans', {
        ecrans: Object.values(ecransProjectionConfig),
        themes: themesLibrary
      });
    }
  });

  socket.on('changer-style-projection', (styleData) => {
    const targetId = styleData?.screenId || 'audience';
    if (ecransProjectionConfig[targetId]) {
      ecransProjectionConfig[targetId].style = {
        ...ecransProjectionConfig[targetId].style,
        ...styleData
      };
    } else if (ecransProjectionConfig['audience']) {
      ecransProjectionConfig['audience'].style = {
        ...ecransProjectionConfig['audience'].style,
        ...styleData
      };
    }
    saveProjectionConfigToDisk();
    io.emit('appliquer-style-projection', styleData);
    io.emit('mise-a-jour-ecrans', {
      ecrans: Object.values(ecransProjectionConfig),
      themes: themesLibrary
    });
  });

  socket.on('disconnect', () => {
    console.log('❌ Client déconnecté (ID:', socket.id, ')');
  });
});

// REST API

// ==================== RECUEILS & CANTIQUES API ====================

// Get all recueils (with count of songs)
app.get('/api/recueils', (_req, res) => {
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

// Create new recueil
app.post('/api/recueils', (req, res) => {
  const { title, description } = req.body || {};
  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Le titre du recueil est obligatoire." });
  }

  const cleanTitle = title.trim();
  const id = sanitizeSlug(cleanTitle);
  const desc = description ? description.trim() : '';

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

// Update recueil
app.put('/api/recueils/:id', (req, res) => {
  const id = req.params.id;
  const { title, description } = req.body || {};
  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Le titre du recueil est obligatoire." });
  }

  db.run(
    "UPDATE recueils SET title = ?, description = ? WHERE id = ?",
    [title.trim(), description || '', id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      saveRecueilToFile({ id, title: title.trim(), description: description || '' });
      res.json({ success: true });
    }
  );
});

// Delete recueil
app.delete('/api/recueils/:id', (req, res) => {
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

// Get all songs (or songs in recueil)
app.get('/api/songs', (req, res) => {
  const recueilId = req.query.recueil_id as string;
  let sql = "SELECT * FROM songs ORDER BY CAST(number AS INTEGER) ASC, number ASC";
  let params: any[] = [];

  if (recueilId) {
    sql = "SELECT * FROM songs WHERE recueil_id = ? ORDER BY CAST(number AS INTEGER) ASC, number ASC";
    params = [recueilId];
  }

  db.all(sql, params, (err, rows: any[]) => {
    if (err) return res.status(500).json({ error: err.message });
    const formatted = (rows || []).map(r => {
      let sections = [];
      try {
        sections = JSON.parse(r.sections_json);
      } catch {
        // ignore
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

// Create/Update song
app.post('/api/songs', (req, res) => {
  const { id, recueil_id, number, title, category, author, keySignature, sections } = req.body || {};
  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Le titre du cantique est obligatoire." });
  }

  const songId = id || `song-${Date.now()}`;
  const recId = recueil_id || 'ce';
  const num = number ? `${number}`.trim() : '001';
  const cleanTitle = title.trim();
  const cat = category || '';
  const aut = author || '';
  const keySig = keySignature || '';
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

// Delete song
app.delete('/api/songs/:id', (req, res) => {
  const songId = req.params.id;
  db.get("SELECT recueil_id FROM songs WHERE id = ?", [songId], (err, row: any) => {
    const recId = row ? row.recueil_id : 'ce';
    db.run("DELETE FROM songs WHERE id = ?", [songId], function(err2) {
      if (err2) return res.status(500).json({ error: err2.message });
      deleteSongFile(recId, songId);
      res.json({ success: true, id: songId });
    });
  });
});

app.get('/api/sermons', (_req, res) => {
  db.all("SELECT * FROM sermons ORDER BY id ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.get('/api/sermons/:id', (req, res) => {
  const sermonId = decodeParam(req.params.id);
  db.get("SELECT * FROM sermons WHERE id = ?", [sermonId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Brochure introuvable." });
    res.json(row);
  });
});

app.put('/api/sermons/:id', (req, res) => {
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

// Endpoint de téléchargement du fichier dédié de brochure (.sermon)
app.get('/api/sermons/:id/export-file', (req, res) => {
  const sermonId = decodeParam(req.params.id);
  db.get("SELECT * FROM sermons WHERE id = ?", [sermonId], (err, sermon: { id: string; titre_francais: string; date_sermon: string; lieu: string; type_structure: string }) => {
    if (err || !sermon) return res.status(404).json({ error: "Brochure introuvable." });
    db.all("SELECT numero_paragraphe, texte FROM paragraphes WHERE sermon_id = ? ORDER BY numero_paragraphe ASC", [sermonId], (err2, paras: { numero_paragraphe: number; texte: string }[]) => {
      if (err2) return res.status(500).json({ error: err2.message });

      const sermonObj: SermonFileFormat = {
        version: '1.0',
        id: sermon.id,
        titre_francais: sermon.titre_francais,
        date_sermon: sermon.date_sermon || '',
        lieu: sermon.lieu || '',
        type_structure: sermon.type_structure || 'PARAGRAPHE',
        updated_at: new Date().toISOString(),
        paragraphes: paras || []
      };

      const filename = getSermonFileName(sermon.id, sermon.titre_francais);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(JSON.stringify(sermonObj, null, 2));
    });
  });
});

// Endpoint d'importation d'un fichier dédié de brochure (.sermon / .json)
app.post('/api/sermons/import-file', (req, res, next) => {
  upload.single('sermonFile')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, (req, res) => {
  try {
    let sermonData: SermonFileFormat | null = null;
    if (req.file) {
      const content = fs.readFileSync(req.file.path, 'utf-8');
      sermonData = JSON.parse(content);
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    } else if (req.body && req.body.id && req.body.titre_francais) {
      sermonData = req.body;
    }

    if (!sermonData || !sermonData.id || !sermonData.titre_francais) {
      return res.status(400).json({ error: "Fichier brochure (.sermon) invalide ou informations manquantes." });
    }

    const sermonId = sermonData.id.trim();
    const title = sermonData.titre_francais.trim();
    const dateSermon = sermonData.date_sermon || '';
    const lieu = sermonData.lieu || '';
    const typeStructure = sermonData.type_structure || 'PARAGRAPHE';
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
          version: '1.0',
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
  } catch (err: unknown) {
    res.status(400).json({ error: "Erreur d'importation de la brochure : " + ((err as Error)?.message || err) });
  }
});

// Endpoint d'exportation de toutes les brochures sous forme d'archive ZIP de fichiers .sermon
app.get('/api/sermons/export-zip', async (_req, res) => {
  try {
    const dataDir = ensureSermonsDataDir();
    let files = fs.readdirSync(dataDir).filter(f => f.endsWith('.sermon') || f.endsWith('.json'));

    if (files.length === 0) {
      db.exportAllToFiles();
      files = fs.readdirSync(dataDir).filter(f => f.endsWith('.sermon') || f.endsWith('.json'));
    }

    const zip = new JSZip();
    for (const file of files) {
      const filePath = path.join(dataDir, file);
      const content = fs.readFileSync(filePath);
      zip.file(file, content);
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="toutes_les_brochures_sermons.zip"');
    res.send(zipBuffer);
  } catch (err: unknown) {
    res.status(500).json({ error: "Erreur lors de la création de l'archive ZIP : " + ((err as Error)?.message || err) });
  }
});

app.post('/api/sermons/delete', (req, res) => {
  const { id } = req.body || {};
  const sermonId = typeof id === 'string' ? id.trim() : '';

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

app.delete('/api/sermons/:id', (req, res) => {
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

app.get('/api/sermons/:id/paragraphes', (req, res) => {
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

app.post('/api/sermons/:id/paragraphes', (req, res) => {
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

app.put('/api/sermons/:id/paragraphes/:num', (req, res) => {
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

app.delete('/api/sermons/:id/paragraphes/:num', (req, res) => {
  const sermonId = decodeParam(req.params.id);
  const num = parseInt(req.params.num, 10);

  db.run("DELETE FROM paragraphes WHERE sermon_id = ? AND numero_paragraphe = ?", [sermonId, num], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    db.syncSingleSermonToFile(sermonId);
    res.json({ success: true });
  });
});

app.post('/api/sermons/:id/paragraphes/:num/scinder', (req, res) => {
  const sermonId = decodeParam(req.params.id);
  const num = parseInt(req.params.num, 10);
  const { position } = req.body;

  db.get("SELECT texte FROM paragraphes WHERE sermon_id = ? AND numero_paragraphe = ?", [sermonId, num], (err, row: { texte: string }) => {
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

app.post('/api/sermons/:id/paragraphes/:num/fusionner', (req, res) => {
  const sermonId = decodeParam(req.params.id);
  const num = parseInt(req.params.num, 10);

  db.all("SELECT numero_paragraphe, texte FROM paragraphes WHERE sermon_id = ? AND numero_paragraphe IN (?, ?) ORDER BY numero_paragraphe ASC", [sermonId, num, num + 1], (err, rows: { numero_paragraphe: number; texte: string }[]) => {
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

app.post('/api/sermons/:id/paragraphes/:num/permuter', (req, res) => {
  const sermonId = decodeParam(req.params.id);
  const num = parseInt(req.params.num, 10);
  const { direction } = req.body;
  const targetNum = direction === 'up' ? num - 1 : num + 1;

  db.all("SELECT numero_paragraphe, texte FROM paragraphes WHERE sermon_id = ? AND numero_paragraphe IN (?, ?)", [sermonId, num, targetNum], (err, rows: { numero_paragraphe: number; texte: string }[]) => {
    if (err || rows.length < 2) return res.status(400).json({ error: "Permutation impossible." });

    const p1 = rows.find(r => r.numero_paragraphe === num);
    const p2 = rows.find(r => r.numero_paragraphe === targetNum);

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

app.post('/api/sermons/:id/renumeroter', (req, res) => {
  const sermonId = decodeParam(req.params.id);
  db.all("SELECT rowid, numero_paragraphe FROM paragraphes WHERE sermon_id = ? ORDER BY numero_paragraphe ASC", [sermonId], (err, rows: { rowid: number; numero_paragraphe: number }[]) => {
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

app.post('/api/sermons/:id/remplacer', (req, res) => {
  const sermonId = decodeParam(req.params.id);
  const { recherche, remplacement } = req.body;

  if (!recherche) return res.status(400).json({ error: "Terme de recherche vide" });

  db.all("SELECT numero_paragraphe, texte FROM paragraphes WHERE sermon_id = ? AND texte LIKE ?", [sermonId, `%${recherche}%`], (err, rows: { numero_paragraphe: number; texte: string }[]) => {
    if (err) return res.status(500).json({ error: err.message });

    let count = 0;
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");
      const stmt = db.prepare("UPDATE paragraphes SET texte = ? WHERE sermon_id = ? AND numero_paragraphe = ?");
      rows.forEach(r => {
        const newText = r.texte.replaceAll(recherche, remplacement || '');
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

// Endpoint de téléchargement de la sauvegarde SQLite (.db)
app.get('/api/db/export', (_req, res) => {
  try {
    const buffer = db.getDatabaseBuffer();
    res.setHeader('Content-Type', 'application/x-sqlite3');
    res.setHeader('Content-Disposition', 'attachment; filename="sermons_backup.db"');
    res.send(buffer);
  } catch (err: unknown) {
    res.status(500).json({ error: "Erreur d'exportation de la base de données : " + (err as Error).message });
  }
});

// Endpoint d'importation / restauration de la sauvegarde SQLite (.db)
app.post('/api/db/import', (req, res, next) => {
  upload.single('db')(req, res, (err) => {
    if (err) return res.status(400).json({ error: "Erreur de téléversement : " + err.message });
    next();
  });
}, async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Aucun fichier de base de données (.db) fourni." });
  try {
    const buffer = fs.readFileSync(req.file.path);
    await db.loadFromBuffer(buffer);
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.json({ success: true, message: "Base de données restaurée avec succès !" });
  } catch (err: unknown) {
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(400).json({ error: (err as Error).message || "Fichier invalide." });
  }
});

// Endpoint de re-nettoyage et mise en forme globale des textes de brochures
app.post('/api/sermons/reclean', (_req, res) => {
  db.all("SELECT sermon_id, numero_paragraphe, texte FROM paragraphes", [], (err, rows: { sermon_id: string; numero_paragraphe: number; texte: string }[]) => {
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

app.get('/api/recherche', (req, res) => {
  const query = req.query.q ? (req.query.q as string).trim() : '';
  const sermonId = req.query.sermon_id ? decodeParam(req.query.sermon_id as string) : null;

  if (!query || query.length < 1) return res.json({ sermons: [], paragraphes: [] });

  const searchPattern = `%${query}%`;
  const sqlSermons = `
    SELECT * FROM sermons 
    WHERE id LIKE ? OR titre_francais LIKE ? OR date_sermon LIKE ? OR lieu LIKE ?
    ORDER BY id ASC LIMIT 20
  `;

  db.all(sqlSermons, [searchPattern, searchPattern, searchPattern, searchPattern], (errS, matchingSermons) => {
    if (errS) return res.status(500).json({ error: errS.message });

    const sqlPara = sermonId ?
      `SELECT p.sermon_id, p.numero_paragraphe, p.texte, s.titre_francais 
       FROM paragraphes p JOIN sermons s ON p.sermon_id = s.id
       WHERE p.sermon_id = ? AND p.texte LIKE ? ORDER BY p.numero_paragraphe ASC LIMIT 100` :
      `SELECT p.sermon_id, p.numero_paragraphe, p.texte, s.titre_francais 
       FROM paragraphes p JOIN sermons s ON p.sermon_id = s.id
       WHERE p.texte LIKE ? ORDER BY p.sermon_id ASC, p.numero_paragraphe ASC LIMIT 60`;

    const paramsPara = sermonId ? [sermonId, searchPattern] : [searchPattern];

    db.all(sqlPara, paramsPara, (errP, matchingParagraphes) => {
      if (errP) return res.status(500).json({ error: errP.message });
      res.json({ sermons: matchingSermons || [], paragraphes: matchingParagraphes || [] });
    });
  });
});

// Importation PDF local
app.post('/api/import-pdf', (req, res, next) => {
  upload.single('pdf')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: "Erreur de téléversement : " + (err.message || "Fichier trop lourd ou invalide") });
    }
    next();
  });
}, async (req, res) => {
  let filePath: string | null = null;
  try {
    if (!req.file) return res.status(400).json({ error: "Aucun fichier PDF téléversé." });
    filePath = req.file.path;
    const { id, titre_francais, date_sermon, lieu, mode_decoupage } = req.body;

    if (!id || !titre_francais) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res.status(400).json({ error: "Le code brochure et le titre sont obligatoires." });
    }

    const dataBuffer = fs.readFileSync(filePath);
    let rawText = '';
    
    try {
      rawText = await extractTextFromPDF(dataBuffer);
    } catch (pdfErr: unknown) {
      return res.status(400).json({ error: (pdfErr as Error).message });
    } finally {
      if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    if (!rawText || !rawText.trim()) {
      return res.status(400).json({ error: "Aucun texte lisible extrait du PDF." });
    }

    const parsed = parsePDFTextToParagraphs(rawText, mode_decoupage || 'AUTO');
    const { type_structure, items } = parsed;

    if (items.length === 0) {
      return res.status(400).json({ error: "Impossible de structurer le texte avec ce mode." });
    }

    db.serialize(() => {
      db.run("BEGIN TRANSACTION");

      let insertError: Error | null = null;

      db.run(
        `INSERT OR REPLACE INTO sermons (id, titre_francais, date_sermon, lieu, type_structure) VALUES (?, ?, ?, ?, ?)`,
        [id.trim(), titre_francais.trim(), date_sermon ? date_sermon.trim() : '', lieu ? lieu.trim() : '', type_structure],
        (err: Error | null) => { if (err && !insertError) insertError = err; }
      );

      db.run("DELETE FROM paragraphes WHERE sermon_id = ?", [id.trim()], (err: Error | null) => {
        if (err && !insertError) insertError = err;
      });

      for (const it of items) {
        db.run(
          "INSERT OR REPLACE INTO paragraphes (sermon_id, numero_paragraphe, texte) VALUES (?, ?, ?)",
          [id.trim(), it.num, it.text],
          (err: Error | null) => {
            if (err && !insertError) insertError = err;
          }
        );
      }

      db.run("COMMIT", (errCommit) => {
        if (errCommit || insertError) {
          console.error("Import PDF DB Commit Error:", errCommit || insertError);
          db.run("ROLLBACK");
          return res.status(500).json({
            error: "Erreur lors de l'enregistrement en base de données : " + ((errCommit || insertError)?.message || "Échec de la sauvegarde")
          });
        }
        db.syncSingleSermonToFile(id.trim());
        res.json({ success: true, count: items.length, id: id.trim(), type_structure });
      });
    });

  } catch (err: unknown) {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.status(500).json({ error: "Erreur serveur import : " + (err as Error).message });
  }
});

// Google Drive API endpoints
app.get('/api/gdrive/files', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Non autorisé. Jeton OAuth manquant." });
    }
    const token = authHeader.replace('Bearer ', '');
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: token });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const q = req.query.q
      ? `mimeType='application/pdf' and name contains '${(req.query.q as string).replace(/'/g, "\\'")}' and trashed=false`
      : `mimeType='application/pdf' and trashed=false`;

    const response = await drive.files.list({
      q,
      pageSize: 30,
      fields: 'files(id, name, mimeType, size, modifiedTime, iconLink, webViewLink)',
      orderBy: 'modifiedTime desc'
    });

    res.json({ files: response.data.files || [] });
  } catch (err: unknown) {
    res.status(500).json({ error: "Erreur Google Drive: " + (err as Error).message });
  }
});

app.post('/api/gdrive/import', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const { fileId, fileName, customId, customTitle, date_sermon, lieu, mode_decoupage } = req.body;

    if (!fileId) {
      return res.status(400).json({ error: "Identifiant de fichier Google Drive manquant." });
    }

    if (!authHeader) {
      return res.status(401).json({ error: "Jeton OAuth manquant pour Google Drive." });
    }

    const token = authHeader.replace('Bearer ', '');
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: token });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Download PDF content
    const response = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'arraybuffer' }
    );

    const dataBuffer = Buffer.from(response.data as ArrayBuffer);
    const rawText = await extractTextFromPDF(dataBuffer);

    if (!rawText || !rawText.trim()) {
      return res.status(400).json({ error: "Impossible d'extraire le texte du PDF Google Drive." });
    }

    // Determine brochure code & title
    const nameWithoutExt = (fileName || 'Brochure_Drive').replace(/\.pdf$/i, '');
    const codeMatch = nameWithoutExt.match(/\b(\d{2,4}-\d{4}[A-Za-z]?)\b/);
    const finalId = (customId || (codeMatch ? codeMatch[1] : nameWithoutExt.replace(/[^a-zA-Z0-9-]/g, '-').substring(0, 20))).trim();
    
    let title = customTitle || nameWithoutExt;
    if (!customTitle && codeMatch) {
      title = title.replace(codeMatch[0], '');
    }
    const finalTitle = title.replace(/^[\s\-_]+|[\s\-_]+$/g, '').replace(/[\-_]+/g, ' ').trim() || finalId;

    const parsed = parsePDFTextToParagraphs(rawText, mode_decoupage || 'AUTO');
    const { type_structure, items } = parsed;

    if (items.length === 0) {
      return res.status(400).json({ error: "Aucun paragraphe extrait du document." });
    }

    db.serialize(() => {
      db.run("BEGIN TRANSACTION");

      let insertError: Error | null = null;

      db.run(
        `INSERT OR REPLACE INTO sermons (id, titre_francais, date_sermon, lieu, type_structure) VALUES (?, ?, ?, ?, ?)`,
        [finalId, finalTitle, date_sermon ? date_sermon.trim() : '', lieu ? lieu.trim() : '', type_structure],
        (err: Error | null) => { if (err && !insertError) insertError = err; }
      );

      db.run("DELETE FROM paragraphes WHERE sermon_id = ?", [finalId], (err: Error | null) => {
        if (err && !insertError) insertError = err;
      });

      for (const it of items) {
        db.run(
          "INSERT OR REPLACE INTO paragraphes (sermon_id, numero_paragraphe, texte) VALUES (?, ?, ?)",
          [finalId, it.num, it.text],
          (err: Error | null) => {
            if (err && !insertError) insertError = err;
          }
        );
      }

      db.run("COMMIT", (errCommit) => {
        if (errCommit || insertError) {
          console.error("GDrive Import DB Commit Error:", errCommit || insertError);
          db.run("ROLLBACK");
          return res.status(500).json({
            error: "Erreur lors de l'enregistrement en base de données : " + ((errCommit || insertError)?.message || "Échec de la sauvegarde")
          });
        }
        db.syncSingleSermonToFile(finalId);
        res.json({ success: true, count: items.length, id: finalId, title: finalTitle, type_structure });
      });
    });

  } catch (err: unknown) {
    res.status(500).json({ error: "Erreur d'importation Google Drive : " + (err as Error).message });
  }
});

// Endpoint pour récupérer la configuration du dossier de données
app.get('/api/settings/data-dir', (req, res) => {
  try {
    const currentDataDir = getDataDir();
    let sermonFilesCount = 0;
    if (fs.existsSync(currentDataDir)) {
      sermonFilesCount = fs.readdirSync(currentDataDir).filter(f => f.endsWith('.sermon') || f.endsWith('.json')).length;
    }
    res.json({
      dataDir: currentDataDir,
      sermonFilesCount,
      dbPath: path.join(currentDataDir, 'sermons.db')
    });
  } catch (err: any) {
    res.status(500).json({ error: "Erreur lors de la lecture du dossier de données : " + err.message });
  }
});

// Endpoint pour obtenir les adresses IP du réseau local pour OBS / autres PC
app.get('/api/network-info', (_req, res) => {
  try {
    const interfaces = os.networkInterfaces();
    const addresses: string[] = [];
    
    for (const name of Object.keys(interfaces)) {
      const ifaceList = interfaces[name];
      if (!ifaceList) continue;
      for (const iface of ifaceList) {
        if (iface.family === 'IPv4' && !iface.internal) {
          addresses.push(iface.address);
        }
      }
    }

    const port = 3000;
    res.json({
      addresses,
      port,
      hostname: os.hostname(),
      urls: addresses.map(ip => `http://${ip}:${port}`)
    });
  } catch (err: any) {
    res.status(500).json({ error: "Erreur réseau : " + err.message });
  }
});

// Endpoint pour modifier le dossier de données (à la ProPresenter)
app.post('/api/settings/data-dir', async (req, res) => {
  const { newPath, moveExisting = true } = req.body;
  if (!newPath || typeof newPath !== 'string' || !newPath.trim()) {
    return res.status(400).json({ error: "Chemin de dossier invalide" });
  }

  const result = setDataDir(newPath.trim(), moveExisting);
  if (result.success) {
    try {
      // Réinitialiser la base de données avec le nouveau dossier
      await db.init();
      db.syncWithSermonFiles();
      res.json({ success: true, message: result.message, dataDir: result.dataDir });
    } catch (err: any) {
      res.status(500).json({ error: "Dossier modifié mais erreur lors de la réinitialisation de la DB : " + err.message });
    }
  } else {
    res.status(500).json({ error: result.message });
  }
});

async function startServer() {
  try {
    await db.init();
    console.log("✓ Base de données initialisée avec succès");
  } catch (err) {
    console.error("⚠️ Erreur lors de l'initialisation de la base de données :", err);
  }

  const PORT = 3000;

  if (process.env.NODE_ENV !== "production") {
    console.log("⚡ Démarrage en mode développement avec Vite middleware");
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("📦 Démarrage en mode production (fichiers statiques dist/)");
    let distPath = path.join(__dirname);
    if (!fs.existsSync(path.join(distPath, 'index.html'))) {
      distPath = path.join(__dirname, '..', 'dist');
    }
    if (!fs.existsSync(path.join(distPath, 'index.html'))) {
      distPath = path.join(process.cwd(), 'dist');
    }
    console.log(`📂 Fichiers statiques servis depuis : ${distPath}`);

    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
        return next();
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Serveur Régie & Studio Pro actif sur http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("❌ Échec lors du démarrage du serveur :", err);
});
