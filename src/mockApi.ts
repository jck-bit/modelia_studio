import type { MockAPIResponse, MockAPIError } from './types';
import { generateId } from './utils';

interface GenerateRequest {
  imageDataUrl: string;
  prompt: string;
  style: string;
}

export class MockAPI {
  private abortController: AbortController | null = null;

  async generate(request: GenerateRequest): Promise<MockAPIResponse> {
    // Create new abort controller for this request
    this.abortController = new AbortController();
    
    try {
      // Check if already aborted
      if (this.abortController?.signal.aborted) {
        throw new Error('Request aborted');
      }
      
      // Simulate network delay (1-2 seconds)
      const delay = 1000 + Math.random() * 1000;
      await this.delay(delay);
      
      // Check again after delay
      if (this.abortController?.signal.aborted) {
        throw new Error('Request aborted');
      }
      
      // Simulate 20% error rate
      if (Math.random() < 0.2) {
        throw { message: 'Model overloaded' } as MockAPIError;
      }
      
      // Generate mock response
      const response: MockAPIResponse = {
        id: generateId(),
        imageUrl: request.imageDataUrl, ///---not realllllll
        prompt: request.prompt,
        style: request.style,
        createdAt: new Date().toISOString(),
      };
      
      return response;
    } finally {
      this.abortController = null;
    }
  }

  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, ms);
      
      if (this.abortController) {
        this.abortController.signal.addEventListener('abort', () => {
          clearTimeout(timer);
          reject(new Error('Request aborted'));
        });
      }
    });
  }
}

export const mockApi = new MockAPI();
