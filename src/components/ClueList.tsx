'use client';

import { PlacedWord } from '@/lib/crosswordGenerator';

interface Props {
  placedWords: PlacedWord[];
  selectedClue: PlacedWord | null;
  onSelectClue: (word: PlacedWord) => void;
  userAnswers: string[][];
  showSolution: boolean;
}

export default function ClueList({ placedWords, selectedClue, onSelectClue, userAnswers, showSolution }: Props) {
  const across = placedWords
    .filter(w => w.direction === 'across')
    .sort((a, b) => a.number - b.number);
  const down = placedWords
    .filter(w => w.direction === 'down')
    .sort((a, b) => a.number - b.number);

  const isWordComplete = (word: PlacedWord): boolean => {
    const dr = word.direction === 'down' ? 1 : 0;
    const dc = word.direction === 'across' ? 1 : 0;
    for (let i = 0; i < word.word.length; i++) {
      const r = word.row + dr * i;
      const c = word.col + dc * i;
      if ((userAnswers[r]?.[c] || '') !== word.word[i]) return false;
    }
    return true;
  };

  const renderClue = (word: PlacedWord) => {
    const complete = showSolution || isWordComplete(word);
    const isSelected = selectedClue?.word === word.word && selectedClue?.direction === word.direction;

    return (
      <li
        key={`${word.direction}-${word.number}`}
        className={`cursor-pointer px-2 py-1.5 rounded text-sm transition-colors ${
          isSelected
            ? 'bg-yellow-200 font-semibold'
            : complete
            ? 'text-green-600 line-through'
            : 'hover:bg-gray-100'
        }`}
        onClick={() => onSelectClue(word)}
      >
        <span className="font-bold mr-1">{word.number}.</span>
        {word.clue}
        <span className="text-gray-400 ml-1">({word.word.length})</span>
      </li>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <h3 className="font-bold text-lg mb-2 text-gray-800">Across</h3>
        <ul className="space-y-1">{across.map(renderClue)}</ul>
      </div>
      <div>
        <h3 className="font-bold text-lg mb-2 text-gray-800">Down</h3>
        <ul className="space-y-1">{down.map(renderClue)}</ul>
      </div>
    </div>
  );
}
