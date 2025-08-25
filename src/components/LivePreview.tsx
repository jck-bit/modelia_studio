import React from 'react';
import type { StyleOption } from '../types';

interface LivePreviewProps {
  imageDataUrl: string;
  prompt: string;
  style: StyleOption;
}

const LivePreview: React.FC<LivePreviewProps> = ({ imageDataUrl, prompt, style }) => {
  return (
    <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/10">
      <h2 className="text-lg font-semibold text-white mb-4">Live Preview</h2>
      {imageDataUrl ? (
        <div className="space-y-4">
          <img
            src={imageDataUrl}
            alt="Preview"
            className="w-full rounded-xl shadow-2xl"
          />
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
