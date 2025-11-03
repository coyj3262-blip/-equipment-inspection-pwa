import { useState, useRef } from "react";
import { uploadPhoto } from "../services/photoUpload";

type Photo = {
  file: File;
  preview: string;
  compressed?: Blob;
  downloadURL?: string;
  uploading?: boolean;
  error?: string;
};

type PhotoUploadProps = {
  inspectionId: string;
  maxPhotos?: number;
  onPhotosChange: (photoUrls: string[]) => void;
  required?: boolean;
};

async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Max width 1920px, maintain aspect ratio
        const MAX_WIDTH = 1920;
        const scale = Math.min(1, MAX_WIDTH / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Convert to JPEG with 80% quality
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          0.8
        );
      };

      img.onerror = reject;
      img.src = e.target?.result as string;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function PhotoUpload({ inspectionId, maxPhotos = 5, onPhotosChange, required }: PhotoUploadProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [compressing, setCompressing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setCompressing(true);

    // Compress images first
    const newPhotos: Photo[] = await Promise.all(
      files.slice(0, maxPhotos - photos.length).map(async (file) => {
        const preview = URL.createObjectURL(file);
        try {
          const compressed = await compressImage(file);
          return { file, preview, compressed, uploading: true };
        } catch (error) {
          console.error('Compression failed:', error);
          return { file, preview, uploading: true };
        }
      })
    );

    const updatedPhotos = [...photos, ...newPhotos].slice(0, maxPhotos);
    setPhotos(updatedPhotos);
    setCompressing(false);

    // Reset input
    if (inputRef.current) inputRef.current.value = '';

    // Upload photos to Firebase Storage in background
    uploadPhotosInBackground(updatedPhotos);
  }

  async function uploadPhotosInBackground(photoList: Photo[]) {
    const uploadPromises = photoList.map(async (photo) => {
      if (photo.downloadURL || photo.error) {
        return photo; // Already uploaded or failed
      }

      try {
        const blobToUpload = photo.compressed || photo.file;
        const downloadURL = await uploadPhoto(inspectionId, blobToUpload);
        return { ...photo, downloadURL, uploading: false };
      } catch (error) {
        console.error('Upload failed:', error);
        return { ...photo, uploading: false, error: 'Upload failed' };
      }
    });

    const uploadedPhotos = await Promise.all(uploadPromises);
    setPhotos(uploadedPhotos);

    // Notify parent with download URLs (excluding failed uploads)
    const downloadURLs = uploadedPhotos
      .filter(p => p.downloadURL)
      .map(p => p.downloadURL!);
    onPhotosChange(downloadURLs);
  }

  function removePhoto(index: number) {
    const updatedPhotos = photos.filter((_, i) => i !== index);
    setPhotos(updatedPhotos);

    // Notify parent with updated download URLs
    const downloadURLs = updatedPhotos
      .filter(p => p.downloadURL)
      .map(p => p.downloadURL!);
    onPhotosChange(downloadURLs);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={photos.length >= maxPhotos || compressing}
          className={`
            px-4 py-2 rounded-lg font-medium text-sm
            ${photos.length >= maxPhotos || compressing
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700'
            }
          `}
        >
          {compressing ? 'Compressing...' : `📷 Add Photo (${photos.length}/${maxPhotos})`}
        </button>
        {required && photos.length === 0 && (
          <span className="text-xs text-error">Required</span>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo, index) => (
            <div key={index} className="relative group">
              <img
                src={photo.preview}
                alt={`Photo ${index + 1}`}
                className={`w-full h-24 object-cover rounded-lg border-2 ${
                  photo.error ? 'border-error' : photo.downloadURL ? 'border-success' : 'border-gray-200'
                }`}
              />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="
                  absolute top-1 right-1
                  w-6 h-6 rounded-full bg-error text-white
                  opacity-0 group-hover:opacity-100 transition-opacity
                  flex items-center justify-center text-xs font-bold
                "
              >
                ×
              </button>
              {photo.uploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                  <div className="text-white text-xs font-medium">Uploading...</div>
                </div>
              )}
              {photo.error && (
                <div className="absolute bottom-1 left-1 bg-error text-white text-xs px-1 rounded">
                  Failed
                </div>
              )}
              {photo.downloadURL && !photo.uploading && (
                <div className="absolute bottom-1 left-1 bg-success text-white text-xs px-1 rounded">
                  ✓ Uploaded
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
