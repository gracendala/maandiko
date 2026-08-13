export function getBlocksFromText(texte: string): string[] {
  if (!texte || !texte.trim()) return [];

  const trimmed = texte.trim();

  // 1. Double newline (or multiple newlines with optional spaces) -> Explicit blocks
  const doubleNewlineBlocks = trimmed
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter((b) => b.length > 0);

  if (doubleNewlineBlocks.length > 1) {
    return doubleNewlineBlocks;
  }

  // 2. Single newlines where each line is a substantial phrase (> 15 chars)
  const singleLineBlocks = trimmed
    .split(/\r?\n/)
    .map((b) => b.trim())
    .filter((b) => b.length > 0);

  if (singleLineBlocks.length > 1 && singleLineBlocks.every((l) => l.length > 15)) {
    return singleLineBlocks;
  }

  // 3. Long continuous block (> 350 chars): Split at sentence boundaries into ~200-280 char chunks
  if (trimmed.length > 350) {
    const sentences = trimmed.match(/[^.!?]+[.!?]+["»”]?\s*/g) || [trimmed];
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > 280 && currentChunk.length > 50) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += sentence;
      }
    }
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }
    if (chunks.length > 1) {
      return chunks;
    }
  }

  return [trimmed];
}
