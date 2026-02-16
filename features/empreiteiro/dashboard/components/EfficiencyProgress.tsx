'use client';

import { useEffect, useState } from 'react';
import { animate } from 'framer-motion';

interface EfficiencyProgressProps {
  percentage: number;
  label: string;
}

export function EfficiencyProgress({ percentage, label }: EfficiencyProgressProps) {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, percentage, {
      duration: 1,
      ease: 'easeOut',
      onUpdate: (value) => setAnimatedValue(Math.round(value)),
    });
    return () => controls.stop();
  }, [percentage]);

  const circumference = 2 * Math.PI * 15.9155;
  const offset = circumference - (animatedValue / 100) * circumference;

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">
          {animatedValue}%
        </p>
      </div>
      <div className="w-16 h-16 relative">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <circle
            cx="18"
            cy="18"
            r="15.9155"
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="4"
          />
          <circle
            cx="18"
            cy="18"
            r="15.9155"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-300"
          />
        </svg>
      </div>
    </div>
  );
}
