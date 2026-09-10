/**
 * imageCompressor.js
 * In-browser high-performance image compression using HTML5 Canvas.
 * Resizes large camera photos down to 1080px max dimension and compresses to WebP / JPEG (~80-120KB).
 */
export async function compressImage(file, { maxWidth = 1080, maxHeight = 1080, quality = 0.82 } = {}) {
  if (!file) return null;

  return new Promise((resolve, reject) => {
    // If SVG or gif or already very small (< 30KB), return directly
    if (file.type === 'image/svg+xml' || file.type === 'image/gif' || file.size < 30 * 1024) {
      resolve({
        blob: file,
        file: file,
        previewUrl: URL.createObjectURL(file),
        width: 0,
        height: 0,
        originalSize: file.size,
        compressedSize: file.size,
      });
      return;
    }

    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio scaling
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
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Compress to WebP
        const outputType = 'image/webp';
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve({
                blob: file,
                file: file,
                previewUrl: URL.createObjectURL(file),
                width,
                height,
                originalSize: file.size,
                compressedSize: file.size,
              });
              return;
            }

            const cleanFileName = file.name ? file.name.replace(/\.[^/.]+$/, '') + '.webp' : `img_${Date.now()}.webp`;
            const compressedFile = new File([blob], cleanFileName, { type: 'image/webp' });

            resolve({
              blob,
              file: compressedFile,
              previewUrl: URL.createObjectURL(blob),
              width,
              height,
              originalSize: file.size,
              compressedSize: blob.size,
            });
          },
          outputType,
          quality
        );
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}
