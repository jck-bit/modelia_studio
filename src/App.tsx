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
import {
  Header,
  PromptInput,
  StyleSelector,
  GenerateButton,
  ImageUpload,
  ErrorMessage,
  LivePreview,
  History,
} from './components';

const STYLE_OPTIONS: StyleOption[] = [
  'Editorial',
  'Streetwear',
  'Vintage',
  'Minimalist',
  'Futuristic',
];

function App() {
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
        setImageDataUrl('');
        setPrompt('');
        setStyle('Editorial');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        break;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        <Header />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Input Form */}
          <div className="space-y-6">
            {/* Main Input Card */}
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/10">
              <PromptInput prompt={prompt} onChange={setPrompt} />

              {/* Style Dropdown and Generate Button Row */}
              <div className="flex gap-3">
                <StyleSelector 
                  style={style} 
                  options={STYLE_OPTIONS} 
                  onChange={setStyle} 
                />
                <GenerateButton
                  isGenerating={isGenerating}
                  isDisabled={!imageDataUrl || !prompt}
                  retryCount={retryCount}
                  onClick={generate}
                  onAbort={handleAbort}
                />
              </div>
            </div>

            <ImageUpload ref={fileInputRef} onChange={handleFileChange} />

            <ErrorMessage error={error} />
          </div>

          {/* Right Column - Preview & History */}
          <div className="space-y-6">
            <LivePreview imageDataUrl={imageDataUrl} prompt={prompt} style={style} />

            <History history={history} onRestore={restoreFromHistory} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
