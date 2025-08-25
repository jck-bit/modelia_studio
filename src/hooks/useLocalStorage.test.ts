import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should initialize with default value when no stored value exists', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    
    expect(result.current[0]).toBe('default');
  });

  it('should initialize with stored value when it exists', () => {
    localStorage.setItem('existing-key', JSON.stringify('stored value'));
    
    const { result } = renderHook(() => useLocalStorage('existing-key', 'default'));
    
    expect(result.current[0]).toBe('stored value');
  });

  it('should update localStorage when setting a new value', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
    
    act(() => {
      result.current[1]('new value');
    });
    
    expect(result.current[0]).toBe('new value');
    expect(localStorage.getItem('test-key')).toBe(JSON.stringify('new value'));
  });

  it('should update value directly', () => {
    const { result } = renderHook(() => useLocalStorage<number>('counter', 0));
    
    act(() => {
      result.current[1](1);
    });
    
    expect(result.current[0]).toBe(1);
    
    act(() => {
      result.current[1](2);
    });
    
    expect(result.current[0]).toBe(2);
  });

  it('should handle complex objects', () => {
    const complexObject = {
      name: 'Test',
      nested: { value: 123 },
      array: [1, 2, 3],
    };
    
    const { result } = renderHook(() => useLocalStorage('complex', complexObject));
    
    expect(result.current[0]).toEqual(complexObject);
    
    const newObject = { ...complexObject, name: 'Updated' };
    
    act(() => {
      result.current[1](newObject);
    });
    
    expect(result.current[0]).toEqual(newObject);
    expect(JSON.parse(localStorage.getItem('complex')!)).toEqual(newObject);
  });

  it('should handle invalid JSON in localStorage gracefully', () => {
    localStorage.setItem('invalid-json', 'not valid json');
    
    const { result } = renderHook(() => useLocalStorage('invalid-json', 'fallback'));
    
    expect(result.current[0]).toBe('fallback');
  });

  it('should handle localStorage errors gracefully', () => {
    const mockSetItem = localStorage.setItem;
    localStorage.setItem = () => {
      throw new Error('Storage quota exceeded');
    };
    
    const { result } = renderHook(() => useLocalStorage('test', 'initial'));
    
    // Should not throw
    act(() => {
      result.current[1]('new value');
    });
    
    // Value should still update in state even if localStorage fails
    expect(result.current[0]).toBe('new value');
    
    // Restore original setItem
    localStorage.setItem = mockSetItem;
  });

  it('should share state between hooks with same key', () => {
    // Clear localStorage to ensure clean state
    localStorage.clear();
    
    // First hook sets the initial value in localStorage
    const { result: result1 } = renderHook(() => useLocalStorage('shared', 'initial'));
    
    // Second hook should read from localStorage, not use its own initial value
    const { result: result2 } = renderHook(() => useLocalStorage('shared', 'different'));
    
    // Both should have the value from localStorage (set by first hook)
    expect(result1.current[0]).toBe('initial');
    expect(result2.current[0]).toBe('initial');
    
    // Updating one should update the other
    act(() => {
      result1.current[1]('updated');
    });
    
    // Both should now have the updated value
    expect(result1.current[0]).toBe('updated');
    expect(result2.current[0]).toBe('updated');
    expect(localStorage.getItem('shared')).toBe(JSON.stringify('updated'));
  });
});
