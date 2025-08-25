import React from 'react';
import type { StyleOption } from '../types';

interface LivePreviewProps {
  imageDataUrl: string;
  prompt: string;
  style: StyleOption;
  onRemoveImage?: () => void;
}

const LivePreview: React.FC<LivePreviewProps> = ({ imageDataUrl, prompt, style, onRemoveImage }) => {
  return (
    <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/10">
      <h2 className="text-lg font-semibold text-white mb-4">Live Preview</h2>
      {imageDataUrl ? (
        <div className="space-y-4">
          <div className="relative">
            <img
              src={imageDataUrl}
              alt="Preview"
              className="w-full rounded-xl shadow-2xl"
            />
            {onRemoveImage && (
              <button
                onClick={onRemoveImage}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg shadow-lg transition-colors duration-200"
                aria-label="Remove image"
                title="Remove image"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <div className="space-y-3">
            {prompt && (
              <div>
                <h3 className="font-medium text-white/70 text-sm">Prompt:</h3>
                <p className="text-white">{prompt}</p>
              </div>
            )}
            {style && (
              <div>
                <h3 className="font-medium text-white/70 text-sm">Style:</h3>
                <p className="text-white">{style}</p>
              </div>
            )}
            {!prompt && !style && (
              <p className="text-white/50 text-sm">Enter a prompt and select a style to complete the preview</p>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-white/50">Upload an image to start</p>
        </div>
      )}
    </div>
  );
};

export default LivePreview;
