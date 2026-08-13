import React, { useState, useEffect } from 'react';
import {
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Upload,
  Laptop,
  Sparkles,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Baseline
} from 'lucide-react';
import { detectPCInstalledFonts, loadCustomFontFile, loadGoogleFontIfNeeded } from '../utils/fontLoader';

export interface TypographyStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'left' | 'center' | 'right';
  letterSpacing?: number;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  textDecoration?: 'none' | 'underline' | 'line-through';
  textStrokeColor?: string;
  textStrokeWidth?: number;
  textColor?: string;
  textShadow?: boolean;
  textShadowColor?: string;
  textShadowBlur?: number;
  lineHeight?: number;
  textFitMode?: 'auto-scale-text' | 'auto-expand-box' | 'fixed';
}

interface TypographyControlsProps {
  style: TypographyStyle;
  onChange: (updated: Partial<TypographyStyle>) => void;
  showAlignmentControls?: boolean;
}

const COMMON_PRESET_FONTS = [
  // Installed PC / System Standard Fonts
  { name: 'Arial', category: 'Système PC / Standard' },
  { name: 'Segoe UI', category: 'Système PC / Windows' },
  { name: 'Calibri', category: 'Système PC / Windows' },
  { name: 'Trebuchet MS', category: 'Système PC / Windows' },
  { name: 'Impact', category: 'Système PC / Titres Forts' },
  { name: 'Georgia', category: 'Système PC / Sérif Elegante' },
  { name: 'Times New Roman', category: 'Système PC / Sérif Classique' },
  { name: 'Comic Sans MS', category: 'Système PC / Ludique' },
  { name: 'Courier New', category: 'Système PC / Monospace' },
  { name: 'Verdana', category: 'Système PC / Lisible' },
  { name: 'Tahoma', category: 'Système PC / Lisible' },
  // Popular Google Fonts
  { name: 'Roboto', category: 'Google / Moderne Sans' },
  { name: 'Montserrat', category: 'Google / Géométrique Titres' },
  { name: 'Poppins', category: 'Google / Rond Clean' },
  { name: 'Outfit', category: 'Google / Premium Design' },
  { name: 'Bebas Neue', category: 'Google / Titres Condensés' },
  { name: 'Oswald', category: 'Google / Condensé Fort' },
  { name: 'Playfair Display', category: 'Google / Sérif Élégant' },
  { name: 'Cinzel', category: 'Google / Majestueux Spirituel' },
  { name: 'Dancing Script', category: 'Google / Calligraphie' },
  { name: 'Caveat', category: 'Google / Écriture Manuelle' }
];

export const TypographyControls: React.FC<TypographyControlsProps> = ({
  style,
  onChange,
  showAlignmentControls = true
}) => {
  const [pcFonts, setPcFonts] = useState<string[]>([]);
  const [isQueryingPcFonts, setIsQueryingPcFonts] = useState(false);
  const [customFontInput, setCustomFontInput] = useState(style.fontFamily || '');
  const [pcFontStatusMessage, setPcFontStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    setCustomFontInput(style.fontFamily || '');
  }, [style.fontFamily]);

  // Load font whenever current selection changes
  useEffect(() => {
    if (style.fontFamily) {
      loadGoogleFontIfNeeded(style.fontFamily);
    }
  }, [style.fontFamily]);

  const handleDetectPcFonts = async () => {
    setIsQueryingPcFonts(true);
    setPcFontStatusMessage(null);
    try {
      const fonts = await detectPCInstalledFonts();
      if (fonts.length > 0) {
        setPcFonts(fonts);
        setPcFontStatusMessage(`${fonts.length} polices PC détectées !`);
      } else {
        setPcFontStatusMessage('L\'accès aux polices PC nécessite l\'autorisation du navigateur ou Chrome/Edge v103+.');
      }
    } catch {
      setPcFontStatusMessage('Saisissez directement le nom de la police installée dans le champ ci-dessous.');
    } finally {
      setIsQueryingPcFonts(false);
    }
  };

  const handleFontFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const loadedFontFamily = await loadCustomFontFile(file);
      onChange({ fontFamily: loadedFontFamily });
      setPcFontStatusMessage(`Police "${file.name}" installée avec succès !`);
    } catch (err: any) {
      alert(`Erreur de chargement du fichier de police : ${err.message || err}`);
    }
  };

  const currentFont = style.fontFamily || 'Inherit / Defaut';

  return (
    <div className="space-y-4 bg-[#242424] p-3.5 rounded-xl border border-[#383838] shadow-sm">
      <div className="flex items-center justify-between pb-2 border-b border-[#333333]">
        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
          <Type className="w-4 h-4 text-blue-400" />
          <span>Polices & Typographie</span>
        </h4>
        <span className="text-[10px] text-slate-400 font-mono bg-[#181818] px-2 py-0.5 rounded border border-[#383838]">
          {currentFont}
        </span>
      </div>

      {/* Font Family Selection Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-slate-300">Famille de Police (Font Family) :</label>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleDetectPcFonts}
              disabled={isQueryingPcFonts}
              className="text-[10px] font-bold text-slate-200 hover:text-white bg-[#1a1a1a] hover:bg-[#333333] px-2 py-1 rounded border border-[#3a3a3a] flex items-center gap-1 transition cursor-pointer"
              title="Détecter les polices système installées sur cet ordinateur"
            >
              <Laptop className="w-3 h-3 text-blue-400" />
              <span>{isQueryingPcFonts ? 'Analyse...' : 'Détecter Polices PC'}</span>
            </button>

            <label className="text-[10px] font-bold text-slate-200 hover:text-white bg-[#1a1a1a] hover:bg-[#333333] px-2 py-1 rounded border border-[#3a3a3a] flex items-center gap-1 transition cursor-pointer">
              <Upload className="w-3 h-3 text-indigo-400" />
              <span>Importer .TTF/.OTF</span>
              <input
                type="file"
                accept=".ttf,.otf,.woff,.woff2"
                onChange={handleFontFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {pcFontStatusMessage && (
          <p className="text-[10px] text-amber-300/90 bg-amber-950/40 border border-amber-500/30 px-2 py-1 rounded">
            {pcFontStatusMessage}
          </p>
        )}

        {/* Dropdown for fonts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <select
            value={style.fontFamily || ''}
            onChange={(e) => {
              const font = e.target.value;
              onChange({ fontFamily: font || undefined });
              setCustomFontInput(font);
            }}
            className="w-full bg-[#181818] text-white border border-[#383838] px-2.5 py-1.5 rounded-lg text-xs outline-none focus:border-blue-500 font-medium cursor-pointer"
          >
            <option value="">-- Police de Base (Par défaut) --</option>

            {pcFonts.length > 0 && (
              <optgroup label="💻 Polices PC Installées sur cet Ordinateur">
                {pcFonts.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </optgroup>
            )}

            <optgroup label="✨ Polices Web & Système Populaires">
              {COMMON_PRESET_FONTS.map((f) => (
                <option key={f.name} value={f.name}>
                  {f.name} ({f.category})
                </option>
              ))}
            </optgroup>
          </select>

          {/* Direct Manual Entry Input for Installed PC Fonts */}
          <div className="relative">
            <input
              type="text"
              value={customFontInput}
              onChange={(e) => setCustomFontInput(e.target.value)}
              onBlur={() => {
                if (customFontInput.trim() !== (style.fontFamily || '')) {
                  onChange({ fontFamily: customFontInput.trim() || undefined });
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onChange({ fontFamily: customFontInput.trim() || undefined });
                }
              }}
              placeholder="Nom exact police PC (ex: Mistral, Impact...)"
              className="w-full bg-[#181818] text-slate-200 border border-[#383838] px-2.5 py-1.5 rounded-lg text-xs outline-none focus:border-blue-500 font-medium"
            />
            <span className="absolute right-2 top-1.5 text-[9px] text-slate-500 font-mono pointer-events-none">
              Saisie libre
            </span>
          </div>
        </div>
      </div>

      {/* Font Weight & Italic / Style */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#333333]">
        <div>
          <span className="text-[10px] text-slate-400 block font-semibold mb-1">Poids de la police (Graisse) :</span>
          <select
            value={style.fontWeight || '700'}
            onChange={(e) => onChange({ fontWeight: e.target.value })}
            className="w-full bg-[#181818] text-white border border-[#383838] px-2 py-1 rounded-lg text-xs outline-none focus:border-blue-500 font-bold cursor-pointer"
          >
            <option value="100">100 — Extra Fin (Hairline)</option>
            <option value="300">300 — Léger (Light)</option>
            <option value="400">400 — Normal (Regular)</option>
            <option value="600">600 — Semi-Gras (Semi-Bold)</option>
            <option value="700">700 — Gras (Bold)</option>
            <option value="800">800 — Extra Gras (Extra Bold)</option>
            <option value="900">900 — Ultra Gras (Impact)</option>
          </select>
        </div>

        <div>
          <span className="text-[10px] text-slate-400 block font-semibold mb-1">Style de Texte :</span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => onChange({ fontWeight: style.fontWeight === '700' ? '400' : '700' })}
              className={`flex-1 py-1 rounded border text-xs font-bold cursor-pointer transition flex items-center justify-center gap-1 ${
                style.fontWeight === '700' || style.fontWeight === '800' || style.fontWeight === '900'
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-[#181818] text-slate-400 border-[#383838] hover:text-white hover:bg-[#2a2a2a]'
              }`}
            >
              <Bold className="w-3.5 h-3.5" />
              <span>Gras</span>
            </button>

            <button
              type="button"
              onClick={() => onChange({ fontStyle: style.fontStyle === 'italic' ? 'normal' : 'italic' })}
              className={`flex-1 py-1 rounded border text-xs font-bold cursor-pointer transition flex items-center justify-center gap-1 ${
                style.fontStyle === 'italic'
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-[#181818] text-slate-400 border-[#383838] hover:text-white hover:bg-[#2a2a2a]'
              }`}
            >
              <Italic className="w-3.5 h-3.5" />
              <span>Italique</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alignment (if enabled) */}
      {showAlignmentControls && (
        <div className="space-y-1 pt-1">
          <span className="text-[10px] text-slate-400 block font-semibold">Alignement Horizontal :</span>
          <div className="flex gap-1.5">
            {[
              { id: 'left', label: 'Gauche', icon: AlignLeft },
              { id: 'center', label: 'Centre', icon: AlignCenter },
              { id: 'right', label: 'Droite', icon: AlignRight }
            ].map((a) => {
              const Icon = a.icon;
              const isSelected = (style.textAlign || 'center') === a.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => onChange({ textAlign: a.id as any })}
                  className={`flex-1 py-1 px-2 rounded-lg border text-xs font-bold cursor-pointer transition flex items-center justify-center gap-1.5 ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-[#181818] text-slate-400 border-[#383838] hover:text-white hover:bg-[#2a2a2a]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{a.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Letter Spacing & Line Height */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#333333]">
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] text-slate-400 font-semibold">Espacement Lettres ({style.letterSpacing || 0}px) :</span>
            {style.letterSpacing !== undefined && style.letterSpacing !== 0 && (
              <button
                type="button"
                onClick={() => onChange({ letterSpacing: 0 })}
                className="text-[9px] text-blue-400 hover:underline"
              >
                Reset
              </button>
            )}
          </div>
          <input
            type="range"
            min="-2"
            max="16"
            step="0.5"
            value={style.letterSpacing || 0}
            onChange={(e) => onChange({ letterSpacing: Number(e.target.value) })}
            className="w-full accent-blue-500 cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] text-slate-400 font-semibold">Hauteur de Ligne ({style.lineHeight || 1.3}) :</span>
            {style.lineHeight !== undefined && style.lineHeight !== 1.3 && (
              <button
                type="button"
                onClick={() => onChange({ lineHeight: 1.3 })}
                className="text-[9px] text-blue-400 hover:underline"
              >
                Reset
              </button>
            )}
          </div>
          <input
            type="range"
            min="0.9"
            max="2.5"
            step="0.05"
            value={style.lineHeight || 1.3}
            onChange={(e) => onChange({ lineHeight: Number(e.target.value) })}
            className="w-full accent-blue-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Text Transform & Decoration */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#333333]">
        <div>
          <span className="text-[10px] text-slate-400 block font-semibold mb-1">Casse / Transformation :</span>
          <div className="grid grid-cols-2 gap-1">
            {[
              { id: 'none', label: 'Abc Normal' },
              { id: 'uppercase', label: 'MAJUSCULE' },
              { id: 'lowercase', label: 'minuscule' },
              { id: 'capitalize', label: 'Capitale' }
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onChange({ textTransform: t.id as any })}
                className={`py-1 px-1 rounded border text-[10px] font-bold cursor-pointer transition text-center truncate ${
                  (style.textTransform || 'none') === t.id
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-[#181818] text-slate-400 border-[#383838] hover:text-white hover:bg-[#2a2a2a]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="text-[10px] text-slate-400 block font-semibold mb-1">Soulignement / Décoration :</span>
          <div className="flex gap-1">
            {[
              { id: 'none', label: 'Aucune', icon: Baseline },
              { id: 'underline', label: 'Souligné', icon: Underline },
              { id: 'line-through', label: 'Barré', icon: Strikethrough }
            ].map((d) => {
              const Icon = d.icon;
              return (
                <button
                  key={d.id}
                  type="button"
                  title={d.label}
                  onClick={() => onChange({ textDecoration: d.id as any })}
                  className={`flex-1 py-1 rounded border text-xs font-bold cursor-pointer transition flex items-center justify-center ${
                    (style.textDecoration || 'none') === d.id
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-[#181818] text-slate-400 border-[#383838] hover:text-white hover:bg-[#2a2a2a]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Contour du texte (Text Stroke / Outline) */}
      <div className="space-y-2 pt-2 border-t border-[#333333]">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-slate-400 font-semibold">Contour du Texte (Stroke Outline) :</span>
          <span className="text-[10px] font-mono text-slate-300">{style.textStrokeWidth || 0}px</span>
        </div>

        <div className="grid grid-cols-3 gap-2 items-center">
          <div className="col-span-2">
            <input
              type="range"
              min="0"
              max="8"
              step="0.5"
              value={style.textStrokeWidth || 0}
              onChange={(e) => onChange({ textStrokeWidth: Number(e.target.value) })}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-1.5 justify-end">
            <span className="text-[9px] text-slate-400">Couleur :</span>
            <input
              type="color"
              value={style.textStrokeColor || '#000000'}
              onChange={(e) => onChange({ textStrokeColor: e.target.value })}
              className="w-6 h-6 rounded border-0 bg-transparent cursor-pointer"
              title="Couleur du contour"
            />
          </div>
        </div>
      </div>

      {/* Ombre Portée / Effet Lumineux (Text Shadow) */}
      <div className="space-y-2 pt-2 border-t border-[#333333]">
        <div className="flex justify-between items-center">
          <label className="text-[10px] text-slate-400 font-semibold flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={style.textShadow ?? true}
              onChange={(e) => onChange({ textShadow: e.target.checked })}
              className="rounded accent-blue-500"
            />
            <span>Ombre Portée / Effet Lisibilité</span>
          </label>

          {(style.textShadow ?? true) && (
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-slate-400">Flou ({style.textShadowBlur || 10}px) :</span>
              <input
                type="color"
                value={style.textShadowColor || '#000000'}
                onChange={(e) => onChange({ textShadowColor: e.target.value })}
                className="w-5 h-5 rounded border-0 bg-transparent cursor-pointer"
                title="Couleur de l'ombre"
              />
            </div>
          )}
        </div>

        {(style.textShadow ?? true) && (
          <input
            type="range"
            min="0"
            max="30"
            value={style.textShadowBlur || 10}
            onChange={(e) => onChange({ textShadowBlur: Number(e.target.value) })}
            className="w-full accent-blue-500 cursor-pointer"
          />
        )}
      </div>

      {/* Comportement Anti-Débordement & Ajustement Zone de Texte */}
      <div className="space-y-2 pt-2 border-t border-[#333333]">
        <div className="flex items-center justify-between">
          <span className="text-[10.5px] font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Ajustement Zone de Texte (Anti-Coupure) :</span>
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#181818] rounded-xl border border-[#333333]">
          <button
            type="button"
            onClick={() => onChange({ textFitMode: 'auto-scale-text' })}
            className={`p-2 rounded-lg text-center transition cursor-pointer flex flex-col items-center gap-0.5 border ${
              (style.textFitMode || 'auto-scale-text') === 'auto-scale-text'
                ? 'bg-blue-600/30 text-cyan-300 border-cyan-500/60 shadow-md font-black'
                : 'bg-[#222222] text-slate-400 border-[#383838] hover:text-white'
            }`}
            title="Redimensionne automatiquement la taille de police pour remplir la zone sans déborder"
          >
            <span className="text-[10px] font-bold">1. Ajuster Texte</span>
            <span className="text-[8px] leading-tight text-slate-300 opacity-80">Police auto (Remplir zone)</span>
          </button>

          <button
            type="button"
            onClick={() => onChange({ textFitMode: 'auto-expand-box' })}
            className={`p-2 rounded-lg text-center transition cursor-pointer flex flex-col items-center gap-0.5 border ${
              style.textFitMode === 'auto-expand-box'
                ? 'bg-blue-600/30 text-cyan-300 border-cyan-500/60 shadow-md font-black'
                : 'bg-[#222222] text-slate-400 border-[#383838] hover:text-white'
            }`}
            title="Adapte la hauteur de la zone de texte selon le contenu pour éviter tout texte coupé"
          >
            <span className="text-[10px] font-bold">2. Ajuster Zone</span>
            <span className="text-[8px] leading-tight text-slate-300 opacity-80">Cadre auto (Pas de coupure)</span>
          </button>

          <button
            type="button"
            onClick={() => onChange({ textFitMode: 'fixed' })}
            className={`p-2 rounded-lg text-center transition cursor-pointer flex flex-col items-center gap-0.5 border ${
              style.textFitMode === 'fixed'
                ? 'bg-blue-600/30 text-cyan-300 border-cyan-500/60 shadow-md font-black'
                : 'bg-[#222222] text-slate-400 border-[#383838] hover:text-white'
            }`}
            title="Conserve la taille de police fixe et la zone de texte fixe"
          >
            <span className="text-[10px] font-bold">3. Taille Fixe</span>
            <span className="text-[8px] leading-tight text-slate-300 opacity-80">Police & cadre fixes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
