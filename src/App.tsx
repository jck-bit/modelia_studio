import React, { useState, useCallback, useRef } from 'react';
import type { Generation, StyleOption } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import {
  validateImageFile,
  fileToDataUrl,
  downscaleImage,
  MAX_IMAGE_DIMENSION,
  getBackoffDelay,
} from './utils';
import { mockApi } from './mockApi';

const STYLE_OPTIONS: StyleOption[] = [
  'Editorial',
  'Streetwear',
  'Vintage',
  'Minimalist',
  'Futuristic',
];

function App() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string>('');
  const [prompt, setPrompt] = useState<string>('');
  const [style, setStyle] = useState<StyleOption>('Editorial');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [retryCount, setRetryCount] = useState<number>(0);
  const [history, setHistory] = useLocalStorage<Generation[]>('ai-studio-history', []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setImageFile(file);

    try {
      // Convert to data URL
      let dataUrl = await fileToDataUrl(file);

      // Check if downscaling is needed
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => (img.onload = resolve));

      if (img.width > MAX_IMAGE_DIMENSION || img.height > MAX_IMAGE_DIMENSION) {
        dataUrl = await downscaleImage(dataUrl, MAX_IMAGE_DIMENSION);
      }

      setImageDataUrl(dataUrl);
    } catch (err) {
      setError('Failed to process image');
      console.error(err);
    }
  }, []);

  // Generate with retry logic
  const generate = useCallback(async () => {
    if (!imageDataUrl || !prompt.trim()) {
      setError('Please upload an image and enter a prompt');
      return;
    }

    setIsGenerating(true);
    setError('');
    setRetryCount(0);

    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const result = await mockApi.generate({
          imageDataUrl,
          prompt,
          style,
        });

        // Add to history (keep only last 5)
        const newHistory = [result, ...history].slice(0, 5);
        setHistory(newHistory);

        setIsGenerating(false);
        setRetryCount(0);
        
        // Reset form
        setImageFile(null);
        setImageDataUrl('');
        setPrompt('');
        setStyle('Editorial');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        break;
      } catch (err: any) {
        attempt++;
        setRetryCount(attempt);

        if (err.message === 'Request aborted') {
          setError('Generation cancelled');
          break;
        }

        if (attempt >= maxRetries) {
          setError(`Failed after ${maxRetries} attempts: ${err.message || 'Unknown error'}`);
          break;
        }

        // Wait before retry with exponential backoff
        const delay = getBackoffDelay(attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    setIsGenerating(false);
  }, [imageDataUrl, prompt, style, history, setHistory]);

  // Abort generation
  const handleAbort = useCallback(() => {
    mockApi.abort();
    setIsGenerating(false);
  }, []);

  // Restore from history
  const restoreFromHistory = useCallback((generation: Generation) => {
    setImageDataUrl(generation.imageUrl);
    setPrompt(generation.prompt);
    setStyle(generation.style as StyleOption);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-teal-700 relative overflow-hidden">
      {/* Animated background effect */}
      <div className="absolute inset-0 bg-black/20"></div>
      
      <div className="container mx-auto px-4 py-8 max-w-6xl relative z-10">
        {/* Header */}
        <div className="mb-12">
          <nav className="text-white/70 mb-4 text-sm">
            <span>Home</span>
            <span className="mx-2">/</span>
            <span>AI Suite</span>
            <span className="mx-2">/</span>
            <span className="text-white">AI Image Generator</span>
          </nav>
          <h1 className="text-5xl font-bold text-white mb-4">AI Image Generator</h1>
          <p className="text-white/80 text-lg max-w-2xl">
            Try the ultimate Image Generator. Access the most advanced AI models and create AI images with just a prompt or an image reference.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Input Form */}
          <div className="space-y-6">
            {/* Main Input Card */}
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/10">
              {/* Prompt Input */}
              <div className="mb-4">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe what you want to see"
                  className="w-full bg-black/30 backdrop-blur text-white placeholder-white/50 px-4 py-3 rounded-lg border border-white/10 focus:border-white/30 focus:outline-none transition-colors"
                  aria-label="Generation prompt"
                />
              </div>

              {/* Style Dropdown and Generate Button Row */}
              <div className="flex gap-3">
                <div className="relative">
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value as StyleOption)}
                    className="appearance-none bg-black/30 backdrop-blur text-white px-4 py-3 pr-10 rounded-lg border border-white/10 focus:border-white/30 focus:outline-none transition-colors cursor-pointer"
                    aria-label="Style selection"
                  >
                    {STYLE_OPTIONS.map((option) => (
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
                
                <button
                  onClick={generate}
                  disabled={isGenerating || !imageDataUrl || !prompt}
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
                    onClick={handleAbort}
                    className="px-4 py-3 bg-red-500/20 backdrop-blur-md text-red-300 rounded-lg hover:bg-red-500/30 focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all"
                    aria-label="Abort generation"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Image Upload */}
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/10">
              <label
                htmlFor="image-upload"
                className="block text-sm font-medium text-white mb-3"
              >
                Upload Reference Image
              </label>
              <input
                ref={fileInputRef}
                id="image-upload"
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleFileChange}
                className="block w-full text-sm text-white/70 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 file:cursor-pointer cursor-pointer"
                aria-label="Upload image file"
              />
              <p className="mt-2 text-xs text-white/50">PNG or JPG (max 10MB)</p>
            </div>

            {/* Error Message */}
            {error && (
              <div
                className="p-4 bg-red-500/20 backdrop-blur-md border border-red-500/30 rounded-xl"
                role="alert"
              >
                <p className="text-red-200">{error}</p>
              </div>
            )}
          </div>

          {/* Right Column - Preview & History */}
          <div className="space-y-6">
            {/* Live Preview */}
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/10">
              <h2 className="text-lg font-semibold text-white mb-4">Live Preview</h2>
              {imageDataUrl && prompt && style ? (
                <div className="space-y-4">
                  <img
                    src={imageDataUrl}
                    alt="Preview"
                    className="w-full rounded-xl shadow-2xl"
                  />
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-medium text-white/70 text-sm">Prompt:</h3>
                      <p className="text-white">{prompt}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-white/70 text-sm">Style:</h3>
                      <p className="text-white">{style}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-white/50">Upload an image, enter a prompt, and select a style to see the preview</p>
                </div>
              )}
            </div>

            {/* History */}
            {history.length > 0 && (
              <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                <h2 className="text-lg font-semibold text-white mb-4">Recent Generations</h2>
                <div className="space-y-2">
                  {history.map((gen) => (
                    <button
                      key={gen.id}
                      onClick={() => restoreFromHistory(gen)}
                      className="w-full p-3 bg-white/5 backdrop-blur border border-white/10 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all text-left"
                      aria-label={`Restore generation: ${gen.prompt}`}
                    >
                      <div className="flex items-center space-x-3">
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
