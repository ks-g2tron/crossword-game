'use client';

import { useEffect, useState } from 'react';
import type { Difficulty } from '@/data/puzzles';

interface Props {
  isRunning: boolean;
  isComplete: boolean;
  difficulty: Difficulty;
  resetKey: number;
}

function getCompletionFeedback(difficulty: Difficulty, seconds: number): string {
  const targets: Record<Difficulty, [number, number]> = {
    easy: [120, 180],     // 2-3 min
    medium: [300, 480],   // 5-8 min
    hard: [600, 900],     // 10-15 min
  };

  const [fast, slow] = targets[difficulty];

  if (seconds < fast) return 'Wow! Faster than expected!';
  if (seconds <= slow) return 'Great job! On par with average.';
  return "Keep practicing, you'll get faster!";
}

export default function Timer({ isRunning, isComplete, difficulty, resetKey }: Props) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    setSeconds(0);
  }, [resetKey]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  if (isComplete) {
    return (
      <div className="text-center">
        <div className="font-mono text-lg text-green-700 bg-green-100 px-3 py-1 rounded font-semibold">
          Completed in {mins}:{String(secs).padStart(2, '0')}
        </div>
        <div className="text-sm text-green-600 mt-1 font-medium">
          {getCompletionFeedback(difficulty, seconds)}
        </div>
      </div>
    );
  }

  return (
    <div className="font-mono text-lg text-gray-700 bg-gray-100 px-3 py-1 rounded">
      {timeStr}
    </div>
  );
}
