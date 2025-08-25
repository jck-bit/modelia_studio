import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MockAPI } from './mockApi';

// Mock the utils module
vi.mock('./utils', () => ({
  sleep: vi.fn(() => Promise.resolve()),
  generateId: vi.fn(() => 'test-id'),
}));

describe('MockAPI', () => {
  let mockApi: MockAPI;

  beforeEach(() => {
    mockApi = new MockAPI();
    vi.clearAllMocks();
  });

  describe('generate', () => {
    it('should successfully generate when not simulating error', async () => {
      // Mock Math.random to return value that won't trigger error
      vi.spyOn(Math, 'random').mockReturnValue(0.5);

      const request = {
        imageDataUrl: 'test-data-url',
        prompt: 'test prompt',
        style: 'Editorial',
      };

      const result = await mockApi.generate(request);

      expect(result).toEqual({
        id: 'test-id',
        imageUrl: 'test-data-url',
        prompt: 'test prompt',
        style: 'Editorial',
        createdAt: expect.any(String),
      });
    });

    it('should throw error when simulating error (20% chance)', async () => {
      // Mock Math.random to return value that triggers error (< 0.2)
      vi.spyOn(Math, 'random').mockReturnValue(0.1);

      const request = {
        imageDataUrl: 'test-data-url',
        prompt: 'test prompt',
        style: 'Editorial',
      };

      await expect(mockApi.generate(request)).rejects.toThrow('Model overloaded');
    });

    it('should respect abort signal', async () => {
      // Mock Math.random to avoid error simulation
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      
      const request = {
        imageDataUrl: 'test-data-url',
        prompt: 'test prompt',
        style: 'Editorial',
      };

      // Start the request but don't await it
      const promise = mockApi.generate(request);
      
      // Abort immediately after starting
      mockApi.abort();

      await expect(promise).rejects.toThrow('Request aborted');
    });

    it('should handle abort during delay', async () => {
      // Mock Math.random to avoid error simulation
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      
      const request = {
        imageDataUrl: 'test-data-url',
        prompt: 'test prompt',
        style: 'Editorial',
      };

      // Start the request
      const promise = mockApi.generate(request);
      
      // Give it a tiny bit of time to start the delay
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Then abort
      mockApi.abort();

      await expect(promise).rejects.toThrow('Request aborted');
    });
  });

  describe('abort', () => {
    it('should nullify AbortController after abort', async () => {
      // Start a generate request to create an abort controller
      const request = {
        imageDataUrl: 'test-data-url',
        prompt: 'test prompt',
        style: 'Editorial',
      };
      
      // Start the request but don't await it
      const promise = mockApi.generate(request);
      
      // Abort immediately
      mockApi.abort();
      
      // AbortController should be null after abort
      const controller = (mockApi as any).abortController;
      expect(controller).toBeNull();
      
      // Clean up the promise
      await expect(promise).rejects.toThrow();
    });

    it('should not throw when aborting multiple times', () => {
      expect(() => {
        mockApi.abort();
        mockApi.abort();
        mockApi.abort();
      }).not.toThrow();
    });
  });
});
