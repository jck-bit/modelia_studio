import React from 'react';

interface GenerateButtonProps {
  isGenerating: boolean;
  isDisabled: boolean;
  retryCount: number;
  onClick: () => void;
  onAbort: () => void;
}

const GenerateButton: React.FC<GenerateButtonProps> = ({
  isGenerating,
  isDisabled,
  retryCount,
  onClick,
  onAbort,
}) => {
  return (
    <div className="flex gap-3 flex-1">
      <button
        onClick={onClick}
        disabled={isGenerating || isDisabled}
        className="flex-1 px-6 py-3 bg-white/10 backdrop-blur text-white rounded-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 disabled:bg-white/5 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        aria-label="Generate image"
      >
        {isGenerating ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Generating{retryCount > 0 && ` (Retry ${retryCount}/3)`}</span>
          </>
        ) : (
          <>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Generate</span>
          </>
        )}
      </button>
      
      {isGenerating && (
        <button
          onClick={onAbort}
          className="px-4 py-3 bg-red-500/20 backdrop-blur-md text-red-300 rounded-lg hover:bg-red-500/30 focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all"
          aria-label="Abort generation"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default GenerateButton;
