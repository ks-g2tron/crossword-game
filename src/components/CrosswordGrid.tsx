'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { CrosswordGrid as CrosswordGridType, PlacedWord } from '@/lib/crosswordGenerator';

interface Props {
  crossword: CrosswordGridType;
  userAnswers: string[][];
  onCellChange: (row: number, col: number, value: string) => void;
  selectedClue: PlacedWord | null;
  onCellClick: (row: number, col: number) => void;
  showSolution: boolean;
}

export default function CrosswordGrid({
  crossword,
  userAnswers,
  onCellChange,
  selectedClue,
  onCellClick,
  showSolution,
}: Props) {
  const inputRefs = useRef<(HTMLInputElement | null)[][]>([]);

  useEffect(() => {
    inputRefs.current = Array.from({ length: crossword.height }, () =>
      Array(crossword.width).fill(null)
    );
  }, [crossword.height, crossword.width]);

  const getNumberForCell = useCallback(
    (row: number, col: number): number | null => {
      const word = crossword.placedWords.find(w => w.row === row && w.col === col);
      return word ? word.number : null;
    },
    [crossword.placedWords]
  );

  const isCellHighlighted = useCallback(
    (row: number, col: number): boolean => {
      if (!selectedClue) return false;
      const dr = selectedClue.direction === 'down' ? 1 : 0;
      const dc = selectedClue.direction === 'across' ? 1 : 0;
      for (let i = 0; i < selectedClue.word.length; i++) {
        if (selectedClue.row + dr * i === row && selectedClue.col + dc * i === col) {
          return true;
        }
      }
      return false;
    },
    [selectedClue]
  );

  const handleKeyDown = (e: React.KeyboardEvent, row: number, col: number) => {
    if (!selectedClue) return;
    const dr = selectedClue.direction === 'down' ? 1 : 0;
    const dc = selectedClue.direction === 'across' ? 1 : 0;

    if (e.key === 'Backspace' && userAnswers[row]?.[col] === '') {
      e.preventDefault();
      const prevR = row - dr;
      const prevC = col - dc;
      if (prevR >= 0 && prevC >= 0 && crossword.grid[prevR]?.[prevC] !== '') {
        onCellChange(prevR, prevC, '');
        inputRefs.current[prevR]?.[prevC]?.focus();
      }
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      let nr = row, nc = col;
      if (e.key === 'ArrowRight') nc++;
      if (e.key === 'ArrowLeft') nc--;
      if (e.key === 'ArrowDown') nr++;
      if (e.key === 'ArrowUp') nr--;
      if (nr >= 0 && nr < crossword.height && nc >= 0 && nc < crossword.width && crossword.grid[nr][nc] !== '') {
        inputRefs.current[nr]?.[nc]?.focus();
      }
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>, row: number, col: number) => {
    const val = e.target.value.toUpperCase().slice(-1);
    onCellChange(row, col, val);

    if (val && selectedClue) {
      const dr = selectedClue.direction === 'down' ? 1 : 0;
      const dc = selectedClue.direction === 'across' ? 1 : 0;
      const nextR = row + dr;
      const nextC = col + dc;
      if (nextR < crossword.height && nextC < crossword.width && crossword.grid[nextR]?.[nextC] !== '') {
        inputRefs.current[nextR]?.[nextC]?.focus();
      }
    }
  };

  const cellSize = 36;

  return (
    <div className="overflow-auto pb-4">
      <div
        className="grid gap-0 mx-auto"
        style={{
          gridTemplateColumns: `repeat(${crossword.width}, ${cellSize}px)`,
          width: crossword.width * cellSize,
        }}
      >
        {crossword.grid.map((row, r) =>
          row.map((cell, c) => {
            const num = getNumberForCell(r, c);
            const highlighted = isCellHighlighted(r, c);
            const isBlack = cell === '';

            if (isBlack) {
              return (
                <div
                  key={`${r}-${c}`}
                  className="bg-gray-900"
                  style={{ width: cellSize, height: cellSize }}
                />
              );
            }

            const isCorrect = showSolution || userAnswers[r]?.[c] === cell;
            const displayValue = showSolution ? cell : userAnswers[r]?.[c] || '';

            return (
              <div
                key={`${r}-${c}`}
                className={`relative border border-gray-300 ${
                  highlighted ? 'bg-yellow-100' : 'bg-white'
                }`}
                style={{ width: cellSize, height: cellSize }}
                onClick={() => onCellClick(r, c)}
              >
                {num && (
                  <span className="absolute top-0 left-0.5 text-[9px] font-bold text-gray-600 leading-none z-10">
                    {num}
                  </span>
                )}
                <input
                  ref={(el) => {
                    if (!inputRefs.current[r]) inputRefs.current[r] = [];
                    inputRefs.current[r][c] = el;
                  }}
                  type="text"
                  maxLength={1}
                  value={displayValue}
                  disabled={showSolution}
                  onChange={(e) => handleInput(e, r, c)}
                  onKeyDown={(e) => handleKeyDown(e, r, c)}
                  className={`w-full h-full text-center text-sm font-bold uppercase bg-transparent outline-none ${
                    showSolution
                      ? 'text-green-700'
                      : isCorrect && displayValue
                      ? 'text-blue-700'
                      : 'text-gray-900'
                  }`}
                  style={{ caretColor: 'transparent', paddingTop: num ? '6px' : '0' }}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
