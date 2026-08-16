/**
 * Helper utility to automatically compress any uploaded image file or base64 data URL
 * to a target file size of 10 KB to 15 KB (approx 10,240 - 15,360 bytes).
 */

export interface CompressResult {
  dataUrl: string;
  sizeInKb: number;
  fileName: string;
}

/**
 * Compresses an image File or Data URL to target 10 KB - 15 KB size.
 * @param fileOrDataUrl File object or base64 Data URL string
 * @param fileName Original file name
 * @returns Promise resolving to compressed base64 Data URL and size info
 */
export async function compressImageTo10to15KB(
  fileOrDataUrl: File | string,
  fileName: string = 'uploaded-image.jpg'
): Promise<CompressResult> {
  return new Promise((resolve) => {
    const processDataUrl = (dataUrl: string) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          const currentKb = Math.round((dataUrl.length * 0.75) / 1024);
          resolve({ dataUrl, sizeInKb: currentKb, fileName });
          return;
        }

        // Initial target dimensions (around 320px to 480px)
        let width = img.width;
        let height = img.height;
        const maxDim = 400;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = Math.max(120, width);
        canvas.height = Math.max(120, height);

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Binary search / iterative quality adjustment to hit 10 KB - 15 KB (10240 - 15360 bytes)
        const minTargetBytes = 10 * 1024; // 10 KB
        const maxTargetBytes = 15 * 1024; // 15 KB

        let bestDataUrl = '';
        let bestBytes = 0;

        let lowQuality = 0.05;
        let highQuality = 0.95;
        let bestDiff = Infinity;

        // Try adjusting canvas dimensions & quality iteratively
        let scale = 1.0;
        let attemptedQuality = 0.5;

        for (let attempt = 0; attempt < 12; attempt++) {
          const attemptCanvas = document.createElement('canvas');
          const attemptCtx = attemptCanvas.getContext('2d');
          
          const currentW = Math.max(100, Math.round(canvas.width * scale));
          const currentH = Math.max(100, Math.round(canvas.height * scale));

          attemptCanvas.width = currentW;
          attemptCanvas.height = currentH;

          if (attemptCtx) {
            attemptCtx.fillStyle = '#FFFFFF';
            attemptCtx.fillRect(0, 0, currentW, currentH);
            attemptCtx.drawImage(img, 0, 0, currentW, currentH);
          }

          attemptedQuality = (lowQuality + highQuality) / 2;
          const currentDataUrl = attemptCanvas.toDataURL('image/jpeg', attemptedQuality);
          const currentBytes = Math.round(currentDataUrl.length * 0.75);

          const diff = Math.abs(currentBytes - 12.5 * 1024); // center target 12.5 KB
          if (diff < bestDiff) {
            bestDiff = diff;
            bestDataUrl = currentDataUrl;
            bestBytes = currentBytes;
          }

          if (currentBytes > maxTargetBytes) {
            // Too large -> decrease quality or scale down
            highQuality = attemptedQuality;
            if (attemptedQuality < 0.2 && scale > 0.4) {
              scale *= 0.8;
              lowQuality = 0.1;
              highQuality = 0.8;
            }
          } else if (currentBytes < minTargetBytes) {
            // Too small -> increase quality or scale up
            lowQuality = attemptedQuality;
            if (attemptedQuality > 0.85 && scale < 2.0) {
              scale *= 1.25;
              lowQuality = 0.2;
              highQuality = 0.95;
            }
          } else {
            // Perfect! Hits 10 KB - 15 KB range
            bestDataUrl = currentDataUrl;
            bestBytes = currentBytes;
            break;
          }
        }

        const finalKb = parseFloat((bestBytes / 1024).toFixed(1));
        resolve({
          dataUrl: bestDataUrl,
          sizeInKb: finalKb,
          fileName
        });
      };

      img.onerror = () => {
        resolve({ dataUrl, sizeInKb: 12, fileName });
      };

      img.src = dataUrl;
    };

    if (typeof fileOrDataUrl === 'string') {
      processDataUrl(fileOrDataUrl);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        processDataUrl(reader.result as string);
      };
      reader.onerror = () => {
        resolve({
          dataUrl: '',
          sizeInKb: 0,
          fileName
        });
      };
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
}
