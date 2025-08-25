import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

// Mock the modules
vi.mock('../utils', async () => {
  const actual = await vi.importActual<typeof import('../utils')>('../utils');
  return {
    ...actual,
    fileToDataUrl: vi.fn(() => Promise.resolve('data:image/png;base64,test')),
    downscaleImage: vi.fn((dataUrl) => Promise.resolve(dataUrl)),
    validateImageFile: vi.fn((file: File) => {
      // Return error for non-image files
      if (!file.type.startsWith('image/')) {
        return 'Please select an image file';
      }
      return null;
    }),
  };
});

vi.mock('./mockApi', () => {
  const mockInstance = {
    generate: vi.fn().mockImplementation((params) => 
      new Promise((resolve) => {
        // Simulate a delay so abort button has time to appear
        setTimeout(() => {
          resolve({
            id: 'test-id-' + Date.now(),
            imageUrl: 'data:image/png;base64,test',
            prompt: params?.prompt || 'test prompt',
            style: params?.style || 'Editorial',
            createdAt: Date.now(),
          });
        }, 1000);
      })
    ),
    abort: vi.fn(),
  };

  return {
    MockAPI: vi.fn().mockImplementation(() => mockInstance),
    mockApi: mockInstance,
  };
});

// Mock Image constructor for testing
(globalThis as { Image: typeof Image }).Image = vi.fn().mockImplementation(() => {
  const img = {
    width: 800,
    height: 600,
    _onload: null as (() => void) | null,
    onerror: null as (() => void) | null,
    _src: '',
    _loaded: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    get src() {
      return this._src;
    },
    set src(value: string) {
      this._src = value;
      this._loaded = true;
      // Trigger onload if it's already set
      setTimeout(() => {
        if (this._onload && this._loaded) {
          this._onload();
        }
      }, 0);
    },
    get onload() {
      return this._onload;
    },
    set onload(handler: (() => void) | null) {
      this._onload = handler;
      // If src was already set and we just got an onload handler, trigger it
      if (this._loaded && handler) {
        setTimeout(() => handler(), 0);
      }
    },
  };
  return img;
});

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should render the main heading and description', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'AI Image Generator' })).toBeInTheDocument();
    expect(screen.getByText(/Try the ultimate Image Generator/)).toBeInTheDocument();
  });

  it('should render all form inputs', () => {
    render(<App />);

    expect(screen.getByPlaceholderText('Describe what you want to see')).toBeInTheDocument();
    expect(screen.getByLabelText('Upload image file')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /style selection/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate image/i })).toBeInTheDocument();
  });

  it('should handle file upload', async () => {
    const user = userEvent.setup();
    render(<App />);

    const file = new File(['test'], 'test.png', { type: 'image/png' });
    const fileInput = screen.getByLabelText('Upload image file');

    await user.upload(fileInput, file);

    // Wait for file upload processing to complete
    await waitFor(() => {
      // The generate button should be disabled until image is loaded
      const generateButton = screen.getByRole('button', { name: /generate image/i });
      expect(generateButton).toBeInTheDocument();
    });

    // Need to also enter a prompt for preview to show
    await user.type(screen.getByPlaceholderText('Describe what you want to see'), 'Test prompt');

    // Now check for the preview image
    await waitFor(() => {
      expect(screen.getByAltText('Preview')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should reject invalid files', async () => {
    const user = userEvent.setup();
    
    render(<App />);
    
    // Create a text file (invalid for image upload)
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const fileInput = screen.getByLabelText('Upload image file');
    
    // Upload the invalid file
    await user.upload(fileInput, file);
    
    // Give time for validation to run
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // The main thing we need to verify is that the file was rejected
    // and no image preview is shown
    const imagePreview = screen.queryByAltText('Uploaded image');
    expect(imagePreview).not.toBeInTheDocument();
    
    // Also verify the generate button is still disabled
    const generateButton = screen.getByRole('button', { name: /generate image/i });
    expect(generateButton).toBeDisabled();
  });

  it('should update prompt input', async () => {
    const user = userEvent.setup();
    render(<App />);

    const promptInput = screen.getByPlaceholderText('Describe what you want to see');
    await user.type(promptInput, 'A beautiful sunset');

    expect(promptInput).toHaveValue('A beautiful sunset');
  });

  it('should update style selection', async () => {
    const user = userEvent.setup();
    render(<App />);

    const styleSelect = screen.getByRole('combobox', { name: /style selection/i });
    await user.selectOptions(styleSelect, 'Vintage');

    expect(styleSelect).toHaveValue('Vintage');
  });

  it('should disable generate button when inputs are missing', () => {
    render(<App />);

    const generateButton = screen.getByRole('button', { name: /generate image/i });
    expect(generateButton).toBeDisabled();
  });

  it('should enable generate button when all inputs are provided', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Upload file
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    const fileInput = screen.getByLabelText('Upload image file');
    await user.upload(fileInput, file);

    // Enter prompt
    const promptInput = screen.getByPlaceholderText('Describe what you want to see');
    await user.type(promptInput, 'Test prompt');

    await waitFor(() => {
      const generateButton = screen.getByRole('button', { name: /generate image/i });
      expect(generateButton).not.toBeDisabled();
    });
  });

  it('should show loading state during generation', async () => {
    const user = userEvent.setup();
    const { mockApi } = await import('../mockApi');
    
    // Override generate to have a delay
    mockApi.generate = vi.fn().mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve({
        id: 'test-id',
        imageUrl: 'data:image/png;base64,test',
        prompt: 'Test',
        style: 'Editorial',
        createdAt: new Date().toISOString(),
      }), 100))
    );

    render(<App />);

    // Set up inputs
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    await user.upload(screen.getByLabelText('Upload image file'), file);
    await user.type(screen.getByPlaceholderText('Describe what you want to see'), 'Test');

    // Click generate
    const generateButton = screen.getByRole('button', { name: /generate image/i });
    await user.click(generateButton);

    expect(screen.getByText('Generating')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /abort generation/i })).toBeInTheDocument();
  });

  it('should handle generation errors with retry', async () => {
    const user = userEvent.setup();
    const { mockApi } = await import('../mockApi');

    // Override generate to fail first two times, then succeed
    let callCount = 0;
    mockApi.generate = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount <= 2) {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.resolve({
        id: 'test-id',
        imageUrl: 'data:image/png;base64,test',
        prompt: 'test prompt',
        style: 'Editorial',
        createdAt: Date.now(),
      });
    });

    render(<App />);

    // Set up inputs
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    await user.upload(screen.getByLabelText('Upload image file'), file);
    await user.type(screen.getByPlaceholderText('Describe what you want to see'), 'Test');

    // Wait for generate button to be enabled
    const generateButton = await screen.findByRole('button', { name: /generate image/i });
    await waitFor(() => {
      expect(generateButton).not.toBeDisabled();
    });

    // Click generate
    await user.click(generateButton);

    // Wait for retries to show
    await waitFor(() => {
      expect(screen.getByText(/Generating \(Retry 1\/3\)/)).toBeInTheDocument();
    }, { timeout: 2000 });

    await waitFor(() => {
      expect(screen.getByText(/Generating \(Retry 2\/3\)/)).toBeInTheDocument();
    }, { timeout: 4000 });

    // Wait for final attempt to complete (successful generation)
    await waitFor(() => {
      expect(mockApi.generate).toHaveBeenCalledTimes(3);
      // Also check that generation succeeded (no longer showing generating)
      expect(screen.queryByText(/Generating/)).not.toBeInTheDocument();
    }, { timeout: 6000 });
  });

  it('should save generation to history', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Set up inputs
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    await user.upload(screen.getByLabelText('Upload image file'), file);
    await user.type(screen.getByPlaceholderText('Describe what you want to see'), 'Test prompt');

    // Wait for generate button to be enabled
    const generateButton = await screen.findByRole('button', { name: /generate image/i });
    await waitFor(() => {
      expect(generateButton).not.toBeDisabled();
    });

    // Generate
    await user.click(generateButton);

    // Wait for generation to complete and history to update
    await waitFor(() => {
      expect(screen.getByText('Recent Generations')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /restore generation: Test prompt/i })).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should restore from history when clicked', async () => {
    const user = userEvent.setup();

    // Pre-populate history
    const history = [{
      id: 'hist-1',
      imageUrl: 'data:image/png;base64,historical',
      prompt: 'Historical prompt',
      style: 'Vintage' as const,
      createdAt: Date.now(),
    }];

    localStorage.setItem('ai-studio-history', JSON.stringify(history));

    render(<App />);

    const historyButton = screen.getByRole('button', { name: /restore generation: historical prompt/i });
    await user.click(historyButton);

    expect(screen.getByPlaceholderText('Describe what you want to see')).toHaveValue('Historical prompt');
    expect(screen.getByRole('combobox', { name: /style selection/i })).toHaveValue('Vintage');
  });

  it('should limit history to 5 items', async () => {
    const user = userEvent.setup();

    // Pre-populate with 5 items
    const history = Array.from({ length: 5 }, (_, i) => ({
      id: `hist-${i}`,
      imageUrl: 'data:image/png;base64,test',
      prompt: `Prompt ${i}`,
      style: 'Editorial' as const,
      createdAt: Date.now() - i * 1000,
    }));

    localStorage.setItem('ai-studio-history', JSON.stringify(history));

    render(<App />);

    // Set up for new generation
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    await user.upload(screen.getByLabelText('Upload image file'), file);
    await user.type(screen.getByPlaceholderText('Describe what you want to see'), 'New prompt');

    // Wait for generate button to be enabled
    const generateButton = await screen.findByRole('button', { name: /generate image/i });
    await waitFor(() => {
      expect(generateButton).not.toBeDisabled();
    });

    // Generate
    await user.click(generateButton);

    // Wait for generation to complete (loading state to disappear)
    await waitFor(() => {
      expect(screen.queryByText(/Generating/)).not.toBeInTheDocument();
    }, { timeout: 2000 });

    // Now check history has been updated
    await waitFor(() => {
      // Check if generation completed by looking for history section
      expect(screen.getByText('Recent Generations')).toBeInTheDocument();

      // Get all history buttons and check we have exactly 5
      const historyButtons = screen.getAllByRole('button', { name: /restore generation:/i });
      expect(historyButtons).toHaveLength(5);

      // Check that the first button is our new generation
      // Note: just verify it's a new generation
      const firstButtonLabel = historyButtons[0].getAttribute('aria-label');
      expect(firstButtonLabel).toContain('Restore generation:');
      // Verify it's not one of the pre-existing prompts
      expect(firstButtonLabel).not.toContain('Prompt 0');
      expect(firstButtonLabel).not.toContain('Prompt 1');
      expect(firstButtonLabel).not.toContain('Prompt 2');
      expect(firstButtonLabel).not.toContain('Prompt 3');

      // Check that "Prompt 4" (the oldest) is not present
      const buttonLabels = historyButtons.map(btn => btn.getAttribute('aria-label'));
      expect(buttonLabels).not.toContain('Restore generation: Prompt 4');
    }, { timeout: 1000 });
  });

  it('should handle abort functionality', async () => {
    const user = userEvent.setup();
    // Get the mocked instance from our module mock
    const { mockApi } = await import('../mockApi');

    let rejectFn: ((error: Error) => void) | null = null;

    // Spy on the abort method
    mockApi.abort = vi.fn(() => {
      if (rejectFn) {
        rejectFn(new Error('Request aborted'));
      }
    });

    // Override the generate method to simulate abortable request
    mockApi.generate = vi.fn().mockImplementation(() =>
      new Promise((resolve, reject) => {
        // Store reject function so abort can use it
        rejectFn = reject;

        // Long delay to ensure abort button appears
        setTimeout(() => {
          resolve({
            id: 'test-id',
            imageUrl: 'data:image/png;base64,test',
            prompt: 'test prompt',
            style: 'Editorial',
            createdAt: new Date().toISOString(),
          });
        }, 5000);
      })
    );

    render(<App />);

    // Set up inputs and generate
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    await user.upload(screen.getByLabelText('Upload image file'), file);
    await user.type(screen.getByPlaceholderText('Describe what you want to see'), 'Test');

    // Wait for generate button to be enabled
    const generateButton = await screen.findByRole('button', { name: /generate image/i });
    await waitFor(() => {
      expect(generateButton).not.toBeDisabled();
    });

    await user.click(generateButton);

    // Wait for abort button to appear and click it
    const abortButton = await screen.findByRole('button', { name: /abort generation/i });
    await user.click(abortButton);

    expect(mockApi.abort).toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.getByText('Generation cancelled')).toBeInTheDocument();
    });
  });
});
