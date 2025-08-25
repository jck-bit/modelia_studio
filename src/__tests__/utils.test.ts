import { describe, it, expect, vi } from 'vitest';
import {
  validateImageFile,
  fileToDataUrl,
  sleep,
  generateId,
  getBackoffDelay,
} from '../utils';

describe('utils', () => {
  describe('validateImageFile', () => {
    it('should accept valid PNG files under 10MB', () => {
      const file = new File([''], 'test.png', { type: 'image/png' });
      Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 }); // 5MB
      expect(validateImageFile(file)).toBe(null);
    });

    it('should accept valid JPG files under 10MB', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 8 * 1024 * 1024 }); // 8MB
      expect(validateImageFile(file)).toBe(null);
    });

    it('should reject files over 10MB', () => {
      const file = new File([''], 'test.png', { type: 'image/png' });
      Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 }); // 11MB
      expect(validateImageFile(file)).toBe('File size must be less than 10MB');
    });

    it('should reject non-image files', () => {
      const file = new File([''], 'test.txt', { type: 'text/plain' });
      expect(validateImageFile(file)).toBe('Please select an image file');
    });

    it('should reject unsupported image formats', () => {
      const file = new File([''], 'test.gif', { type: 'image/gif' });
      Object.defineProperty(file, 'size', { value: 1024 }); // 1KB
      expect(validateImageFile(file)).toBe('Please select a PNG or JPG file');
    });
  });

  describe('fileToDataUrl', () => {
    it('should convert file to data URL', async () => {
      const mockDataURL = 'data:image/png;base64,test';
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      
      // Mock FileReader
      const mockFileReader = {
        readAsDataURL: vi.fn(),
        onload: null as ((event: ProgressEvent<FileReader>) => void) | null,
        result: mockDataURL,
      };
      
      (globalThis as any).FileReader = vi.fn(() => mockFileReader);
      
      const promise = fileToDataUrl(file);
      
      // Trigger onload
      mockFileReader.onload!({ target: { result: mockDataURL } } as ProgressEvent<FileReader>);
      
      const result = await promise;
      expect(result).toBe(mockDataURL);
      expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(file);
    });

    it('should reject on FileReader error', async () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      
      const mockFileReader = {
        readAsDataURL: vi.fn(),
        onerror: null as ((event: ProgressEvent<FileReader>) => void) | null,
        onload: null as ((event: ProgressEvent<FileReader>) => void) | null,
      };
      
      (globalThis as any).FileReader = vi.fn(() => mockFileReader);
      
      const promise = fileToDataUrl(file);
      
      // Trigger onerror
      mockFileReader.onerror!({ target: { error: new Error('Read error') } } as ProgressEvent<FileReader>);
      
      await expect(promise).rejects.toThrow('Failed to read file');
    });
  });

  describe('sleep', () => {
    it('should delay for specified time', async () => {
      const start = Date.now();
      await sleep(100);
      const end = Date.now();
      
      expect(end - start).toBeGreaterThanOrEqual(90); // Allow some margin
      expect(end - start).toBeLessThan(200);
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(generateId());
      }
      expect(ids.size).toBe(100);
    });

    it('should generate IDs with expected format', () => {
      const id = generateId();
      expect(id).toMatch(/^gen_\d+_[a-z0-9]+$/);
      expect(id.length).toBeGreaterThan(15);
    });
  });

  describe('getBackoffDelay', () => {
    it('should calculate exponential backoff correctly', () => {
      expect(getBackoffDelay(0)).toBe(1000);
      expect(getBackoffDelay(1)).toBe(2000);
      expect(getBackoffDelay(2)).toBe(4000);
      expect(getBackoffDelay(3)).toBe(8000);
    });

    it('should cap at maximum delay', () => {
      expect(getBackoffDelay(10)).toBe(10000); // Should cap at 10 seconds
    });
  });
});
