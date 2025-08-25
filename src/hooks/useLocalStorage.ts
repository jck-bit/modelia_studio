import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  // Get from local storage then parse stored json or return initialValue
  const readValue = (): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  };

  const [storedValue, setStoredValue] = useState<T>(() => {
    const currentValue = readValue();
    // If nothing in localStorage, save the initial value
    if (typeof window !== 'undefined' && window.localStorage.getItem(key) === null) {
      try {
        window.localStorage.setItem(key, JSON.stringify(initialValue));
      } catch (error) {
        console.warn(`Error setting initial localStorage key "${key}":`, error);
      }
    }
    return currentValue;
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage.
  const setValue = (value: T) => {
    try {
      // Save to local storage
      window.localStorage.setItem(key, JSON.stringify(value));
      // Save state
      setStoredValue(value);
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  useEffect(() => {
    setStoredValue(readValue());
    
    // Listen for changes to this key in other windows/tabs/hooks
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.warn(`Error parsing localStorage change for key "${key}":`, error);
        }
      }
    };
    
    // Also listen for custom events for same-window updates
    const handleCustomStorageChange = (e: CustomEvent) => {
      if (e.detail.key === key) {
        setStoredValue(e.detail.value);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localStorage', handleCustomStorageChange as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorage', handleCustomStorageChange as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Modified setValue to also dispatch custom event
  const setValueAndNotify = (value: T) => {
    setValue(value);
    // Dispatch custom event for same-window updates
    window.dispatchEvent(new CustomEvent('localStorage', { 
      detail: { key, value } 
    }));
  };

  return [storedValue, setValueAndNotify] as const;
}
