import React from 'react';

interface PromptInputProps {
  prompt: string;
  onChange: (value: string) => void;
}

const PromptInput: React.FC<PromptInputProps> = ({ prompt, onChange }) => {
  return (
    <div className="mb-4">
      <input
        type="text"
        value={prompt}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Describe what you want to see"
        className="w-full bg-black/30 backdrop-blur text-white placeholder-white/50 px-4 py-3 rounded-lg border border-white/10 focus:border-white/30 focus:outline-none transition-colors"
        aria-label="Generation prompt"
      />
    </div>
  );
};

export default PromptInput;
