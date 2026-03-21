import React from 'react';

interface StickerProps {
  solarTerm: string;
  difficulty: string;
  duration: number;
  className?: string;
}

export default function Sticker({ solarTerm, difficulty, duration, className = '' }: StickerProps) {
  let colors = '';
  let borderColor = '';
  let label = '';

  switch (difficulty) {
    case 'beginner':
      colors = 'from-emerald-400 to-teal-500';
      borderColor = 'border-emerald-200';
      label = '初階';
      break;
    case 'intermediate':
      colors = 'from-blue-400 to-indigo-500';
      borderColor = 'border-blue-200';
      label = '中階';
      break;
    case 'advanced':
      colors = 'from-amber-400 to-orange-500';
      borderColor = 'border-amber-200';
      label = '高階';
      break;
    default:
      colors = 'from-stone-400 to-stone-500';
      borderColor = 'border-stone-200';
      label = '未知';
  }

  return (
    <div className={`bg-gradient-to-br ${colors} p-1 rounded-2xl shadow-lg transform transition-transform ${className}`}>
      <div className={`bg-white rounded-xl p-4 border-2 border-dashed ${borderColor} flex flex-col items-center justify-center text-center h-full`}>
        <div className="text-3xl font-black text-stone-800 tracking-widest mb-1">{solarTerm}</div>
        <div className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">YOGA24GO</div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-2 py-1 bg-stone-100 rounded-md text-stone-600">{label}</span>
          <span className="text-xs font-bold px-2 py-1 bg-stone-100 rounded-md text-stone-600">{duration}s</span>
        </div>
      </div>
    </div>
  );
}
