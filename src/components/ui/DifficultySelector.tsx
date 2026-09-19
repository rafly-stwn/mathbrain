import React from 'react';
import type { Difficulty } from '../../types';

export interface DifficultySelectorProps {
  selected: Difficulty;
  onChange: (d: Difficulty) => void;
}

const DifficultySelector: React.FC<DifficultySelectorProps> = ({ selected, onChange }) => {
  const options: { value: Difficulty; label: string; color: string }[] = [
    { value: 'easy', label: 'Mudah', color: 'mint' },
    { value: 'medium', label: 'Sedang', color: 'lemon' },
    { value: 'hard', label: 'Sulit', color: 'peach' },
  ];

  return (
    <div className="flex items-center gap-2 bg-cream p-1 rounded-pill">
      {options.map((opt) => {
        const isSelected = selected === opt.value;
        
        let colorClass = '';
        if (isSelected) {
          switch(opt.color) {
            case 'mint': colorClass = 'bg-mint text-charcoal shadow-sm'; break;
            case 'lemon': colorClass = 'bg-lemon text-charcoal shadow-sm'; break;
            case 'peach': colorClass = 'bg-peach text-charcoal shadow-sm'; break;
            default: colorClass = 'bg-white text-charcoal shadow-sm';
          }
        } else {
          colorClass = 'text-warmgray hover:bg-white/50';
        }

        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-4 py-1.5 rounded-pill font-semibold text-sm transition-all duration-200 ${colorClass}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

export default DifficultySelector;

