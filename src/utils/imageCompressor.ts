export interface CompressedImageResult {
  base64: string;
  blob: Blob;
  width: number;
  height: number;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  mimeType: string;
}

/**
 * Compresses an image file or blob on the client-side using HTML5 Canvas.
 * Automatically downscales dimensions while preserving aspect ratio.
 */
export async function compressImage(
  fileOrBlob: File | Blob,
  maxDimension = 1200,
  quality = 0.85
): Promise<CompressedImageResult> {
  const originalSizeBytes = fileOrBlob.size;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        let { width, height } = img;

        // Calculate aspect ratio scale
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get 2D canvas context'));
          return;
        }

        // High quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = 'image/jpeg';
        const base64 = canvas.toDataURL(mimeType, quality);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to generate image blob'));
              return;
            }

            resolve({
              base64,
              blob,
              width,
              height,
              originalSizeBytes,
              compressedSizeBytes: blob.size,
              mimeType,
            });
          },
          mimeType,
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image into DOM'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read image file'));
    };

    reader.readAsDataURL(fileOrBlob);
  });
}
