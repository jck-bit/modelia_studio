// Image processing utilities
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_IMAGE_DIMENSION = 1920;

export const validateImageFile = (file: File): string | null => {
  if (!file.type.startsWith('image/')) {
    return 'Please select an image file';
  }
  if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
    return 'Please select a PNG or JPG file';
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'File size must be less than 10MB';
  }
  return null;
};

export const downscaleImage = (
  dataUrl: string,
  maxDimension: number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      let { width, height } = img;
      
      // Calculate new dimensions
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = (height / width) * maxDimension;
          width = maxDimension;
        } else {
          width = (width / height) * maxDimension;
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
};

export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

// Mock API utilities
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateId = () => {
  return `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Exponential backoff calculator
export const getBackoffDelay = (attempt: number): number => {
  return Math.min(1000 * Math.pow(2, attempt), 10000); // Max 10 seconds
};
