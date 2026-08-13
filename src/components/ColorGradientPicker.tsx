import React, { useState, useEffect } from 'react';
import { Palette, Sparkles, Sliders, Check, RotateCw, Plus, Trash2, ArrowRight } from 'lucide-react';

export interface ColorGradientPickerProps {
  label: string;
  colorValue?: string;      // Solid color e.g. '#00d2ff', 'rgba(10,15,25,0.9)'
  gradientValue?: string;   // Gradient string e.g. 'linear-gradient(135deg, #0f172a, #1e3a8a)'
  allowTransparent?: boolean;
  onChange: (result: { backgroundColor?: string; backgroundGradient?: string; borderColor?: string; textColor?: string; opacity?: number }) => void;
  targetKey: 'background' | 'border' | 'text';
  currentOpacity?: number;
}

// Preset color lists
const SOLID_PRESETS = [
  { name: 'Cyan Néon', val: '#00d2ff' },
  { name: 'Bleu Royal', val: '#3b82f6' },
  { name: 'Or Sacré', val: '#f59e0b' },
  { name: 'Émeraude', val: '#10b981' },
  { name: 'Pourpre', val: '#8b5cf6' },
  { name: 'Rubis', val: '#ef4444' },
  { name: 'Blanc Pur', val: '#ffffff' },
  { name: 'Noir Ébène', val: '#000000' },
  { name: 'Nuit Profe', val: '#0a0f19' },
  { name: 'Ardoise', val: '#1e293b' },
  { name: 'Verre SOmbre', val: 'rgba(0, 0, 0, 0.85)' },
  { name: 'Transparent', val: 'transparent' },
];

const GRADIENT_PRESETS = [
  { name: 'Néon Cyan', val: 'linear-gradient(135deg, #00d2ff 0%, #3b82f6 100%)', cat: 'Néon' },
  { name: 'Magenta Cyber', val: 'linear-gradient(135deg, #e11d48 0%, #c084fc 100%)', cat: 'Néon' },
  { name: 'Violet Électrique', val: 'linear-gradient(135deg, #2e1065 0%, #581c87 50%, #a855f7 100%)', cat: 'Néon' },
  { name: 'Bleu Océan', val: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0284c7 100%)', cat: 'Sérénité' },
  { name: 'Émeraude Profond', val: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #10b981 100%)', cat: 'Sérénité' },
  { name: 'Vert Aurore', val: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)', cat: 'Sérénité' },
  { name: 'Or Flamboyant', val: 'linear-gradient(135deg, #1c1917 0%, #78350f 50%, #f59e0b 100%)', cat: 'Solaire' },
  { name: 'Ambre Chaud', val: 'linear-gradient(135deg, #78350f 0%, #d97706 50%, #fef08a 100%)', cat: 'Solaire' },
  { name: 'Rubis Sanguin', val: 'linear-gradient(135deg, #450a0a 0%, #991b1b 50%, #dc2626 100%)', cat: 'Solaire' },
  { name: 'Carbon Dark', val: 'linear-gradient(135deg, #090d16 0%, #1e293b 100%)', cat: 'Luxe' },
  { name: 'Halo Radial', val: 'radial-gradient(circle, rgba(0,210,255,0.4) 0%, rgba(10,15,25,0.95) 80%)', cat: 'Luxe' },
  { name: 'Glass Frost', val: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)', cat: 'Luxe' },
  { name: 'Arc-en-ciel', val: 'linear-gradient(90deg, #ef4444 0%, #f59e0b 25%, #10b981 50%, #3b82f6 75%, #a855f7 100%)', cat: 'Néon' },
];

const DIRECTION_ANGLES = [
  { label: '0°', angle: 0, icon: '↑' },
  { label: '45°', angle: 45, icon: '↗' },
  { label: '90°', angle: 90, icon: '→' },
  { label: '135°', angle: 135, icon: '↘' },
  { label: '180°', angle: 180, icon: '↓' },
  { label: '225°', angle: 225, icon: '↙' },
  { label: '270°', angle: 270, icon: '←' },
  { label: '315°', angle: 315, icon: '↖' },
];

export const ColorGradientPicker: React.FC<ColorGradientPickerProps> = ({
  label,
  colorValue = '#00d2ff',
  gradientValue,
  allowTransparent = true,
  onChange,
  targetKey,
  currentOpacity = 1
}) => {
  const isGradient = Boolean(gradientValue && gradientValue.trim() !== '');
  const isTransparent = !isGradient && colorValue === 'transparent';

  const [mode, setMode] = useState<'solid' | 'gradient' | 'transparent'>(
    isTransparent ? 'transparent' : (isGradient ? 'gradient' : 'solid')
  );

  // Custom gradient state
  const [gradType, setGradType] = useState<'linear' | 'radial'>('linear');
  const [gradAngle, setGradAngle] = useState<number>(135);
  const [stop1, setStop1] = useState<string>('#0f172a');
  const [stop2, setStop2] = useState<string>('#0284c7');
  const [useStop3, setUseStop3] = useState<boolean>(false);
  const [stop3, setStop3] = useState<string>('#00d2ff');

  // Solid state
  const [solidColor, setSolidColor] = useState<string>(
    colorValue && colorValue !== 'transparent' ? colorValue : '#00d2ff'
  );
  const [solidAlpha, setSolidAlpha] = useState<number>(currentOpacity);

  // Synchronize from props when changed externally
  useEffect(() => {
    if (gradientValue && gradientValue.trim() !== '') {
      setMode('gradient');
    } else if (colorValue === 'transparent') {
      setMode('transparent');
    } else if (colorValue) {
      setMode('solid');
      setSolidColor(colorValue);
    }
  }, [colorValue, gradientValue]);

  // Convert Hex to RGBA if alpha < 1
  const formatSolidColorWithAlpha = (colorHex: string, alpha: number) => {
    if (colorHex === 'transparent') return 'transparent';
    if (alpha >= 1) return colorHex;
    // Handle hex like #00d2ff
    if (colorHex.startsWith('#')) {
      const hex = colorHex.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16) || 0;
      const g = parseInt(hex.substring(2, 4), 16) || 0;
      const b = parseInt(hex.substring(4, 6), 16) || 0;
      return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
    }
    return colorHex;
  };

  // Helper to trigger update back to parent
  const applyChange = (newMode: 'solid' | 'gradient' | 'transparent', valColor?: string, valGrad?: string) => {
    setMode(newMode);
    if (targetKey === 'background') {
      if (newMode === 'transparent') {
        onChange({ backgroundColor: 'transparent', backgroundGradient: undefined });
      } else if (newMode === 'gradient') {
        onChange({ backgroundGradient: valGrad || constructCustomGradient(), backgroundColor: undefined });
      } else {
        onChange({ backgroundColor: valColor || solidColor, backgroundGradient: undefined });
      }
    } else if (targetKey === 'border') {
      if (newMode === 'transparent') {
        onChange({ borderColor: 'transparent' });
      } else if (newMode === 'gradient') {
        onChange({ borderColor: valGrad || constructCustomGradient() });
      } else {
        onChange({ borderColor: valColor || solidColor });
      }
    } else if (targetKey === 'text') {
      if (newMode === 'transparent') {
        onChange({ textColor: 'transparent' });
      } else if (newMode === 'gradient') {
        // Text gradient can be represented by gradient in text style
        onChange({ textColor: valColor || solidColor });
      } else {
        onChange({ textColor: valColor || solidColor });
      }
    }
  };

  const constructCustomGradient = () => {
    if (gradType === 'radial') {
      return useStop3
        ? `radial-gradient(circle, ${stop1} 0%, ${stop2} 50%, ${stop3} 100%)`
        : `radial-gradient(circle, ${stop1} 0%, ${stop2} 100%)`;
    }
    return useStop3
      ? `linear-gradient(${gradAngle}deg, ${stop1} 0%, ${stop2} 50%, ${stop3} 100%)`
      : `linear-gradient(${gradAngle}deg, ${stop1} 0%, ${stop2} 100%)`;
  };

  const handleUpdateCustomGradient = (updatedGradStr?: string) => {
    const finalGrad = updatedGradStr || constructCustomGradient();
    applyChange('gradient', undefined, finalGrad);
  };

  return (
    <div className="space-y-2.5 p-3 bg-[#151a24] rounded-xl border border-[#2a3447] text-slate-100 shadow-md">
      {/* Label and Mode Selector */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-cyan-400" />
          <span>{label}</span>
        </span>

        {/* Mode Tabs */}
        <div className="flex items-center p-0.5 bg-[#0b0f19] rounded-lg border border-[#263147]">
          <button
            type="button"
            onClick={() => applyChange('solid', solidColor)}
            className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer transition ${
              mode === 'solid' ? 'bg-cyan-500 text-black shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Solide
          </button>
          <button
            type="button"
            onClick={() => applyChange('gradient', undefined, gradientValue || constructCustomGradient())}
            className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer transition ${
              mode === 'gradient' ? 'bg-amber-500 text-black shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Dégradé
          </button>
          {allowTransparent && (
            <button
              type="button"
              onClick={() => applyChange('transparent')}
              className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer transition ${
                mode === 'transparent' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Aucun
            </button>
          )}
        </div>
      </div>

      {/* MODE 1: SOLID COLOR */}
      {mode === 'solid' && (
        <div className="space-y-2.5 pt-1">
          {/* Swatches */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {SOLID_PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => {
                  setSolidColor(p.val);
                  applyChange('solid', p.val);
                }}
                className={`w-5 h-5 rounded-full border cursor-pointer transition transform hover:scale-110 relative ${
                  solidColor === p.val ? 'border-cyan-400 ring-2 ring-cyan-400/50' : 'border-white/20'
                }`}
                style={{ backgroundColor: p.val === 'transparent' ? '#1e293b' : p.val }}
                title={p.name}
              >
                {p.val === 'transparent' && (
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] text-rose-400 font-bold">✕</span>
                )}
              </button>
            ))}
          </div>

          {/* Color Picker & Hex Input */}
          <div className="flex items-center gap-2 pt-1 border-t border-[#263147]/60">
            <input
              type="color"
              value={solidColor.startsWith('#') ? solidColor : '#00d2ff'}
              onChange={(e) => {
                setSolidColor(e.target.value);
                applyChange('solid', e.target.value);
              }}
              className="w-7 h-7 rounded border-0 bg-transparent cursor-pointer shrink-0"
              title="Choisir une couleur"
            />
            <input
              type="text"
              value={solidColor}
              onChange={(e) => {
                setSolidColor(e.target.value);
                applyChange('solid', e.target.value);
              }}
              className="w-24 bg-[#0d121d] border border-[#2e3b52] rounded px-2 py-1 text-xs font-mono font-bold text-cyan-300 outline-none focus:border-cyan-400"
              placeholder="#00d2ff"
            />

            {/* Opacity slider */}
            <div className="flex items-center gap-1.5 ml-auto text-[10px] font-semibold text-slate-300">
              <span className="text-slate-400">Opacité:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={solidAlpha}
                onChange={(e) => {
                  const a = Number(e.target.value);
                  setSolidAlpha(a);
                  const formatted = formatSolidColorWithAlpha(solidColor, a);
                  applyChange('solid', formatted);
                }}
                className="w-16 accent-cyan-400 cursor-pointer"
              />
              <span className="w-8 font-mono text-cyan-300 text-right">{Math.round(solidAlpha * 100)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: GRADIENT */}
      {mode === 'gradient' && (
        <div className="space-y-3 pt-1">
          {/* Quick Presets */}
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">
              Dégradés Prédéfinis :
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {GRADIENT_PRESETS.map((g) => {
                const isActive = gradientValue === g.val;
                return (
                  <button
                    key={g.name}
                    type="button"
                    onClick={() => applyChange('gradient', undefined, g.val)}
                    className={`h-7 rounded-lg border text-[9px] font-bold px-1.5 flex items-center justify-between cursor-pointer transition hover:scale-105 shadow-sm overflow-hidden ${
                      isActive ? 'border-cyan-400 ring-2 ring-cyan-400/50 text-white' : 'border-white/20 text-white/90 hover:border-white/50'
                    }`}
                    style={{ background: g.val }}
                    title={g.name}
                  >
                    <span className="truncate drop-shadow">{g.name}</span>
                    {isActive && <Check className="w-3 h-3 text-cyan-300 shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Gradient Generator */}
          <div className="p-2.5 bg-[#0b0f19] rounded-lg border border-[#263147] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Créateur de Dégradé Personnalisé</span>
              </span>

              {/* Type Switcher */}
              <div className="flex items-center gap-1 bg-[#151a24] p-0.5 rounded border border-[#2e3b52]">
                <button
                  type="button"
                  onClick={() => {
                    setGradType('linear');
                    handleUpdateCustomGradient();
                  }}
                  className={`px-1.5 py-0.5 text-[9px] font-bold rounded cursor-pointer ${
                    gradType === 'linear' ? 'bg-cyan-500 text-black' : 'text-slate-400'
                  }`}
                >
                  Linéaire
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGradType('radial');
                    handleUpdateCustomGradient();
                  }}
                  className={`px-1.5 py-0.5 text-[9px] font-bold rounded cursor-pointer ${
                    gradType === 'radial' ? 'bg-cyan-500 text-black' : 'text-slate-400'
                  }`}
                >
                  Radial
                </button>
              </div>
            </div>

            {/* Direction Presets (if Linear) */}
            {gradType === 'linear' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-slate-300">
                  <span className="text-slate-400">Orientation :</span>
                  <span className="font-mono text-cyan-300 font-bold">{gradAngle}°</span>
                </div>

                {/* Quick Angle Buttons */}
                <div className="grid grid-cols-8 gap-1">
                  {DIRECTION_ANGLES.map((d) => (
                    <button
                      key={d.label}
                      type="button"
                      onClick={() => {
                        setGradAngle(d.angle);
                        const newGrad = useStop3
                          ? `linear-gradient(${d.angle}deg, ${stop1} 0%, ${stop2} 50%, ${stop3} 100%)`
                          : `linear-gradient(${d.angle}deg, ${stop1} 0%, ${stop2} 100%)`;
                        handleUpdateCustomGradient(newGrad);
                      }}
                      className={`h-6 rounded text-[10px] font-bold cursor-pointer transition flex items-center justify-center ${
                        gradAngle === d.angle ? 'bg-cyan-500 text-black font-black' : 'bg-[#182030] text-slate-300 hover:bg-[#25324d]'
                      }`}
                      title={`Angle ${d.label}`}
                    >
                      {d.icon}
                    </button>
                  ))}
                </div>

                {/* Fine Angle Slider */}
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="5"
                  value={gradAngle}
                  onChange={(e) => {
                    const a = Number(e.target.value);
                    setGradAngle(a);
                    const newGrad = useStop3
                      ? `linear-gradient(${a}deg, ${stop1} 0%, ${stop2} 50%, ${stop3} 100%)`
                      : `linear-gradient(${a}deg, ${stop1} 0%, ${stop2} 100%)`;
                    handleUpdateCustomGradient(newGrad);
                  }}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            )}

            {/* Color Stops Pickers */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#263147]/60">
              {/* Stop 1 */}
              <div>
                <span className="text-[9px] text-slate-400 block font-semibold mb-1">Couleur Départ (0%) :</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={stop1}
                    onChange={(e) => {
                      setStop1(e.target.value);
                      const newGrad = gradType === 'radial'
                        ? (useStop3 ? `radial-gradient(circle, ${e.target.value} 0%, ${stop2} 50%, ${stop3} 100%)` : `radial-gradient(circle, ${e.target.value} 0%, ${stop2} 100%)`)
                        : (useStop3 ? `linear-gradient(${gradAngle}deg, ${e.target.value} 0%, ${stop2} 50%, ${stop3} 100%)` : `linear-gradient(${gradAngle}deg, ${e.target.value} 0%, ${stop2} 100%)`);
                      handleUpdateCustomGradient(newGrad);
                    }}
                    className="w-6 h-6 rounded border-0 bg-transparent cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={stop1}
                    onChange={(e) => setStop1(e.target.value)}
                    className="w-full bg-[#151a24] border border-[#2e3b52] rounded px-1.5 py-0.5 text-[10px] font-mono font-bold text-cyan-300 outline-none"
                  />
                </div>
              </div>

              {/* Stop 2 */}
              <div>
                <span className="text-[9px] text-slate-400 block font-semibold mb-1">Couleur Fin (100%) :</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={stop2}
                    onChange={(e) => {
                      setStop2(e.target.value);
                      const newGrad = gradType === 'radial'
                        ? (useStop3 ? `radial-gradient(circle, ${stop1} 0%, ${e.target.value} 50%, ${stop3} 100%)` : `radial-gradient(circle, ${stop1} 0%, ${e.target.value} 100%)`)
                        : (useStop3 ? `linear-gradient(${gradAngle}deg, ${stop1} 0%, ${e.target.value} 50%, ${stop3} 100%)` : `linear-gradient(${gradAngle}deg, ${stop1} 0%, ${e.target.value} 100%)`);
                      handleUpdateCustomGradient(newGrad);
                    }}
                    className="w-6 h-6 rounded border-0 bg-transparent cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={stop2}
                    onChange={(e) => setStop2(e.target.value)}
                    className="w-full bg-[#151a24] border border-[#2e3b52] rounded px-1.5 py-0.5 text-[10px] font-mono font-bold text-cyan-300 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Toggle 3rd Stop */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => {
                  const nextState = !useStop3;
                  setUseStop3(nextState);
                  const newGrad = gradType === 'radial'
                    ? (nextState ? `radial-gradient(circle, ${stop1} 0%, ${stop2} 50%, ${stop3} 100%)` : `radial-gradient(circle, ${stop1} 0%, ${stop2} 100%)`)
                    : (nextState ? `linear-gradient(${gradAngle}deg, ${stop1} 0%, ${stop2} 50%, ${stop3} 100%)` : `linear-gradient(${gradAngle}deg, ${stop1} 0%, ${stop2} 100%)`);
                  handleUpdateCustomGradient(newGrad);
                }}
                className="text-[10px] text-amber-300 hover:text-amber-200 font-bold flex items-center gap-1 cursor-pointer"
              >
                {useStop3 ? <Trash2 className="w-3 h-3 text-rose-400" /> : <Plus className="w-3 h-3" />}
                <span>{useStop3 ? 'Retirer 3ème couleur' : 'Ajouter 3ème couleur (Intermédiaire)'}</span>
              </button>
            </div>

            {useStop3 && (
              <div className="pt-1">
                <span className="text-[9px] text-slate-400 block font-semibold mb-1">Couleur Intermédiaire (50%) :</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={stop3}
                    onChange={(e) => {
                      setStop3(e.target.value);
                      const newGrad = gradType === 'radial'
                        ? `radial-gradient(circle, ${stop1} 0%, ${stop2} 50%, ${e.target.value} 100%)`
                        : `linear-gradient(${gradAngle}deg, ${stop1} 0%, ${stop2} 50%, ${e.target.value} 100%)`;
                      handleUpdateCustomGradient(newGrad);
                    }}
                    className="w-6 h-6 rounded border-0 bg-transparent cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={stop3}
                    onChange={(e) => setStop3(e.target.value)}
                    className="w-full bg-[#151a24] border border-[#2e3b52] rounded px-1.5 py-0.5 text-[10px] font-mono font-bold text-cyan-300 outline-none"
                  />
                </div>
              </div>
            )}

            {/* Direct CSS Gradient Input */}
            <div className="pt-1.5 border-t border-[#263147]/60">
              <span className="text-[9px] text-slate-400 font-semibold block mb-1">Code CSS du dégradé :</span>
              <input
                type="text"
                value={gradientValue || constructCustomGradient()}
                onChange={(e) => applyChange('gradient', undefined, e.target.value)}
                className="w-full bg-[#151a24] border border-[#2e3b52] rounded px-2 py-1 text-[10px] font-mono text-cyan-200 outline-none focus:border-cyan-400"
                placeholder="linear-gradient(...)"
              />
            </div>
          </div>
        </div>
      )}

      {/* MODE 3: TRANSPARENT */}
      {mode === 'transparent' && (
        <div className="py-2 text-center text-slate-400 text-[11px] italic font-semibold bg-[#0b0f19] rounded-lg border border-[#263147]/60">
          Transparence activée (Rendu invisible)
        </div>
      )}
    </div>
  );
};
