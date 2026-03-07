import { CrosswordGrid, PlacedWord } from './crosswordGenerator';

export function exportToPDF(crossword: CrosswordGrid, theme: string, difficulty: string) {
  const cellSize = 28;
  const padding = 40;
  const gridWidth = crossword.width * cellSize;
  const gridHeight = crossword.height * cellSize;

  const across = crossword.placedWords.filter(w => w.direction === 'across').sort((a, b) => a.number - b.number);
  const down = crossword.placedWords.filter(w => w.direction === 'down').sort((a, b) => a.number - b.number);

  const clueLineHeight = 16;
  const cluesHeight = Math.max(across.length, down.length) * clueLineHeight + 60;
  const totalHeight = padding + 40 + gridHeight + 30 + cluesHeight + padding;
  const totalWidth = Math.max(gridWidth + padding * 2, 600);

  const numberMap = new Map<string, number>();
  crossword.placedWords.forEach(w => {
    const key = `${w.row},${w.col}`;
    if (!numberMap.has(key)) numberMap.set(key, w.number);
  });

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">`;
  svg += `<rect width="100%" height="100%" fill="white"/>`;

  // Title
  svg += `<text x="${totalWidth / 2}" y="${padding + 20}" text-anchor="middle" font-size="20" font-weight="bold" font-family="Arial">Crossword: ${theme} (${difficulty})</text>`;

  const gridX = (totalWidth - gridWidth) / 2;
  const gridY = padding + 40;

  // Draw grid
  for (let r = 0; r < crossword.height; r++) {
    for (let c = 0; c < crossword.width; c++) {
      const x = gridX + c * cellSize;
      const y = gridY + r * cellSize;
      const cell = crossword.grid[r][c];

      if (cell === '') {
        svg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="#1a1a1a"/>`;
      } else {
        svg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="white" stroke="#333" stroke-width="1"/>`;
        const num = numberMap.get(`${r},${c}`);
        if (num) {
          svg += `<text x="${x + 2}" y="${y + 9}" font-size="7" font-family="Arial" fill="#333">${num}</text>`;
        }
      }
    }
  }

  // Clues
  const cluesY = gridY + gridHeight + 30;
  const colWidth = (totalWidth - padding * 2) / 2;

  svg += `<text x="${padding}" y="${cluesY}" font-size="14" font-weight="bold" font-family="Arial">Across</text>`;
  across.forEach((w, i) => {
    const escapedClue = escapeXml(`${w.number}. ${w.clue} (${w.word.length})`);
    svg += `<text x="${padding}" y="${cluesY + 20 + i * clueLineHeight}" font-size="10" font-family="Arial">${escapedClue}</text>`;
  });

  svg += `<text x="${padding + colWidth}" y="${cluesY}" font-size="14" font-weight="bold" font-family="Arial">Down</text>`;
  down.forEach((w, i) => {
    const escapedClue = escapeXml(`${w.number}. ${w.clue} (${w.word.length})`);
    svg += `<text x="${padding + colWidth}" y="${cluesY + 20 + i * clueLineHeight}" font-size="10" font-family="Arial">${escapedClue}</text>`;
  });

  svg += `</svg>`;

  // Convert to printable HTML
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head><title>Crossword - ${theme} (${difficulty})</title>
      <style>
        body { margin: 0; display: flex; justify-content: center; }
        @media print { body { margin: 0; } }
      </style>
      </head>
      <body>${svg}</body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  }
}

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
