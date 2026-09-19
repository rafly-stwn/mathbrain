import React from 'react';

export interface ScoreBadgeProps {
  label: string;
  value: string | number;
  icon?: string;
  colorClass?: string;
}

const ScoreBadge: React.FC<ScoreBadgeProps> = ({
  label,
  value,
  icon,
  colorClass = 'bg-lavender/20 text-charcoal',
}) => {
  return (
    <div className={`rounded-pill px-3 py-1.5 flex items-center gap-2 ${colorClass}`}>
      {icon && <span className="text-lg leading-none">{icon}</span>}
      <div className="flex flex-col leading-tight">
        <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">
          {label}
        </span>
        <span className="font-bold text-sm">
          {value}
        </span>
      </div>
    </div>
  );
};

export default ScoreBadge;

