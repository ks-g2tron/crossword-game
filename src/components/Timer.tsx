'use client';

import { useEffect, useState } from 'react';

interface Props {
  isRunning: boolean;
  onReset?: () => void;
}

export default function Timer({ isRunning }: Props) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <div className="font-mono text-lg text-gray-700 bg-gray-100 px-3 py-1 rounded">
      {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
    </div>
  );
}
