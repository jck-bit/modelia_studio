import React from 'react';
import type { StyleOption } from '../types';

interface StyleSelectorProps {
  style: StyleOption;
  options: StyleOption[];
  onChange: (style: StyleOption) => void;
}

const StyleSelector: React.FC<StyleSelectorProps> = ({ style, options, onChange }) => {
  return (
    <div className="relative">
      <select
        value={style}
        onChange={(e) => onChange(e.target.value as StyleOption)}
        className="appearance-none bg-black/30 backdrop-blur text-white px-4 py-3 pr-10 rounded-lg border border-white/10 focus:border-white/30 focus:outline-none transition-colors cursor-pointer"
        aria-label="Style selection"
      >
        {options.map((option) => (
          <option key={option} value={option} className="bg-gray-900">
            {option}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg className="h-5 w-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
};

export default StyleSelector;
