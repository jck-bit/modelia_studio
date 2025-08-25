import React from 'react';
import type { Generation } from '../types';

interface HistoryProps {
  history: Generation[];
  onRestore: (generation: Generation) => void;
}

const History: React.FC<HistoryProps> = ({ history, onRestore }) => {
  if (history.length === 0) return null;

  return (
    <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/10">
      <h2 className="text-lg font-semibold text-white mb-4">Recent Generations</h2>
      <div className="space-y-2">
        {history.map((gen) => (
          <button
            key={gen.id}
            onClick={() => onRestore(gen)}
            className="w-full p-3 bg-white/5 backdrop-blur border border-white/10 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all text-left"
            aria-label={`Restore generation: ${gen.prompt}`}
          >
            <div className="flex items-center space-x-3 cursor-pointer">
              <img
                src={gen.imageUrl}
                alt={gen.prompt}
                className="w-12 h-12 object-cover rounded-lg"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{gen.prompt}</p>
                <p className="text-xs text-white/50">{gen.style}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default History;
