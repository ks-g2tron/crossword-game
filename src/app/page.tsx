'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { puzzleSets, themeLabels, difficultyLabels, Theme, Difficulty } from '@/data/puzzles';
import { generateCrossword, PlacedWord } from '@/lib/crosswordGenerator';
import CrosswordGridComponent from '@/components/CrosswordGrid';
import ClueList from '@/components/ClueList';
import Timer from '@/components/Timer';
import { exportToPDF } from '@/lib/pdfExport';
import Footer from '@/components/Footer';

export default function Home() {
  const [theme, setTheme] = useState<Theme>('ocean');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [showSolution, setShowSolution] = useState(false);
  const [selectedClue, setSelectedClue] = useState<PlacedWord | null>(null);
  const [userAnswers, setUserAnswers] = useState<string[][]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [puzzleKey, setPuzzleKey] = useState(0);
  const [timerStarted, setTimerStarted] = useState(false);

  const crossword = useMemo(() => {
    const clues = puzzleSets[theme][difficulty];
    return generateCrossword(clues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, difficulty, puzzleKey]);

  useEffect(() => {
    setUserAnswers(
      Array.from({ length: crossword.height }, () => Array(crossword.width).fill(''))
    );
    setShowSolution(false);
    setSelectedClue(null);
    setIsComplete(false);
    setHintUsed(false);
    setTimerStarted(false);
  }, [crossword]);

  const handleCellChange = useCallback((row: number, col: number, value: string) => {
    setUserAnswers(prev => {
      const next = prev.map(r => [...r]);
      next[row][col] = value;
      return next;
    });
    // Start timer on first user input
    if (!timerStarted && value) {
      setTimerStarted(true);
    }
  }, [timerStarted]);

  // Check completion
  useEffect(() => {
    if (userAnswers.length === 0) return;
    const complete = crossword.placedWords.every(word => {
      const dr = word.direction === 'down' ? 1 : 0;
      const dc = word.direction === 'across' ? 1 : 0;
      for (let i = 0; i < word.word.length; i++) {
        const r = word.row + dr * i;
        const c = word.col + dc * i;
        if ((userAnswers[r]?.[c] || '') !== word.word[i]) return false;
      }
      return true;
    });
    setIsComplete(complete);
  }, [userAnswers, crossword.placedWords]);

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      const wordsAtCell = crossword.placedWords.filter(w => {
        const dr = w.direction === 'down' ? 1 : 0;
        const dc = w.direction === 'across' ? 1 : 0;
        for (let i = 0; i < w.word.length; i++) {
          if (w.row + dr * i === row && w.col + dc * i === col) return true;
        }
        return false;
      });

      if (wordsAtCell.length === 0) return;

      if (selectedClue && wordsAtCell.length > 1) {
        const currentIdx = wordsAtCell.findIndex(
          w => w.word === selectedClue.word && w.direction === selectedClue.direction
        );
        setSelectedClue(wordsAtCell[(currentIdx + 1) % wordsAtCell.length]);
      } else {
        setSelectedClue(wordsAtCell[0]);
      }
    },
    [crossword.placedWords, selectedClue]
  );

  const handleHint = useCallback(() => {
    if (!selectedClue) return;
    setHintUsed(true);
    const dr = selectedClue.direction === 'down' ? 1 : 0;
    const dc = selectedClue.direction === 'across' ? 1 : 0;

    for (let i = 0; i < selectedClue.word.length; i++) {
      const r = selectedClue.row + dr * i;
      const c = selectedClue.col + dc * i;
      if ((userAnswers[r]?.[c] || '') !== selectedClue.word[i]) {
        handleCellChange(r, c, selectedClue.word[i]);
        break;
      }
    }
  }, [selectedClue, userAnswers, handleCellChange]);

  const handleNewPuzzle = () => setPuzzleKey(k => k + 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-indigo-700">Crossword Puzzle</h1>
          <Timer
              isRunning={!showSolution && !isComplete}
              isComplete={isComplete && !showSolution}
              difficulty={difficulty}
              resetKey={puzzleKey}
              hasStarted={timerStarted}
            />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Controls */}
        <div className="flex flex-wrap gap-3 mb-6 items-center">
          <select
            value={theme}
            onChange={e => setTheme(e.target.value as Theme)}
            className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            {Object.entries(themeLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <select
            value={difficulty}
            onChange={e => setDifficulty(e.target.value as Difficulty)}
            className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            {Object.entries(difficultyLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <button
            onClick={handleNewPuzzle}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition shadow-sm"
          >
            New Puzzle
          </button>

          <button
            onClick={() => setShowSolution(!showSolution)}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition shadow-sm"
          >
            {showSolution ? 'Hide Solution' : 'Show Solution'}
          </button>

          <button
            onClick={handleHint}
            disabled={!selectedClue || showSolution}
            className="px-4 py-2 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Hint
          </button>

          <button
            onClick={() => exportToPDF(crossword, themeLabels[theme], difficultyLabels[difficulty])}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition shadow-sm"
          >
            Print / PDF
          </button>
        </div>

        {isComplete && !showSolution && (
          <div className="mb-4 p-4 bg-green-100 border border-green-300 rounded-lg text-green-800 font-semibold text-center text-lg">
            Congratulations! You completed the crossword! {hintUsed ? '(with hints)' : 'No hints used!'}
          </div>
        )}

        {/* Grid + Clues */}
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6">
          <div className="bg-white rounded-xl shadow-md p-4">
            <CrosswordGridComponent
              crossword={crossword}
              userAnswers={userAnswers}
              onCellChange={handleCellChange}
              selectedClue={selectedClue}
              onCellClick={handleCellClick}
              showSolution={showSolution}
            />
          </div>

          <div className="bg-white rounded-xl shadow-md p-4">
            <ClueList
              placedWords={crossword.placedWords}
              selectedClue={selectedClue}
              onSelectClue={setSelectedClue}
              userAnswers={userAnswers}
              showSolution={showSolution}
            />
          </div>
        </div>

        {selectedClue && (
          <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
            <span className="font-bold text-indigo-700">
              {selectedClue.number} {selectedClue.direction.toUpperCase()}:
            </span>{' '}
            <span className="text-gray-700">{selectedClue.clue}</span>
            <span className="text-gray-400 ml-1">({selectedClue.word.length} letters)</span>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
