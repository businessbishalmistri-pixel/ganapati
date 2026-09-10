/**
 * imageCompressor.js
 * In-browser client-side image compression using HTML5 Canvas.
 * Compresses phone camera and high-res files to max 1080px and WebP/JPEG ~80-150KB.
 */
export async function compressImage(file, { maxWidth = 1080, maxHeight = 1080, quality = 0.82 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type || !file.type.startsWith('image/')) {
      return reject(new Error('Selected file is not an image'));
    }

    // Preserve SVGs
    if (file.type === 'image/svg+xml') {
      return resolve({
        file,
        blob: file,
        previewUrl: URL.createObjectURL(file),
        originalSize: file.size,
        compressedSize: file.size
      });
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to WebP
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
              const compressedFile = new File([blob], compressedName, {
                type: 'image/webp',
                lastModified: Date.now()
              });
              resolve({
                file: compressedFile,
                blob,
                previewUrl: URL.createObjectURL(blob),
                originalSize: file.size,
                compressedSize: compressedFile.size
              });
            } else {
              // Fallback to JPEG
              canvas.toBlob(
                (jpegBlob) => {
                  const jpegName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
                  const jpegFile = new File([jpegBlob], jpegName, {
                    type: 'image/jpeg',
                    lastModified: Date.now()
                  });
                  resolve({
                    file: jpegFile,
                    blob: jpegBlob,
                    previewUrl: URL.createObjectURL(jpegBlob),
                    originalSize: file.size,
                    compressedSize: jpegFile.size
                  });
                },
                'image/jpeg',
                quality
              );
            }
          },
          'image/webp',
          quality
        );
      };
      img.onerror = (err) => reject(new Error('Failed to load image in browser for compression'));
    };
    reader.onerror = (err) => reject(new Error('Failed to read image file'));
  });
}
