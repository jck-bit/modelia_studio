import React, { forwardRef } from 'react';

interface ImageUploadProps {
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const ImageUpload = forwardRef<HTMLInputElement, ImageUploadProps>(({ onChange }, ref) => {
  return (
    <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/10">
      <label
        htmlFor="image-upload"
        className="block text-sm font-medium text-white mb-3"
      >
        Upload Reference Image
      </label>
      <input
        ref={ref}
        id="image-upload"
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        onChange={onChange}
        className="block w-full text-sm text-white/70 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 file:cursor-pointer cursor-pointer"
        aria-label="Upload image file"
      />
      <p className="mt-2 text-xs text-white/50">PNG or JPG (max 10MB)</p>
    </div>
  );
});

ImageUpload.displayName = 'ImageUpload';

export default ImageUpload;
