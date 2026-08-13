// Utility for loading Google Fonts and System/Local Fonts dynamically

const standardSystemFonts = new Set([
  'arial', 'helvetica', 'times new roman', 'georgia', 'courier new',
  'verdana', 'comic sans ms', 'trebuchet ms', 'impact', 'segoe ui',
  'calibri', 'garamond', 'tahoma', 'consolas', 'palatino', 'serif', 'sans-serif', 'monospace'
]);

export function loadGoogleFontIfNeeded(fontFamily?: string) {
  if (!fontFamily) return;
  const cleanName = fontFamily.trim();
  if (!cleanName) return;

  const lower = cleanName.toLowerCase();
  // Don't try loading standard system fonts or custom uploaded blob/data URLs via Google Fonts
  if (standardSystemFonts.has(lower) || lower.startsWith('blob:') || lower.startsWith('data:')) {
    return;
  }

  const fontId = `gfont-${cleanName.replace(/\s+/g, '-').toLowerCase()}`;
  if (!document.getElementById(fontId)) {
    const link = document.createElement('link');
    link.id = fontId;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(cleanName)}:wght@100;300;400;500;600;700;800;900&display=swap`;
    document.head.appendChild(link);
  }
}

export async function loadCustomFontFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const fontName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_]/g, "_");
        const fontFace = new FontFace(fontName, arrayBuffer);
        const loadedFace = await fontFace.load();
        document.fonts.add(loadedFace);
        resolve(fontName);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

export async function detectPCInstalledFonts(): Promise<string[]> {
  if (typeof window !== 'undefined' && 'queryLocalFonts' in window) {
    try {
      const localFonts = await (window as any).queryLocalFonts();
      const families = Array.from(new Set(localFonts.map((f: any) => f.family))) as string[];
      return families.sort();
    } catch (err) {
      console.warn("Permission denied or queryLocalFonts error:", err);
      return [];
    }
  }
  return [];
}
