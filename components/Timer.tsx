
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface TimerProps {
  initialMinutes?: number;
  color?: string;
}

const Timer: React.FC<TimerProps> = ({ initialMinutes = 25, color = '#667eea' }) => {
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef<number | null>(null);

  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const progress = timeLeft / (initialMinutes * 60);
  const strokeDashoffset = circumference - progress * circumference;

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(initialMinutes * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-3xl border border-white/40 dark:border-white/10 shadow-xl max-w-sm mx-auto transition-colors duration-300">
      <div className="relative w-60 h-60 mb-6">
        {/* Background Circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="120"
            cy="120"
            r={radius}
            stroke="currentColor"
            strokeWidth="12"
            fill="transparent"
            className="text-gray-200 dark:text-gray-700 transition-colors duration-300"
          />
          {/* Progress Circle */}
          <circle
            cx="120"
            cy="120"
            r={radius}
            stroke={color}
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-in-out drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
          />
        </svg>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl font-bold dark:text-white" style={{ color }}>
          {formatTime(timeLeft)}
        </div>
      </div>
      
      <div className="flex gap-4">
        <button
          onClick={toggleTimer}
          className={`flex items-center justify-center w-14 h-14 rounded-xl text-white shadow-lg transition-transform active:scale-95 hover:scale-105 ${isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-secondary'}`}
        >
          {isActive ? <Pause size={24} /> : <Play size={24} fill="currentColor" />}
        </button>
        <button
          onClick={resetTimer}
          className="flex items-center justify-center w-14 h-14 bg-white dark:bg-slate-700 text-gray-500 dark:text-gray-200 rounded-xl shadow-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-transform active:scale-95 hover:scale-105"
        >
          <RotateCcw size={24} />
        </button>
      </div>
    </div>
  );
};

export default Timer;
